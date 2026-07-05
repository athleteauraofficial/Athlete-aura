-- AthleteAura post videos
-- Run this in Supabase SQL Editor if your community feed tables already exist.

alter table public.posts
add column if not exists video_url text;

insert into storage.buckets (id, name, public)
values ('post-videos', 'post-videos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Users can upload their own post videos" on storage.objects;
create policy "Users can upload their own post videos"
on storage.objects for insert
with check (
  bucket_id = 'post-videos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can update their own post videos" on storage.objects;
create policy "Users can update their own post videos"
on storage.objects for update
using (
  bucket_id = 'post-videos'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'post-videos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can delete their own post videos" on storage.objects;
create policy "Users can delete their own post videos"
on storage.objects for delete
using (
  bucket_id = 'post-videos'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Post videos are public" on storage.objects;
create policy "Post videos are public"
on storage.objects for select
using (bucket_id = 'post-videos');

notify pgrst, 'reload schema';
