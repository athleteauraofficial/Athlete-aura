"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getAthleteProfile } from "@/lib/athleteProfile";
import { hasSupabaseEnv, supabase, supabaseConfigError } from "@/lib/supabase";
import styles from "./athlete-profile.module.css";

const handPreferenceSports = new Set([
  "basketball",
  "tennis",
  "volleyball",
  "handball",
  "swimming",
  "boxing",
  "mma",
]);

const sportOptions = [
  "football",
  "basketball",
  "tennis",
  "volleyball",
  "handball",
  "swimming",
  "athletics",
  "boxing",
  "mma",
  "other",
];

const positionOptionsBySport = {
  football: ["Goalkeeper", "Center Back", "Full Back", "Wing Back", "Defensive Midfielder", "Central Midfielder", "Attacking Midfielder", "Winger", "Striker"],
  basketball: ["Point Guard", "Shooting Guard", "Small Forward", "Power Forward", "Center"],
  tennis: ["Singles Player", "Doubles Player", "All-court Player", "Baseline Player", "Serve-and-volley Player"],
  volleyball: ["Setter", "Outside Hitter", "Opposite Hitter", "Middle Blocker", "Libero", "Defensive Specialist"],
  handball: ["Goalkeeper", "Left Wing", "Right Wing", "Left Back", "Right Back", "Center Back", "Pivot"],
  swimming: ["Freestyle", "Backstroke", "Breaststroke", "Butterfly", "Individual Medley", "Relay"],
  athletics: ["Sprinter", "Middle Distance", "Long Distance", "Hurdles", "Jumps", "Throws", "Combined Events"],
  boxing: ["Orthodox", "Southpaw", "Switch Hitter", "Out-boxer", "Pressure Fighter", "Counter Puncher"],
  mma: ["Striker", "Wrestler", "Grappler", "Brazilian Jiu-Jitsu", "Kickboxer", "All-rounder"],
  other: ["Athlete"],
};

function getDisplayName(profile) {
  const name = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
  return name || profile?.full_name || "Athlete profile";
}

