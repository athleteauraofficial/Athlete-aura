-- AthleteAura Profile Stats
-- Run this in Supabase SQL Editor after the profiles table exists.

create table if not exists public.profile_views (
  profile_user_id uuid not null references public.profiles(user_id) on delete cascade,
  viewer_user_id uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_user_id, viewer_user_id),
  check (profile_user_id <> viewer_user_id)
);

alter table public.profile_views enable row level security;

grant select, insert on public.profile_views to authenticated;

drop policy if exists "Authenticated users can read profile views" on public.profile_views;
create policy "Authenticated users can read profile views"
on public.profile_views for select
to authenticated
using (true);

drop policy if exists "Users can record their own profile views" on public.profile_views;
create policy "Users can record their own profile views"
on public.profile_views for insert
to authenticated
with check (
  auth.uid() = viewer_user_id
  and profile_user_id <> viewer_user_id
);

notify pgrst, 'reload schema';
