"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { hasSupabaseEnv, supabase, supabaseConfigError } from "@/lib/supabase";
import { getScoutProfile } from "@/lib/scoutProfile";
import styles from "./scout-profile.module.css";

function getInitials(profile) {
  const first = profile?.first_name?.trim()?.[0] ?? "";
  const last = profile?.last_name?.trim()?.[0] ?? "";
  const initials = `${first}${last}`.toUpperCase();

  if (initials) {
    return initials;
  }

  return profile?.full_name?.trim()?.[0]?.toUpperCase() ?? "S";
}

function getDisplayName(profile) {
  const fromParts = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
  return profile?.full_name?.trim() || fromParts || "Scout profile";
}

function formatMemberSince(createdAt) {
  if (!createdAt) {
    return null;
  }

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default function ScoutProfilePage() {
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
        router.push("/");
        return;
      }

      const userRole = data.user.user_metadata?.role;
      if (userRole && userRole !== "scout_coach") {
        router.push("/profile");
        return;
      }

      try {
        const scoutProfile = await getScoutProfile(data.user.id);
        if (isMounted) {
          setProfile(scoutProfile ? { ...scoutProfile, email: scoutProfile.email ?? data.user.email } : null);
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

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const stats = useMemo(() => {
    if (!profile) {
      return [];
    }

    return [
      {
        label: profile.experience_years === 1 ? "Year of experience" : "Years of experience",
        value:
          profile.experience_years === null || profile.experience_years === undefined
            ? "—"
            : profile.experience_years,
      },
      { label: "Sport", value: profile.sport || "—" },
      { label: "Country", value: profile.country || "—" },
    ];
  }, [profile]);

  const detailRows = useMemo(() => {
    if (!profile) {
      return [];
    }

    const memberSince = formatMemberSince(profile.created_at);

    return [
      { label: "Role", value: profile.role_title },
      { label: "Organization", value: profile.organization },
      { label: "Current club", value: profile.current_club },
      { label: "Sport", value: profile.sport },
      { label: "Country", value: profile.country },
      { label: "Email", value: profile.email },
      { label: "Member since", value: memberSince },
    ].filter((row) => row.value);
  }, [profile]);

  if (isLoading) {
    return (
      <main className={styles.pageShell}>
        <p className={styles.statusText}>Loading profile…</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className={styles.pageShell}>
        <div className={styles.emptyCard}>
          <p className={styles.errorMessage}>{error}</p>
          <Link className={styles.primaryLink} href="/">
            Back to start
          </Link>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className={styles.pageShell}>
        <div className={styles.emptyCard}>
          <h1>No profile yet</h1>
          <p>You haven&apos;t set up your scout profile. Complete it to show your details.</p>
          <Link className={styles.primaryLink} href="/profile">
            Complete my profile
          </Link>
        </div>
      </main>
    );
  }

  const displayName = getDisplayName(profile);
  const subtitleParts = [profile.role_title, profile.organization].filter(Boolean);

  return (
    <main className={styles.pageShell}>
      <div className={styles.container}>
        <header className={styles.profileHeader}>
          <div className={styles.avatarRing}>
            <div className={styles.avatar} aria-hidden="true">
              {getInitials(profile)}
            </div>
          </div>

          <div className={styles.headerInfo}>
            <div className={styles.headerTopRow}>
              <h1 className={styles.name}>{displayName}</h1>
              <div className={styles.actions}>
                <Link className={styles.editButton} href="/profile">
                  Edit profile
                </Link>
                <button className={styles.signOutButton} type="button" onClick={handleSignOut}>
                  Sign out
                </button>
              </div>
            </div>

            {subtitleParts.length > 0 && (
              <p className={styles.handle}>{subtitleParts.join(" · ")}</p>
            )}

            <div className={styles.statRow}>
              {stats.map((stat) => (
                <div className={styles.stat} key={stat.label}>
                  <span className={styles.statValue}>{stat.value}</span>
                  <span className={styles.statLabel}>{stat.label}</span>
                </div>
              ))}
            </div>
          </div>
        </header>

        <span className={styles.roleBadge}>Scout / Coach</span>

        {detailRows.length > 0 && (
          <section className={styles.detailsCard} aria-label="Profile details">
            <dl className={styles.detailGrid}>
              {detailRows.map((row) => (
                <div className={styles.detailItem} key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {profile.achievements && (
          <section className={styles.textCard} aria-label="Achievements">
            <h2>Achievements</h2>
            <p>{profile.achievements}</p>
          </section>
        )}

        {profile.certificates && (
          <section className={styles.textCard} aria-label="Certificates">
            <h2>Certificates</h2>
            <p>{profile.certificates}</p>
          </section>
        )}
      </div>
    </main>
  );
}
