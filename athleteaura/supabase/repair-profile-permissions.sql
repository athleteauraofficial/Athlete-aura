create table if not exists public.profiles (
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

create table if not exists public.athlete_profiles (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  position text not null,
  main_position text,
  secondary_position text,
  date_of_birth date not null,
  height numeric(5, 2),
  weight numeric(5, 2),
  preferred_foot text check (preferred_foot in ('right', 'left', 'both')),
  instagram text,
  youtube text,
  tiktok text,
  profile_pic_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.scout_coach_profiles (
  user_id uuid primary key references public.profiles(user_id) on delete cascade,
  role_title text not null,
  organization text,
  experience_years integer check (experience_years is null or experience_years >= 0),
  achievements text,
  certificates text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.athlete_profiles enable row level security;
alter table public.scout_coach_profiles enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.athlete_profiles to authenticated;
grant select, insert, update on public.scout_coach_profiles to authenticated;

drop policy if exists "Users can read their profile" on public.profiles;
create policy "Users can read their profile"
on public.profiles for select
using (auth.uid() = user_id);

drop policy if exists "Users can create their profile" on public.profiles;
create policy "Users can create their profile"
on public.profiles for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their profile" on public.profiles;
create policy "Users can update their profile"
on public.profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can read their athlete profile" on public.athlete_profiles;
create policy "Users can read their athlete profile"
on public.athlete_profiles for select
using (auth.uid() = user_id);

drop policy if exists "Users can create their athlete profile" on public.athlete_profiles;
create policy "Users can create their athlete profile"
on public.athlete_profiles for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their athlete profile" on public.athlete_profiles;
create policy "Users can update their athlete profile"
on public.athlete_profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can read their scout coach profile" on public.scout_coach_profiles;
create policy "Users can read their scout coach profile"
on public.scout_coach_profiles for select
using (auth.uid() = user_id);

drop policy if exists "Users can create their scout coach profile" on public.scout_coach_profiles;
create policy "Users can create their scout coach profile"
on public.scout_coach_profiles for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their scout coach profile" on public.scout_coach_profiles;
create policy "Users can update their scout coach profile"
on public.scout_coach_profiles for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

notify pgrst, 'reload schema';
