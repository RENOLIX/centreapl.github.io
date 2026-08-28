create table if not exists public.pause_sessions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  pause_type text not null check (pause_type in ('coffee','lunch')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  check (ended_at is null or ended_at >= started_at)
);
alter table public.agents drop constraint if exists agents_user_id_fkey;
alter table public.agents alter column user_id drop not null;
alter table public.agents add constraint agents_user_id_fkey foreign key(user_id) references public.users(id) on delete set null;
with ranked as (select id,row_number() over(partition by client_id order by assigned_at desc) rn from public.client_assignments where status='active')
update public.client_assignments ca set status='inactive' from ranked r where ca.id=r.id and r.rn>1;
drop index if exists public.one_active_assignment;
create unique index if not exists one_active_client_assignment on public.client_assignments(client_id) where status='active';
create or replace function public.current_agent_id() returns uuid language sql stable security definer set search_path=public as $$
  select id from public.agents where user_id=auth.uid() and active=true limit 1;
$$;
create unique index if not exists one_open_pause_per_agent on public.pause_sessions(agent_id) where ended_at is null;
create index if not exists pause_sessions_started_idx on public.pause_sessions(started_at desc);
alter table public.pause_sessions enable row level security;

create or replace function public.is_management() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.users where id=auth.uid() and role in ('admin','supervisor'));
$$;
drop policy if exists users_self_or_admin on public.users;
create policy users_self_or_management on public.users for select using(id=auth.uid() or public.is_management());
drop policy if exists admin_agents on public.agents;
create policy management_agents on public.agents for all using(public.is_management()) with check(public.is_management());
drop policy if exists admin_campaigns on public.campaigns;
create policy management_campaigns on public.campaigns for all using(public.is_management()) with check(public.is_management());
drop policy if exists admin_clients on public.clients;
create policy management_clients on public.clients for all using(public.is_management()) with check(public.is_management());
drop policy if exists admin_assignments on public.client_assignments;
create policy management_assignments on public.client_assignments for all using(public.is_management()) with check(public.is_management());
drop policy if exists admin_call_results on public.call_results;
create policy management_call_results on public.call_results for all using(public.is_management()) with check(public.is_management());
drop policy if exists admin_calls on public.calls;
create policy management_calls on public.calls for all using(public.is_management()) with check(public.is_management());
drop policy if exists admin_notes on public.notes;
create policy management_notes on public.notes for all using(public.is_management()) with check(public.is_management());
drop policy if exists admin_callbacks on public.callbacks;
create policy management_callbacks on public.callbacks for all using(public.is_management()) with check(public.is_management());
create policy pause_management on public.pause_sessions for select using(public.is_management());
create policy pause_agent_select on public.pause_sessions for select using(agent_id=public.current_agent_id());
create policy pause_agent_insert on public.pause_sessions for insert with check(agent_id=public.current_agent_id());
create policy pause_agent_update on public.pause_sessions for update using(agent_id=public.current_agent_id()) with check(agent_id=public.current_agent_id());

create or replace function public.claim_next_client() returns table(
  assignment_id uuid, client_id uuid, campaign_id uuid, first_name text, last_name text,
  phone text, email text, city text, metadata jsonb, campaign_name text, campaign_script text
) language plpgsql security definer set search_path=public as $$
declare aid uuid;
begin
  aid := public.current_agent_id();
  if aid is null then return; end if;
  return query
  select ca.id,c.id,ca.campaign_id,c.first_name,c.last_name,c.phone,c.email,c.city,c.metadata,cp.name,cp.description
  from public.client_assignments ca
  join public.clients c on c.id=ca.client_id
  left join public.campaigns cp on cp.id=ca.campaign_id
  where ca.agent_id=aid and ca.status='active' and (cp.id is null or cp.active=true)
  order by ca.assigned_at asc
  limit 1;
end;
$$;
grant execute on function public.claim_next_client() to authenticated;

create or replace function public.distribute_campaign_clients(p_campaign_id uuid,p_client_ids uuid[]) returns integer
language plpgsql security definer set search_path=public as $$
declare distributed integer;
begin
  if not public.is_management() then raise exception 'access denied'; end if;
  if coalesce(array_length(p_client_ids,1),0)=0 then return 0; end if;
  perform pg_advisory_xact_lock(hashtext(p_campaign_id::text));
  update public.client_assignments set status='inactive'
  where client_id=any(p_client_ids) and status='active';
  with ranked_agents as (
    select a.id,row_number() over(order by count(ca.id),a.code) as rn
    from public.agents a join public.users u on u.id=a.user_id and u.role='agent'
    left join public.client_assignments ca on ca.agent_id=a.id and ca.status='active'
    where a.active=true group by a.id,a.code
  ), agent_total as (select count(*)::integer total from ranked_agents),
  incoming as (select client_id,ordinality from unnest(p_client_ids) with ordinality x(client_id,ordinality))
  insert into public.client_assignments(client_id,agent_id,campaign_id,status)
  select i.client_id,a.id,p_campaign_id,'active'
  from incoming i cross join agent_total t join ranked_agents a on a.rn=((i.ordinality-1)%t.total)+1
  where t.total>0;
  get diagnostics distributed=row_count;
  if distributed=0 then raise exception 'no active agent'; end if;
  return distributed;
end;
$$;
grant execute on function public.distribute_campaign_clients(uuid,uuid[]) to authenticated;

create or replace function public.complete_agent_call(p_client_id uuid,p_result_id uuid,p_duration_seconds integer,p_summary text) returns uuid
language plpgsql security definer set search_path=public as $$
declare aid uuid; assignment_row public.client_assignments%rowtype; new_call_id uuid;
begin
  aid:=public.current_agent_id();
  if aid is null then raise exception 'active agent required'; end if;
  select * into assignment_row from public.client_assignments
  where client_id=p_client_id and agent_id=aid and status='active'
  order by assigned_at for update limit 1;
  if assignment_row.id is null then raise exception 'client not assigned'; end if;
  if not exists(select 1 from public.call_results where id=p_result_id and active=true) then raise exception 'invalid result'; end if;
  insert into public.calls(client_id,agent_id,campaign_id,result_id,duration_seconds,summary)
  values(p_client_id,aid,assignment_row.campaign_id,p_result_id,greatest(0,least(p_duration_seconds,86400)),left(coalesce(p_summary,''),2000)) returning id into new_call_id;
  update public.client_assignments set status='inactive' where id=assignment_row.id;
  return new_call_id;
end;
$$;
grant execute on function public.complete_agent_call(uuid,uuid,integer,text) to authenticated;

drop policy if exists agent_campaigns on public.campaigns;
create policy agent_campaigns on public.campaigns for select using(
  public.is_management() or exists(select 1 from public.client_assignments ca where ca.campaign_id=id and ca.agent_id=public.current_agent_id() and ca.status='active')
);
