alter table public.agents add column if not exists last_seen_at timestamptz;
create index if not exists agents_last_seen_at_idx on public.agents(last_seen_at);

create or replace function public.touch_agent_presence() returns timestamptz
language plpgsql security definer set search_path=public as $$
declare touched_at timestamptz := now();
begin
  update public.agents set last_seen_at=touched_at where user_id=auth.uid() and active=true;
  return touched_at;
end;
$$;

create or replace function public.clear_agent_presence() returns void
language plpgsql security definer set search_path=public as $$
begin
  update public.agents set last_seen_at=null where user_id=auth.uid();
end;
$$;

grant execute on function public.touch_agent_presence() to authenticated;
grant execute on function public.clear_agent_presence() to authenticated;
