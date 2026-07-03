-- AthleteAura Follow System
-- Run this in Supabase SQL Editor.

create table if not exists public.user_follows (
  follower_id uuid not null references public.profiles(user_id) on delete cascade,
  following_id uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);

alter table public.user_follows enable row level security;

grant usage on schema public to authenticated;
grant select, insert, delete on public.user_follows to authenticated;

drop policy if exists "Authenticated users can read follows" on public.user_follows;
create policy "Authenticated users can read follows"
on public.user_follows for select
to authenticated
using (true);

drop policy if exists "Users can follow as themselves" on public.user_follows;
create policy "Users can follow as themselves"
on public.user_follows for insert
to authenticated
with check (auth.uid() = follower_id and follower_id <> following_id);

drop policy if exists "Users can unfollow as themselves" on public.user_follows;
create policy "Users can unfollow as themselves"
on public.user_follows for delete
to authenticated
using (auth.uid() = follower_id);

notify pgrst, 'reload schema';
