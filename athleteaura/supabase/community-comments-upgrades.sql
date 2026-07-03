-- AthleteAura Community Comment Replies + Likes
-- Run this after community-feed-schema.sql.

alter table public.comments
add column if not exists parent_comment_id bigint references public.comments(id) on delete cascade;

create table if not exists public.comment_likes (
  comment_id bigint not null references public.comments(id) on delete cascade,
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

alter table public.comment_likes enable row level security;

grant usage on schema public to authenticated;
grant select, insert, delete on public.comment_likes to authenticated;

drop policy if exists "Authenticated users can read comment likes" on public.comment_likes;
create policy "Authenticated users can read comment likes"
on public.comment_likes for select
to authenticated
using (true);

drop policy if exists "Users can like comments as themselves" on public.comment_likes;
create policy "Users can like comments as themselves"
on public.comment_likes for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can unlike comments as themselves" on public.comment_likes;
create policy "Users can unlike comments as themselves"
on public.comment_likes for delete
to authenticated
using (auth.uid() = user_id);

notify pgrst, 'reload schema';
