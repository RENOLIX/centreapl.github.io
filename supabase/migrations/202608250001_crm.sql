create extension if not exists pgcrypto;
create type public.user_role as enum ('admin','agent');
create type public.assignment_status as enum ('active','inactive');
create type public.callback_status as enum ('scheduled','completed','cancelled');

create table if not exists public.users (id uuid primary key references auth.users(id) on delete cascade, full_name text not null, email text not null unique, role public.user_role not null default 'agent', created_at timestamptz not null default now());
create table if not exists public.agents (id uuid primary key default gen_random_uuid(), user_id uuid not null unique references public.users(id) on delete cascade, code text not null unique, active boolean not null default true, created_at timestamptz not null default now());
create table if not exists public.campaigns (id uuid primary key default gen_random_uuid(), name text not null, description text not null default '', active boolean not null default true, created_at timestamptz not null default now());
create table if not exists public.clients (id uuid primary key default gen_random_uuid(), first_name text not null, last_name text not null, phone text not null, email text not null default '', city text not null default '', metadata jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create table if not exists public.client_assignments (id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade, agent_id uuid not null references public.agents(id) on delete cascade, campaign_id uuid references public.campaigns(id) on delete set null, status public.assignment_status not null default 'active', assigned_at timestamptz not null default now());
create unique index if not exists one_active_assignment on public.client_assignments(client_id, agent_id, campaign_id) where status='active';
create table if not exists public.call_results (id uuid primary key default gen_random_uuid(), label text not null unique, is_success boolean not null default false, is_sale boolean not null default false, active boolean not null default true);
create table if not exists public.calls (id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade, agent_id uuid not null references public.agents(id) on delete restrict, campaign_id uuid references public.campaigns(id) on delete set null, result_id uuid references public.call_results(id) on delete set null, duration_seconds integer not null default 0 check(duration_seconds>=0), summary text not null default '', called_at timestamptz not null default now());
create table if not exists public.notes (id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade, agent_id uuid not null references public.agents(id) on delete restrict, body text not null, created_at timestamptz not null default now());
create table if not exists public.callbacks (id uuid primary key default gen_random_uuid(), client_id uuid not null references public.clients(id) on delete cascade, agent_id uuid not null references public.agents(id) on delete restrict, scheduled_for timestamptz not null, status public.callback_status not null default 'scheduled', note text not null default '', created_at timestamptz not null default now());

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.users where id=auth.uid() and role='admin'); $$;
create or replace function public.current_agent_id() returns uuid language sql stable security definer set search_path=public as $$ select id from public.agents where user_id=auth.uid() limit 1; $$;

alter table public.users enable row level security; alter table public.agents enable row level security; alter table public.campaigns enable row level security; alter table public.clients enable row level security; alter table public.client_assignments enable row level security; alter table public.call_results enable row level security; alter table public.calls enable row level security; alter table public.notes enable row level security; alter table public.callbacks enable row level security;
create policy users_self_or_admin on public.users for select using (id=auth.uid() or public.is_admin());
create policy admin_agents on public.agents for all using(public.is_admin()) with check(public.is_admin());
create policy agent_self on public.agents for select using(user_id=auth.uid() or public.is_admin());
create policy admin_campaigns on public.campaigns for all using(public.is_admin()) with check(public.is_admin());
create policy agent_campaigns on public.campaigns for select using(exists(select 1 from public.client_assignments ca where ca.campaign_id=id and ca.agent_id=public.current_agent_id() and ca.status='active'));
create policy admin_clients on public.clients for all using(public.is_admin()) with check(public.is_admin());
create policy agent_assigned_clients on public.clients for select using(exists(select 1 from public.client_assignments ca where ca.client_id=id and ca.agent_id=public.current_agent_id() and ca.status='active'));
create policy agent_update_assigned_clients on public.clients for update using(exists(select 1 from public.client_assignments ca where ca.client_id=id and ca.agent_id=public.current_agent_id() and ca.status='active'));
create policy admin_assignments on public.client_assignments for all using(public.is_admin()) with check(public.is_admin());
create policy agent_own_assignments on public.client_assignments for select using(agent_id=public.current_agent_id());
create policy everyone_call_results on public.call_results for select using(auth.uid() is not null);
create policy admin_call_results on public.call_results for all using(public.is_admin()) with check(public.is_admin());
create policy admin_calls on public.calls for all using(public.is_admin()) with check(public.is_admin());
create policy agent_calls on public.calls for all using(agent_id=public.current_agent_id() and exists(select 1 from public.client_assignments ca where ca.client_id=client_id and ca.agent_id=public.current_agent_id() and ca.status='active')) with check(agent_id=public.current_agent_id());
create policy admin_notes on public.notes for all using(public.is_admin()) with check(public.is_admin());
create policy agent_notes on public.notes for all using(agent_id=public.current_agent_id()) with check(agent_id=public.current_agent_id());
create policy admin_callbacks on public.callbacks for all using(public.is_admin()) with check(public.is_admin());
create policy agent_callbacks on public.callbacks for all using(agent_id=public.current_agent_id()) with check(agent_id=public.current_agent_id());
insert into public.call_results(label,is_success,is_sale) values ('À rappeler',false,false),('Pas de réponse',false,false),('Intéressé',true,false),('Vente',true,true),('Refus',false,false) on conflict(label) do nothing;
