create table if not exists public.supervisor_teams (
  id uuid primary key default gen_random_uuid(),
  supervisor_id uuid not null references public.users(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(supervisor_id, agent_id)
);
create index if not exists supervisor_teams_supervisor_idx on public.supervisor_teams(supervisor_id);
create index if not exists supervisor_teams_agent_idx on public.supervisor_teams(agent_id);
alter table public.campaigns add column if not exists created_by uuid references public.users(id) on delete set null default auth.uid();

create or replace function public.is_supervisor() returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.users where id=auth.uid() and role='supervisor');
$$;
create or replace function public.supervisor_manages_agent(p_agent_id uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.supervisor_teams where supervisor_id=auth.uid() and agent_id=p_agent_id);
$$;
create or replace function public.can_view_agent(p_agent_id uuid) returns boolean language sql stable security definer set search_path=public as $$
  select public.is_admin() or p_agent_id=public.current_agent_id() or public.supervisor_manages_agent(p_agent_id);
$$;
create or replace function public.can_view_user(p_user_id uuid) returns boolean language sql stable security definer set search_path=public as $$
  select p_user_id=auth.uid() or public.is_admin() or exists(
    select 1 from public.agents a join public.supervisor_teams st on st.agent_id=a.id
    where a.user_id=p_user_id and st.supervisor_id=auth.uid()
  );
$$;
create or replace function public.supervisor_can_access_client(p_client_id uuid) returns boolean language sql stable security definer set search_path=public as $$
  select exists(
    select 1 from public.client_assignments ca join public.supervisor_teams st on st.agent_id=ca.agent_id
    where ca.client_id=p_client_id and st.supervisor_id=auth.uid()
  );
$$;

alter table public.supervisor_teams enable row level security;
drop policy if exists supervisor_teams_admin on public.supervisor_teams;
drop policy if exists supervisor_teams_own on public.supervisor_teams;
create policy supervisor_teams_admin on public.supervisor_teams for all using(public.is_admin()) with check(public.is_admin());
create policy supervisor_teams_own on public.supervisor_teams for select using(supervisor_id=auth.uid());
grant select,insert,update,delete on public.supervisor_teams to authenticated;

drop policy if exists users_self_or_management on public.users;
drop policy if exists users_self_or_admin on public.users;
create policy users_scoped_select on public.users for select using(public.can_view_user(id));

drop policy if exists management_agents on public.agents;
drop policy if exists agent_self on public.agents;
create policy agents_scoped_select on public.agents for select using(public.can_view_agent(id));
create policy agents_admin_write on public.agents for all using(public.is_admin()) with check(public.is_admin());

drop policy if exists management_clients on public.clients;
drop policy if exists agent_assigned_clients on public.clients;
drop policy if exists agent_update_assigned_clients on public.clients;
create policy clients_admin_all on public.clients for all using(public.is_admin()) with check(public.is_admin());
create policy clients_supervisor_select on public.clients for select using(public.supervisor_can_access_client(id));
create policy clients_agent_select on public.clients for select using(exists(select 1 from public.client_assignments ca where ca.client_id=id and ca.agent_id=public.current_agent_id()));
create policy clients_agent_update on public.clients for update using(exists(select 1 from public.client_assignments ca where ca.client_id=id and ca.agent_id=public.current_agent_id() and ca.status='active'));

drop policy if exists management_assignments on public.client_assignments;
drop policy if exists agent_own_assignments on public.client_assignments;
create policy assignments_admin_all on public.client_assignments for all using(public.is_admin()) with check(public.is_admin());
create policy assignments_supervisor_select on public.client_assignments for select using(public.supervisor_manages_agent(agent_id));
create policy assignments_agent_select on public.client_assignments for select using(agent_id=public.current_agent_id());

drop policy if exists management_calls on public.calls;
drop policy if exists agent_calls on public.calls;
create policy calls_admin_all on public.calls for all using(public.is_admin()) with check(public.is_admin());
create policy calls_supervisor_select on public.calls for select using(public.supervisor_manages_agent(agent_id));
create policy calls_agent_all on public.calls for all using(agent_id=public.current_agent_id()) with check(agent_id=public.current_agent_id());

drop policy if exists management_notes on public.notes;
drop policy if exists agent_notes on public.notes;
create policy notes_admin_all on public.notes for all using(public.is_admin()) with check(public.is_admin());
create policy notes_supervisor_select on public.notes for select using(public.supervisor_manages_agent(agent_id));
create policy notes_agent_all on public.notes for all using(agent_id=public.current_agent_id()) with check(agent_id=public.current_agent_id());

drop policy if exists management_callbacks on public.callbacks;
drop policy if exists agent_callbacks on public.callbacks;
create policy callbacks_admin_all on public.callbacks for all using(public.is_admin()) with check(public.is_admin());
create policy callbacks_supervisor_select on public.callbacks for select using(public.supervisor_manages_agent(agent_id));
create policy callbacks_supervisor_update on public.callbacks for update using(public.supervisor_manages_agent(agent_id)) with check(public.supervisor_manages_agent(agent_id));
create policy callbacks_agent_all on public.callbacks for all using(agent_id=public.current_agent_id()) with check(agent_id=public.current_agent_id());

