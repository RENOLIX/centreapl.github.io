do $$ begin
  create type public.sale_status as enum ('pending','confirmed','cancelled');
exception when duplicate_object then null;
end $$;

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  call_id uuid unique references public.calls(id) on delete set null,
  client_id uuid references public.clients(id) on delete set null,
  agent_id uuid not null references public.agents(id) on delete restrict,
  campaign_id uuid references public.campaigns(id) on delete set null,
  status public.sale_status not null default 'pending',
  client_name text not null,
  client_phone text not null default '',
  product text not null default '',
  total text not null default '',
  note text not null default '',
  sold_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists sales_agent_sold_idx on public.sales(agent_id,sold_at desc);
create index if not exists sales_status_sold_idx on public.sales(status,sold_at desc);
alter table public.sales enable row level security;

drop policy if exists sales_admin_all on public.sales;
drop policy if exists sales_supervisor_select on public.sales;
drop policy if exists sales_supervisor_update on public.sales;
drop policy if exists sales_agent_select on public.sales;
drop policy if exists sales_agent_update on public.sales;
create policy sales_admin_all on public.sales for all using(public.is_admin()) with check(public.is_admin());
create policy sales_supervisor_select on public.sales for select using(public.supervisor_manages_agent(agent_id));
create policy sales_supervisor_update on public.sales for update using(public.supervisor_manages_agent(agent_id)) with check(public.supervisor_manages_agent(agent_id));
create policy sales_agent_select on public.sales for select using(agent_id=public.current_agent_id());
create policy sales_agent_update on public.sales for update using(agent_id=public.current_agent_id()) with check(agent_id=public.current_agent_id());
grant select,insert,update on public.sales to authenticated;

insert into public.sales(call_id,client_id,agent_id,campaign_id,client_name,client_phone,product,total,note,sold_at)
select c.id,c.client_id,c.agent_id,c.campaign_id,trim(concat_ws(' ',cl.first_name,cl.last_name)),cl.phone,
       coalesce(cl.metadata->>'produit',cl.metadata->>'produits',''),coalesce(cl.metadata->>'total',''),c.summary,c.called_at
from public.calls c join public.call_results cr on cr.id=c.result_id and cr.is_sale=true join public.clients cl on cl.id=c.client_id
on conflict(call_id) do nothing;

create or replace function public.complete_agent_call(p_client_id uuid,p_result_id uuid,p_duration_seconds integer,p_summary text) returns uuid
language plpgsql security definer set search_path=public as $$
declare aid uuid; assignment_row public.client_assignments%rowtype; new_call_id uuid; result_is_sale boolean; client_row public.clients%rowtype;
begin
  aid:=public.current_agent_id();
  if aid is null then raise exception 'active agent required'; end if;
  select * into assignment_row from public.client_assignments
  where client_id=p_client_id and agent_id=aid and status='active'
  order by assigned_at for update limit 1;
  if assignment_row.id is null then raise exception 'client not assigned'; end if;
  select is_sale into result_is_sale from public.call_results where id=p_result_id and active=true;
  if result_is_sale is null then raise exception 'invalid result'; end if;
  insert into public.calls(client_id,agent_id,campaign_id,result_id,duration_seconds,summary)
  values(p_client_id,aid,assignment_row.campaign_id,p_result_id,greatest(0,least(p_duration_seconds,86400)),left(coalesce(p_summary,''),2000)) returning id into new_call_id;
  if result_is_sale then
    select * into client_row from public.clients where id=p_client_id;
    insert into public.sales(call_id,client_id,agent_id,campaign_id,client_name,client_phone,product,total,note,sold_at)
    values(new_call_id,p_client_id,aid,assignment_row.campaign_id,trim(concat_ws(' ',client_row.first_name,client_row.last_name)),client_row.phone,
      coalesce(client_row.metadata->>'produit',client_row.metadata->>'produits',''),coalesce(client_row.metadata->>'total',''),left(coalesce(p_summary,''),2000),now());
  end if;
  update public.client_assignments set status='inactive' where id=assignment_row.id;
  return new_call_id;
end;
$$;
grant execute on function public.complete_agent_call(uuid,uuid,integer,text) to authenticated;
