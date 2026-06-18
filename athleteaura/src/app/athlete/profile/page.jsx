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
  const [isLoading, setIsLoading] = useState(true);
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
          setProfile({
            ...athleteProfile,
            email: athleteProfile.email ?? data.user.email,
          });
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
      { label: "Email", value: profile.email },
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
              <Link className={styles.primaryLink} href="/profile?edit=1">
                Edit profile
              </Link>
              <button className={styles.secondaryButton} type="button" onClick={handleSignOut}>
                Sign out
              </button>
            </div>
          </div>
        </header>

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
      </div>
    </main>
  );
}
