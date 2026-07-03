-- AthleteAura Public Profile Access
-- Run this so logged-in users can view athlete/scout public profile details.

grant select on public.athlete_profiles to authenticated;
grant select on public.scout_coach_profiles to authenticated;

drop policy if exists "Authenticated users can read athlete public profiles" on public.athlete_profiles;
create policy "Authenticated users can read athlete public profiles"
on public.athlete_profiles for select
to authenticated
using (true);

drop policy if exists "Authenticated users can read scout coach public profiles" on public.scout_coach_profiles;
create policy "Authenticated users can read scout coach public profiles"
on public.scout_coach_profiles for select
to authenticated
using (true);

notify pgrst, 'reload schema';
