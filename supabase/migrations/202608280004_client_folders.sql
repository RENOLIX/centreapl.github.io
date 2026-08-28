create table if not exists public.client_folders (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(trim(name)) between 1 and 100),
  created_by uuid references public.users(id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);

alter table public.clients
  add column if not exists folder_id uuid references public.client_folders(id) on delete set null;

create index if not exists clients_folder_id_idx on public.clients(folder_id);
alter table public.client_folders enable row level security;

drop policy if exists management_client_folders on public.client_folders;
create policy management_client_folders on public.client_folders
  for all using (public.is_management()) with check (public.is_management());

grant select, insert, update, delete on public.client_folders to authenticated;
