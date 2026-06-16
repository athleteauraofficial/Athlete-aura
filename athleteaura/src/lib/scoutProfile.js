import { supabase } from "@/lib/supabase";

// Repository: reads scout/coach profile data.
// The UI must never query Supabase directly — it goes through here.

const COMMON_FIELDS = "full_name,first_name,last_name,email,country,current_club,sport,role,created_at";
const SCOUT_DETAIL_FIELDS = "role_title,organization,experience_years,achievements,certificates";

/**
 * Loads the combined scout profile (shared + scout-specific details) for a user.
 * Returns null when the user has no profile rows yet.
 */
export async function getScoutProfile(userId) {
  const { data: common, error: commonError } = await supabase
    .from("profiles")
    .select(COMMON_FIELDS)
    .eq("user_id", userId)
    .maybeSingle();

  if (commonError) {
    throw commonError;
  }

  const { data: details, error: detailsError } = await supabase
    .from("scout_coach_profiles")
    .select(SCOUT_DETAIL_FIELDS)
    .eq("user_id", userId)
    .maybeSingle();

  if (detailsError) {
    throw detailsError;
  }

  if (!common && !details) {
    return null;
  }

  return { ...common, ...details };
}
