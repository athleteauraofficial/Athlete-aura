"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  hasSupabaseEnv,
  supabase,
  supabaseConfigError,
} from "@/lib/supabase";
import styles from "./public-profile.module.css";

function getDisplayName(profile) {
  return (
    profile.full_name?.trim() ||
    `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim() ||
    "Athlete"
  );
}

function getInitials(profile) {
  return getDisplayName(profile)
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getAge(dateOfBirth) {
  if (!dateOfBirth) return null;

  const birthDate = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }

  return age;
}

function formatDate(dateOfBirth) {
  if (!dateOfBirth) return null;

  const date = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateOfBirth;

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getSocialUrl(value, platform) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;

  const handle = value.replace(/^@/, "");
  const bases = {
    instagram: "https://instagram.com/",
    youtube: "https://youtube.com/@",
    tiktok: "https://tiktok.com/@",
  };

  return `${bases[platform]}${handle}`;
}

export default function PublicAthleteProfilePage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isNotFound, setIsNotFound] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadProfile() {
      if (!hasSupabaseEnv) {
        setError(supabaseConfigError);
        setIsLoading(false);
        return;
      }

      try {
        const { data: commonProfile, error: commonError } = await supabase
          .from("profiles")
          .select(
            "user_id,full_name,first_name,last_name,country,current_club,sport,role"
          )
          .eq("user_id", userId)
          .eq("role", "athlete")
          .maybeSingle();

        if (commonError) throw commonError;

        if (!commonProfile) {
          if (isMounted) setIsNotFound(true);
          return;
        }

        const { data: athleteDetails, error: detailsError } = await supabase
          .from("athlete_profiles")
          .select(
            "user_id,main_position,secondary_position,date_of_birth,height,weight,preferred_foot,instagram,youtube,tiktok"
          )
          .eq("user_id", userId)
          .maybeSingle();

        if (detailsError) throw detailsError;

        if (!athleteDetails) {
          if (isMounted) setIsNotFound(true);
          return;
        }

        if (isMounted) {
          setProfile({ ...commonProfile, ...athleteDetails });
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError.message || "Unable to load this athlete profile.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (userId) loadProfile();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const details = useMemo(() => {
    if (!profile) return [];

    return [
      { label: "Main position", value: profile.main_position },
      { label: "Secondary position", value: profile.secondary_position },
      { label: "Current club", value: profile.current_club },
      { label: "Country", value: profile.country },
      { label: "Date of birth", value: formatDate(profile.date_of_birth) },
      { label: "Height", value: profile.height ? `${profile.height} cm` : null },
      { label: "Weight", value: profile.weight ? `${profile.weight} kg` : null },
      { label: "Preferred foot / hand", value: profile.preferred_foot },
    ].filter((item) => item.value);
  }, [profile]);

  const socials = useMemo(() => {
    if (!profile) return [];

    return [
      {
        label: "Instagram",
        url: getSocialUrl(profile.instagram, "instagram"),
      },
      { label: "YouTube", url: getSocialUrl(profile.youtube, "youtube") },
      { label: "TikTok", url: getSocialUrl(profile.tiktok, "tiktok") },
    ].filter((item) => item.url);
  }, [profile]);

  if (isLoading) {
    return (
      <main className={styles.pageShell}>
        <p className={styles.status} role="status">
          Loading athlete profile...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.pageShell}>
        <section className={styles.statePanel}>
          <h1>Unable to load profile</h1>
          <p className={styles.error}>{error}</p>
          <Link className={styles.backLink} href="/discover">
            Back to Discover
          </Link>
        </section>
      </main>
    );
  }

  if (isNotFound || !profile) {
    return (
      <main className={styles.pageShell}>
        <section className={styles.statePanel}>
          <h1>Athlete not found</h1>
          <p>This public athlete profile does not exist or is unavailable.</p>
          <Link className={styles.backLink} href="/discover">
            Back to Discover
          </Link>
        </section>
      </main>
    );
  }

  const displayName = getDisplayName(profile);
  const age = getAge(profile.date_of_birth);

  return (
    <main className={styles.pageShell}>
      <div className={styles.container}>
        <Link className={styles.textLink} href="/discover">
          &larr; Back to Discover
        </Link>

        <header className={styles.profileHeader}>
          <div
            aria-label={`${displayName} profile photo`}
            className={styles.avatar}
            role="img"
          >
            {getInitials(profile)}
          </div>
          <div className={styles.identity}>
            <span className={styles.roleBadge}>Athlete</span>
            <h1>{displayName}</h1>
            <p>
              {[profile.main_position, profile.sport, profile.current_club]
                .filter(Boolean)
                .join(" | ")}
            </p>
          </div>
        </header>

        <section className={styles.summaryGrid} aria-label="Athlete summary">
          <div>
            <strong>{age ?? "—"}</strong>
            <span>Age</span>
          </div>
          <div>
            <strong>{profile.sport || "—"}</strong>
            <span>Sport</span>
          </div>
          <div>
            <strong>{profile.main_position || "—"}</strong>
            <span>Position</span>
          </div>
          <div>
            <strong>{profile.current_club || "Free agent"}</strong>
            <span>Current club</span>
          </div>
        </section>

        <section className={styles.section}>
          <h2>Athlete details</h2>
          {details.length > 0 ? (
            <dl className={styles.detailGrid}>
              {details.map((item) => (
                <div className={styles.detailItem} key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className={styles.muted}>No additional details available.</p>
          )}
        </section>

        {socials.length > 0 && (
          <section className={styles.section}>
            <h2>Social links</h2>
            <div className={styles.socialLinks}>
              {socials.map((social) => (
                <a
                  href={social.url}
                  key={social.label}
                  rel="noreferrer"
                  target="_blank"
                >
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