drop policy if exists pause_management on public.pause_sessions;
drop policy if exists pause_agent_select on public.pause_sessions;
drop policy if exists pause_agent_insert on public.pause_sessions;
drop policy if exists pause_agent_update on public.pause_sessions;
create policy pauses_admin_all on public.pause_sessions for all using(public.is_admin()) with check(public.is_admin());
create policy pauses_supervisor_select on public.pause_sessions for select using(public.supervisor_manages_agent(agent_id));
create policy pauses_agent_select on public.pause_sessions for select using(agent_id=public.current_agent_id());
create policy pauses_agent_insert on public.pause_sessions for insert with check(agent_id=public.current_agent_id());
create policy pauses_agent_update on public.pause_sessions for update using(agent_id=public.current_agent_id()) with check(agent_id=public.current_agent_id());

drop policy if exists management_campaigns on public.campaigns;
drop policy if exists agent_campaigns on public.campaigns;
create policy campaigns_admin_all on public.campaigns for all using(public.is_admin()) with check(public.is_admin());
create policy campaigns_supervisor_select on public.campaigns for select using(created_by=auth.uid() or exists(select 1 from public.client_assignments ca where ca.campaign_id=id and public.supervisor_manages_agent(ca.agent_id)));
create policy campaigns_supervisor_insert on public.campaigns for insert with check(public.is_supervisor() and created_by=auth.uid());
create policy campaigns_supervisor_update on public.campaigns for update using(public.is_supervisor() and created_by=auth.uid()) with check(created_by=auth.uid());
create policy campaigns_supervisor_delete on public.campaigns for delete using(public.is_supervisor() and created_by=auth.uid());
create policy campaigns_agent_select on public.campaigns for select using(exists(select 1 from public.client_assignments ca where ca.campaign_id=id and ca.agent_id=public.current_agent_id()));

drop policy if exists management_client_folders on public.client_folders;
create policy folders_admin_all on public.client_folders for all using(public.is_admin()) with check(public.is_admin());
create policy folders_supervisor_select on public.client_folders for select using(exists(select 1 from public.clients c where c.folder_id=id and public.supervisor_can_access_client(c.id)));

drop policy if exists management_call_results on public.call_results;
drop policy if exists admin_call_results on public.call_results;
create policy call_results_admin_write on public.call_results for all using(public.is_admin()) with check(public.is_admin());

create or replace function public.distribute_campaign_clients(p_campaign_id uuid,p_client_ids uuid[],p_agent_ids uuid[]) returns integer
language plpgsql security definer set search_path=public as $$
declare distributed integer; requested_agents integer; eligible_agents integer;
begin
  if not public.is_management() then raise exception 'access denied'; end if;
  if coalesce(array_length(p_client_ids,1),0)=0 or coalesce(array_length(p_agent_ids,1),0)=0 then raise exception 'clients and agents required'; end if;
  if public.is_supervisor() and exists(select 1 from unnest(p_agent_ids) x(id) where not public.supervisor_manages_agent(x.id)) then raise exception 'agent outside supervisor team'; end if;
  if public.is_supervisor() and exists(select 1 from unnest(p_client_ids) x(id) where not public.supervisor_can_access_client(x.id)) then raise exception 'client outside supervisor team'; end if;
  if not exists(select 1 from public.campaigns where id=p_campaign_id and active=true and (public.is_admin() or created_by=auth.uid() or exists(select 1 from public.client_assignments ca where ca.campaign_id=p_campaign_id and public.supervisor_manages_agent(ca.agent_id)))) then raise exception 'active campaign required'; end if;
  select count(distinct id) into requested_agents from unnest(p_agent_ids) selected(id);
  select count(*) into eligible_agents from public.agents a join public.users u on u.id=a.user_id where a.id=any(p_agent_ids) and a.active=true and u.role='agent';
  if eligible_agents<>requested_agents then raise exception 'invalid or inactive agent'; end if;
  perform pg_advisory_xact_lock(hashtext(p_campaign_id::text));
  update public.client_assignments set status='inactive' where client_id=any(p_client_ids) and status='active';
  with selected_agents as (
    select a.id,row_number() over(order by a.code,a.id) position from public.agents a join public.users u on u.id=a.user_id where a.id=any(p_agent_ids) and a.active=true and u.role='agent'
  ), agent_total as (select count(*)::integer total from selected_agents), unique_clients as (
    select client_id,row_number() over(order by first_position,client_id) position from (select client_id,min(ordinality) first_position from unnest(p_client_ids) with ordinality incoming(client_id,ordinality) group by client_id) d
  )
  insert into public.client_assignments(client_id,agent_id,campaign_id,status)
  select c.client_id,a.id,p_campaign_id,'active' from unique_clients c cross join agent_total t join selected_agents a on a.position=((c.position-1)%t.total)+1;
  get diagnostics distributed=row_count;
  return distributed;
end;
$$;
grant execute on function public.distribute_campaign_clients(uuid,uuid[],uuid[]) to authenticated;
