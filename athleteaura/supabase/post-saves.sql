-- AthleteAura Saved Posts
-- Run this in Supabase SQL Editor after the community feed tables exist.

create table if not exists public.post_saves (
  post_id bigint not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.post_saves enable row level security;

grant select, insert, delete on public.post_saves to authenticated;

drop policy if exists "Users can read their saved posts" on public.post_saves;
create policy "Users can read their saved posts"
on public.post_saves for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can save posts as themselves" on public.post_saves;
create policy "Users can save posts as themselves"
on public.post_saves for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can unsave their saved posts" on public.post_saves;
create policy "Users can unsave their saved posts"
on public.post_saves for delete
to authenticated
using (auth.uid() = user_id);

notify pgrst, 'reload schema';
