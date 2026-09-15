-- Résultats et rappels du poste agent
update public.call_results
set label='Contacte argumenté'
where lower(trim(label)) in ('intéressé','interesse','intéressée','interessee');

-- Objectifs individuels visibles uniquement par leur bénéficiaire et l'administration.
create table if not exists public.performance_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  target_date date not null default (now() at time zone 'Africa/Algiers')::date,
  revenue_target numeric(14,2) not null default 0 check(revenue_target>=0),
  returns_target integer not null default 0 check(returns_target>=0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id,target_date)
);
create index if not exists performance_targets_user_day_idx on public.performance_targets(user_id,target_date);
alter table public.performance_targets enable row level security;
drop policy if exists performance_targets_admin_all on public.performance_targets;
drop policy if exists performance_targets_self_select on public.performance_targets;
create policy performance_targets_admin_all on public.performance_targets for all using(public.is_admin()) with check(public.is_admin());
create policy performance_targets_self_select on public.performance_targets for select using(user_id=auth.uid());
grant select,insert,update,delete on public.performance_targets to authenticated;

-- Vidéos d'aide privées et ciblées.
create table if not exists public.help_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null check(char_length(title) between 1 and 160),
  description text not null default '' check(char_length(description)<=2000),
  storage_path text not null unique,
  mime_type text not null,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create table if not exists public.help_video_recipients (
  video_id uuid not null references public.help_videos(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  primary key(video_id,user_id)
);
create index if not exists help_video_recipients_user_idx on public.help_video_recipients(user_id);
alter table public.help_videos enable row level security;
alter table public.help_video_recipients enable row level security;
drop policy if exists help_videos_admin_all on public.help_videos;
drop policy if exists help_videos_recipient_select on public.help_videos;
drop policy if exists help_recipients_admin_all on public.help_video_recipients;
drop policy if exists help_recipients_own_select on public.help_video_recipients;
create policy help_videos_admin_all on public.help_videos for all using(public.is_admin()) with check(public.is_admin());
create policy help_videos_recipient_select on public.help_videos for select using(exists(select 1 from public.help_video_recipients r where r.video_id=id and r.user_id=auth.uid()));
create policy help_recipients_admin_all on public.help_video_recipients for all using(public.is_admin()) with check(public.is_admin());
create policy help_recipients_own_select on public.help_video_recipients for select using(user_id=auth.uid());
grant select,insert,update,delete on public.help_videos,public.help_video_recipients to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('crm-help-videos','crm-help-videos',false,524288000,array['video/mp4','video/webm','video/quicktime'])
on conflict(id) do update set public=false,file_size_limit=524288000,allowed_mime_types=array['video/mp4','video/webm','video/quicktime'];
drop policy if exists help_video_storage_admin_all on storage.objects;
drop policy if exists help_video_storage_recipient_select on storage.objects;
create policy help_video_storage_admin_all on storage.objects for all to authenticated using(bucket_id='crm-help-videos' and public.is_admin()) with check(bucket_id='crm-help-videos' and public.is_admin());
create policy help_video_storage_recipient_select on storage.objects for select to authenticated using(bucket_id='crm-help-videos' and exists(select 1 from public.help_videos v join public.help_video_recipients r on r.video_id=v.id where v.storage_path=name and r.user_id=auth.uid()));