function getInitials(profile) {
  const name = getDisplayName(profile);
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  const date = new Date(`${dateValue}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? dateValue
    : date.toLocaleDateString(undefined, {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
}

function getPreferenceLabel(sport) {
  return handPreferenceSports.has(sport) ? "Preferred hand" : "Preferred foot";
}

function getSocialUrl(value, platform) {
  if (!value) {
    return null;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const handle = value.replace(/^@/, "");
  const bases = {
    instagram: "https://instagram.com/",
    tiktok: "https://tiktok.com/@",
    youtube: "https://youtube.com/@",
  };

  return `${bases[platform]}${handle}`;
}

export default function AthleteProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [userId, setUserId] = useState("");
  const [profilePic, setProfilePic] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!hasSupabaseEnv) {
        setError(supabaseConfigError);
        setIsLoading(false);
        return;
      }

      const { data, error: userError } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (userError || !data.user) {
        router.replace("/");
        return;
      }

      if (data.user.user_metadata?.role !== "athlete") {
        router.replace("/scout/profile");
        return;
      }

      try {
        const athleteProfile = await getAthleteProfile(data.user.id);
        if (!athleteProfile) {
          router.replace("/profile");
          return;
        }

        if (isMounted) {
          const loadedProfile = {
            ...athleteProfile,
            email: athleteProfile.email ?? data.user.email,
          };
          setUserId(data.user.id);
          setProfile(loadedProfile);
          setDraft(loadedProfile);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProfile();

    return () => {
      isMounted = false;
    };
  }, [router]);

  const details = useMemo(() => {
    if (!profile) {
      return [];
    }

    return [
      { label: "Main position", value: profile.main_position },
      { label: "Secondary position", value: profile.secondary_position },
      { label: "Current club", value: profile.current_club },
      { label: "Country", value: profile.country },
      { label: "Date of birth", value: formatDate(profile.date_of_birth) },
      { label: "Height", value: profile.height ? `${profile.height} cm` : null },
      { label: "Weight", value: profile.weight ? `${profile.weight} kg` : null },
      {
        label: getPreferenceLabel(profile.sport),
        value: profile.preferred_foot,
      },
    ].filter((item) => item.value);
  }, [profile]);

  const socials = useMemo(() => {
    if (!profile) {
      return [];
    }

    return [
      { label: "Instagram", url: getSocialUrl(profile.instagram, "instagram") },
      { label: "YouTube", url: getSocialUrl(profile.youtube, "youtube") },
      { label: "TikTok", url: getSocialUrl(profile.tiktok, "tiktok") },
    ].filter((item) => item.url);
  }, [profile]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  function updateDraft(field, value) {
    setDraft((current) => {
      const next = { ...current, [field]: value };

      if (field === "sport") {
        const positions = positionOptionsBySport[value] ?? [];
        next.main_position = positions.includes(current.main_position)
          ? current.main_position
          : "";
        next.secondary_position = positions.includes(current.secondary_position)
          ? current.secondary_position
          : "";
      }

      return next;
    });
  }

  function startEditing() {
    setDraft(profile);
    setProfilePic(null);
    setMessage("");
    setError("");
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraft(profile);
    setProfilePic(null);
    setError("");
    setIsEditing(false);
  }

  async function uploadProfilePicture() {
    if (!profilePic) {
      return draft.profile_pic_url;
    }

    const extension = profilePic.name.split(".").pop() || "jpg";
    const path = `${userId}/profile.${extension}`;
    const { error: uploadError } = await supabase.storage
      .from("profile-pictures")
      .upload(path, profilePic, { upsert: true });

    if (uploadError) {
      throw uploadError;
    }

    return supabase.storage.from("profile-pictures").getPublicUrl(path).data.publicUrl;
  }

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);

    try {
      const profilePicUrl = await uploadProfilePicture();
      const fullName = `${draft.first_name} ${draft.last_name}`.trim();

      const { error: commonError } = await supabase
        .from("profiles")
        .update({
          full_name: fullName,
          first_name: draft.first_name,
          last_name: draft.last_name,
          country: draft.country,
          current_club: draft.current_club || null,
          sport: draft.sport,
        })
        .eq("user_id", userId);

      if (commonError) {
        throw commonError;
      }

      const { error: athleteError } = await supabase
        .from("athlete_profiles")
        .update({
          main_position: draft.main_position,
          secondary_position: draft.secondary_position || null,
          date_of_birth: draft.date_of_birth,
          height: draft.height ? Number(draft.height) : null,
          weight: draft.weight ? Number(draft.weight) : null,
          preferred_foot: draft.preferred_foot || null,
          instagram: draft.instagram || null,
          youtube: draft.youtube || null,
          tiktok: draft.tiktok || null,
          profile_pic_url: profilePicUrl,
        })
        .eq("user_id", userId);

      if (athleteError) {
        throw athleteError;
      }

      const savedProfile = {
        ...draft,
        full_name: fullName,
        profile_pic_url: profilePicUrl,
      };
      setProfile(savedProfile);
      setDraft(savedProfile);
      setProfilePic(null);
      setIsEditing(false);
      setMessage("Profile updated.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className={styles.pageShell}>
        <p className={styles.statusText}>Loading profile...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.pageShell}>
        <div className={styles.emptyPanel}>
          <p className={styles.errorMessage}>{error}</p>
          <Link className={styles.primaryLink} href="/">
            Back to start
          </Link>
        </div>
      </main>
    );
  }

  if (!profile) {
    return null;
  }

  const displayName = getDisplayName(profile);

  return (
    <main className={styles.pageShell}>
      <div className={styles.container}>
        <header className={styles.profileHeader}>
          <div
            aria-label={`${displayName} profile picture`}
            className={styles.avatar}
            role="img"
            style={
              profile.profile_pic_url
                ? { backgroundImage: `url("${profile.profile_pic_url}")` }
                : undefined
            }
          >
            {!profile.profile_pic_url && getInitials(profile)}
          </div>

          <div className={styles.identity}>
            <span className={styles.roleBadge}>Athlete</span>
            <h1>{displayName}</h1>
            <p>{[profile.main_position, profile.sport, profile.current_club].filter(Boolean).join(" | ")}</p>

            <div className={styles.actions}>
              <button className={styles.primaryLink} type="button" onClick={startEditing}>
                Edit profile
              </button>
              <button className={styles.secondaryButton} type="button" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          </div>
        </header>

        {isEditing ? (
          <form className={styles.editSection} onSubmit={handleSave}>
            <div className={styles.editHeading}>
              <h2>Edit profile</h2>
              <p>Update your athlete information below.</p>
            </div>

            <div className={styles.editGrid}>
              <label>
                First name
                <input
                  required
                  value={draft.first_name ?? ""}
                  onChange={(event) =>
                    updateDraft("first_name", event.target.value.replace(/[^\p{L}\s]/gu, ""))
                  }
                />
              </label>
              <label>
                Last name
                <input
                  required
                  value={draft.last_name ?? ""}
                  onChange={(event) =>
                    updateDraft("last_name", event.target.value.replace(/[^\p{L}\s]/gu, ""))
                  }
                />
              </label>
              <label>
                Country
                <input
                  required
                  value={draft.country ?? ""}
                  onChange={(event) => updateDraft("country", event.target.value)}
                />
              </label>
              <label>
                Date of birth
                <input
                  required
                  type="date"
                  value={draft.date_of_birth ?? ""}
                  onChange={(event) => updateDraft("date_of_birth", event.target.value)}
                />
              </label>
              <label>
                Sport
                <select
                  required
                  value={draft.sport ?? ""}
                  onChange={(event) => updateDraft("sport", event.target.value)}
                >
                  {sportOptions.map((sport) => (
                    <option key={sport} value={sport}>
                      {sport}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Current club
                <input
                  value={draft.current_club ?? ""}
                  onChange={(event) => updateDraft("current_club", event.target.value)}
                />
              </label>
              <label>
                Main position
                <select
                  required
                  value={draft.main_position ?? ""}
                  onChange={(event) => updateDraft("main_position", event.target.value)}
                >
                  <option value="">Choose position</option>
                  {(positionOptionsBySport[draft.sport] ?? []).map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Secondary position
                <select
                  value={draft.secondary_position ?? ""}
                  onChange={(event) => updateDraft("secondary_position", event.target.value)}
                >
                  <option value="">None</option>
                  {(positionOptionsBySport[draft.sport] ?? []).map((position) => (
                    <option key={position} value={position}>
                      {position}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Height (cm)
                <input
                  inputMode="numeric"
                  maxLength={3}
                  value={draft.height ?? ""}
                  onChange={(event) =>
                    updateDraft("height", event.target.value.replace(/\D/g, "").slice(0, 3))
                  }
                />
              </label>
              <label>
                Weight (kg)
                <input
                  inputMode="numeric"
                  maxLength={3}
                  value={draft.weight ?? ""}
                  onChange={(event) =>
                    updateDraft("weight", event.target.value.replace(/\D/g, "").slice(0, 3))
                  }
                />
              </label>
              <label>
                {getPreferenceLabel(draft.sport)}
                <select
                  value={draft.preferred_foot ?? ""}
                  onChange={(event) => updateDraft("preferred_foot", event.target.value)}
                >
                  <option value="">Select</option>
                  <option value="right">Right</option>
                  <option value="left">Left</option>
                  <option value="both">Both</option>
                </select>
              </label>
              <label>
                Profile picture
                <input
                  accept="image/*"
                  type="file"
                  onChange={(event) => setProfilePic(event.target.files?.[0] ?? null)}
                />
              </label>
              <label>
                Instagram
                <input
                  value={draft.instagram ?? ""}
                  onChange={(event) => updateDraft("instagram", event.target.value)}
                />
              </label>
              <label>
                YouTube
                <input
                  value={draft.youtube ?? ""}
                  onChange={(event) => updateDraft("youtube", event.target.value)}
                />
              </label>
              <label>
                TikTok
                <input
                  value={draft.tiktok ?? ""}
                  onChange={(event) => updateDraft("tiktok", event.target.value)}
                />
              </label>
            </div>

            <div className={styles.editActions}>
              <button className={styles.secondaryButton} disabled={isSaving} type="button" onClick={cancelEditing}>
                Cancel
              </button>
              <button className={styles.primaryLink} disabled={isSaving} type="submit">
                {isSaving ? "Saving..." : "Save changes"}
              </button>
            </div>
          </form>
        ) : (
          <>
            <section className={styles.detailSection} aria-label="Athlete information">
              <h2>Profile information</h2>
              <dl className={styles.detailGrid}>
                {details.map((item) => (
                  <div className={styles.detailItem} key={item.label}>
                    <dt>{item.label}</dt>
                    <dd>{item.value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {socials.length > 0 && (
              <section className={styles.socialSection} aria-label="Social links">
                <h2>Social links</h2>
                <div className={styles.socialLinks}>
                  {socials.map((social) => (
                    <a href={social.url} key={social.label} rel="noreferrer" target="_blank">
                      {social.label}
                    </a>
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {message && <p className={styles.successMessage}>{message}</p>}
        {error && <p className={styles.errorMessage}>{error}</p>}
      </div>
    </main>
  );
}
