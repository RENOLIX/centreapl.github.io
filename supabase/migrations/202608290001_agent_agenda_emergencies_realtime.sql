alter table public.callbacks alter column client_id drop not null;
alter table public.callbacks add column if not exists title text not null default 'Rappel';
alter table public.callbacks add column if not exists updated_at timestamptz not null default now();

create table if not exists public.emergency_alerts (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  supervisor_id uuid references public.users(id) on delete cascade,
  agent_name text not null,
  agent_code text not null,
  message text not null default 'Demande d’aide urgente au poste agent',
  acknowledged_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists emergency_alerts_supervisor_created_idx on public.emergency_alerts(supervisor_id,created_at desc);
create index if not exists emergency_alerts_agent_created_idx on public.emergency_alerts(agent_id,created_at desc);
alter table public.emergency_alerts enable row level security;

drop policy if exists emergency_alerts_admin_select on public.emergency_alerts;
drop policy if exists emergency_alerts_supervisor_select on public.emergency_alerts;
drop policy if exists emergency_alerts_supervisor_update on public.emergency_alerts;
drop policy if exists emergency_alerts_agent_select on public.emergency_alerts;
create policy emergency_alerts_admin_select on public.emergency_alerts for select using(public.is_admin());
create policy emergency_alerts_supervisor_select on public.emergency_alerts for select using(supervisor_id=auth.uid());
create policy emergency_alerts_supervisor_update on public.emergency_alerts for update using(supervisor_id=auth.uid()) with check(supervisor_id=auth.uid());
create policy emergency_alerts_agent_select on public.emergency_alerts for select using(agent_id=public.current_agent_id());
grant select,update on public.emergency_alerts to authenticated;

create or replace function public.create_emergency_alert(p_message text default null)
returns setof public.emergency_alerts
language plpgsql
security definer
set search_path=public
as $$
declare
  v_agent public.agents%rowtype;
  v_name text;
  v_inserted integer := 0;
begin
  select * into v_agent from public.agents where user_id=auth.uid() and active=true;
  if v_agent.id is null then raise exception 'active agent required'; end if;
  select coalesce(nullif(trim(full_name),''),email) into v_name from public.users where id=auth.uid();

  return query
  insert into public.emergency_alerts(agent_id,supervisor_id,agent_name,agent_code,message)
  select v_agent.id,st.supervisor_id,v_name,v_agent.code,coalesce(nullif(trim(p_message),''),'Demande d’aide urgente au poste agent')
  from public.supervisor_teams st where st.agent_id=v_agent.id
  returning *;
  get diagnostics v_inserted = row_count;

  if v_inserted=0 then
    return query insert into public.emergency_alerts(agent_id,supervisor_id,agent_name,agent_code,message)
    values(v_agent.id,null,v_name,v_agent.code,coalesce(nullif(trim(p_message),''),'Demande d’aide urgente au poste agent')) returning *;
  end if;
end;
$$;
grant execute on function public.create_emergency_alert(text) to authenticated;

do $$
begin
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='pause_sessions') then
    alter publication supabase_realtime add table public.pause_sessions;
  end if;
  if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='emergency_alerts') then
    alter publication supabase_realtime add table public.emergency_alerts;
  end if;
end $$;
