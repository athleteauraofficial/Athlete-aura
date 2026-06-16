-- WARNING: This drops the existing AthleteAura profile tables and their data.
-- Run this only when you want a clean Supabase profile schema.

drop trigger if exists on_auth_user_created_profile on auth.users;
drop function if exists public.handle_new_user_profile();
drop function if exists public.set_updated_at();

drop table if exists public.scout_coach_profiles cascade;
drop table if exists public.athlete_profiles cascade;
drop table if exists public.profiles cascade;

create table public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('athlete', 'scout_coach')),
  email text,
  full_name text,
  first_name text,
  last_name text,
  country text,
  current_club text,
  sport text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.athlete_profiles (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  main_position text not null,
  secondary_position text,
  date_of_birth date not null,
  height numeric(3, 0) check (height is null or (height >= 0 and height <= 999)),
  weight numeric(3, 0) check (weight is null or (weight >= 0 and weight <= 999)),
  preferred_foot text check (preferred_foot is null or preferred_foot in ('right', 'left', 'both')),
  instagram text,
  youtube text,
  tiktok text,
  profile_pic_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.scout_coach_profiles (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  role_title text not null,
  organization text,
  experience_years integer check (experience_years is null or experience_years >= 0),
  achievements text,
  certificates text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger athlete_profiles_set_updated_at
before update on public.athlete_profiles
for each row execute function public.set_updated_at();

create trigger scout_coach_profiles_set_updated_at
before update on public.scout_coach_profiles
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  selected_role text := new.raw_user_meta_data->>'role';
  display_name text := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name'
  );
begin
  if selected_role in ('athlete', 'scout_coach') then
    insert into public.profiles (user_id, role, email, full_name)
    values (new.id, selected_role, new.email, display_name)
    on conflict (user_id) do update
      set role = excluded.role,
          email = excluded.email,
          full_name = excluded.full_name;
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created_profile
after insert on auth.users
for each row execute function public.handle_new_user_profile();

alter table public.profiles enable row level security;
alter table public.athlete_profiles enable row level security;
alter table public.scout_coach_profiles enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.athlete_profiles to authenticated;
grant select, insert, update on public.scout_coach_profiles to authenticated;

create policy "Users can read their profile"
on public.profiles for select
using (auth.uid() = user_id);

create policy "Users can create their profile"
on public.profiles for insert
with check (auth.uid() = user_id);

create policy "Users can update their profile"
on public.profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can read their athlete profile"
on public.athlete_profiles for select
using (auth.uid() = user_id);

create policy "Users can create their athlete profile"
on public.athlete_profiles for insert
with check (auth.uid() = user_id);

create policy "Users can update their athlete profile"
on public.athlete_profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can read their scout coach profile"
on public.scout_coach_profiles for select
using (auth.uid() = user_id);

create policy "Users can create their scout coach profile"
on public.scout_coach_profiles for insert
with check (auth.uid() = user_id);

create policy "Users can update their scout coach profile"
on public.scout_coach_profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('profile-pictures', 'profile-pictures', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Users can upload their own profile picture" on storage.objects;
create policy "Users can upload their own profile picture"
on storage.objects for insert
with check (
  bucket_id = 'profile-pictures'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Users can update their own profile picture" on storage.objects;
create policy "Users can update their own profile picture"
on storage.objects for update
using (
  bucket_id = 'profile-pictures'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'profile-pictures'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "Profile pictures are public" on storage.objects;
create policy "Profile pictures are public"
on storage.objects for select
using (bucket_id = 'profile-pictures');

notify pgrst, 'reload schema';
