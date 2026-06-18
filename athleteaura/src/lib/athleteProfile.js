import { supabase } from "@/lib/supabase";

const COMMON_FIELDS =
  "full_name,first_name,last_name,email,country,current_club,sport,role,created_at";
const ATHLETE_DETAIL_FIELDS =
  "main_position,secondary_position,date_of_birth,height,weight,preferred_foot,instagram,youtube,tiktok,profile_pic_url";

export async function getAthleteProfile(userId) {
  const { data: common, error: commonError } = await supabase
    .from("profiles")
    .select(COMMON_FIELDS)
    .eq("user_id", userId)
    .maybeSingle();

  if (commonError) {
    throw commonError;
  }

  const { data: details, error: detailsError } = await supabase
    .from("athlete_profiles")
    .select(ATHLETE_DETAIL_FIELDS)
    .eq("user_id", userId)
    .maybeSingle();

  if (detailsError) {
    throw detailsError;
  }

  if (!details) {
    return null;
  }

  return { ...common, ...details };
}
