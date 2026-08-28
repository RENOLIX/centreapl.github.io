create or replace function public.distribute_campaign_clients(
  p_campaign_id uuid,
  p_client_ids uuid[],
  p_agent_ids uuid[]
) returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  distributed integer;
  requested_agents integer;
  eligible_agents integer;
begin
  if not public.is_management() then
    raise exception 'access denied';
  end if;

  if coalesce(array_length(p_client_ids, 1), 0) = 0 then
    raise exception 'clients required';
  end if;
  if coalesce(array_length(p_agent_ids, 1), 0) = 0 then
    raise exception 'agents required';
  end if;
  if not exists(select 1 from public.campaigns where id = p_campaign_id and active = true) then
    raise exception 'active campaign required';
  end if;

  select count(distinct id) into requested_agents from unnest(p_agent_ids) selected(id);
  select count(*) into eligible_agents
  from public.agents a
  join public.users u on u.id = a.user_id
  where a.id = any(p_agent_ids)
    and a.active = true
    and u.role = 'agent';

  if eligible_agents <> requested_agents then
    raise exception 'one or more selected agents are invalid or inactive';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_campaign_id::text));

  update public.client_assignments
  set status = 'inactive'
  where client_id = any(p_client_ids)
    and status = 'active';

  with selected_agents as (
    select
      a.id,
      row_number() over(order by a.code, a.id) as position
    from public.agents a
    join public.users u on u.id = a.user_id
    where a.id = any(p_agent_ids)
      and a.active = true
      and u.role = 'agent'
  ),
  agent_total as (
    select count(*)::integer as total from selected_agents
  ),
  unique_clients as (
    select
      client_id,
      row_number() over(order by first_position, client_id) as position
    from (
      select client_id, min(ordinality) as first_position
      from unnest(p_client_ids) with ordinality incoming(client_id, ordinality)
      group by client_id
    ) deduplicated
  )
  insert into public.client_assignments(client_id, agent_id, campaign_id, status)
  select
    client.client_id,
    agent.id,
    p_campaign_id,
    'active'
  from unique_clients client
  cross join agent_total total
  join selected_agents agent
    on agent.position = ((client.position - 1) % total.total) + 1;

  get diagnostics distributed = row_count;
  return distributed;
end;
$$;

grant execute on function public.distribute_campaign_clients(uuid, uuid[], uuid[]) to authenticated;
