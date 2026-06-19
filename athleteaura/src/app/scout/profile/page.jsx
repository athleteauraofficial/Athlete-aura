"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getScoutProfile } from "@/lib/scoutProfile";
import { hasSupabaseEnv, supabase, supabaseConfigError } from "@/lib/supabase";
import styles from "./scout-profile.module.css";

const sports = [
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

function getDisplayName(profile) {
  const name = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
  return name || profile?.full_name || "Scout profile";
}

function getInitials(profile) {
  return getDisplayName(profile)
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getCompletion(profile) {
  const fields = [
    profile.first_name,
    profile.last_name,
    profile.country,
    profile.sport,
    profile.role_title,
    profile.organization,
    profile.experience_years,
    profile.achievements,
    profile.certificates,
  ];
  return Math.round((fields.filter((value) => value !== null && value !== undefined && value !== "").length / fields.length) * 100);
}

function formatMemberSince(createdAt) {
  if (!createdAt) return null;
  const date = new Date(createdAt);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default function ScoutProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [userId, setUserId] = useState("");
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

      let data;
      let userError;
      try {
        const result = await supabase.auth.getUser();
        data = result.data;
        userError = result.error;
      } catch {
        if (isMounted) {
          setError("Unable to reach Supabase. Check your connection and try again.");
          setIsLoading(false);
        }
        return;
      }

      if (!isMounted) return;
      if (userError || !data.user) {
        router.replace("/");
        return;
      }
      if (data.user.user_metadata?.role !== "scout_coach") {
        router.replace("/athlete/profile");
        return;
      }

      try {
        const loaded = await getScoutProfile(data.user.id);
        if (isMounted) {
          setUserId(data.user.id);
          setProfile(loaded);
          setDraft(loaded);
        }
      } catch (loadError) {
        if (isMounted) setError(loadError.message);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProfile();
    return () => {
      isMounted = false;
    };
  }, [router]);

  const details = useMemo(() => {
    if (!profile) return [];
    return [
      { label: "Role", value: profile.role_title },
      { label: "Organization", value: profile.organization },
      { label: "Current club", value: profile.current_club },
      { label: "Sport", value: profile.sport },
      { label: "Country", value: profile.country },
      { label: "Member since", value: formatMemberSince(profile.created_at) },
    ].filter((item) => item.value);
  }, [profile]);

  function updateDraft(field, value) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function startEditing() {
    setDraft(profile);
    setError("");
    setMessage("");
    setIsEditing(true);
  }

  function cancelEditing() {
    setDraft(profile);
    setError("");
    setIsEditing(false);
  }

  async function handleSave(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSaving(true);

    try {
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
      if (commonError) throw commonError;

      const { error: detailError } = await supabase
        .from("scout_coach_profiles")
        .update({
          role_title: draft.role_title,
          organization: draft.organization || null,
          experience_years: draft.experience_years ? Number(draft.experience_years) : null,
          achievements: draft.achievements || null,
          certificates: draft.certificates || null,
        })
        .eq("user_id", userId);
      if (detailError) throw detailError;

      const saved = { ...draft, full_name: fullName };
      setProfile(saved);
      setDraft(saved);
      setIsEditing(false);
      setMessage("Profile updated.");
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return <main className={styles.pageShell}><p className={styles.statusText}>Loading profile...</p></main>;
  }

  if (error && !profile) {
    return (
      <main className={styles.pageShell}>
        <div className={styles.emptyCard}>
          <p className={styles.errorMessage}>{error}</p>
          <Link className={styles.primaryButton} href="/">Back to start</Link>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className={styles.pageShell}>
        <div className={styles.emptyCard}>
          <h1>No profile yet</h1>
          <p>Complete your professional profile to show your experience and qualifications.</p>
          <Link className={styles.primaryButton} href="/profile">Complete my profile</Link>
        </div>
      </main>
    );
  }

  const completion = getCompletion(profile);

  return (
    <main className={styles.pageShell}>
      <div className={styles.container}>
        <header className={styles.profileHeader}>
          <div className={styles.avatar} aria-hidden="true">{getInitials(profile)}</div>
          <div className={styles.identity}>
            <span className={styles.roleBadge}>Scout / Coach</span>
            <h1>{getDisplayName(profile)}</h1>
            <p>{[profile.role_title, profile.organization, profile.sport].filter(Boolean).join(" | ")}</p>
            <div className={styles.actions}>
              <button className={styles.primaryButton} type="button" onClick={startEditing}>Edit profile</button>
            </div>
          </div>
        </header>

        <section className={styles.completionSection}>
          <div>
            <strong>{completion}% complete</strong>
            <span>A complete profile builds trust with athletes and clubs.</span>
          </div>
          <div className={styles.progressTrack} aria-label={`${completion}% profile complete`}>
            <span style={{ width: `${completion}%` }} />
          </div>
        </section>

        {isEditing ? (
          <form className={styles.editSection} onSubmit={handleSave}>
            <div className={styles.editHeading}>
              <h2>Edit professional profile</h2>
              <p>Keep your experience and credentials current.</p>
            </div>
            <div className={styles.editGrid}>
              <label>First name<input required value={draft.first_name ?? ""} onChange={(event) => updateDraft("first_name", event.target.value.replace(/[^\p{L}\s]/gu, ""))} /></label>
              <label>Last name<input required value={draft.last_name ?? ""} onChange={(event) => updateDraft("last_name", event.target.value.replace(/[^\p{L}\s]/gu, ""))} /></label>
              <label>Country<input required value={draft.country ?? ""} onChange={(event) => updateDraft("country", event.target.value)} /></label>
              <label>Sport<select required value={draft.sport ?? ""} onChange={(event) => updateDraft("sport", event.target.value)}>{sports.map((sport) => <option key={sport} value={sport}>{sport}</option>)}</select></label>
              <label>Role title<input required value={draft.role_title ?? ""} onChange={(event) => updateDraft("role_title", event.target.value)} /></label>
              <label>Organization<input value={draft.organization ?? ""} onChange={(event) => updateDraft("organization", event.target.value)} /></label>
              <label>Current club<input value={draft.current_club ?? ""} onChange={(event) => updateDraft("current_club", event.target.value)} /></label>
              <label>Years of experience<input inputMode="numeric" maxLength={2} value={draft.experience_years ?? ""} onChange={(event) => updateDraft("experience_years", event.target.value.replace(/\D/g, "").slice(0, 2))} /></label>
              <label className={styles.fullWidth}>Achievements<textarea rows={5} value={draft.achievements ?? ""} onChange={(event) => updateDraft("achievements", event.target.value)} /></label>
              <label className={styles.fullWidth}>Certificates<textarea rows={5} value={draft.certificates ?? ""} onChange={(event) => updateDraft("certificates", event.target.value)} /></label>
            </div>
            <div className={styles.editActions}>
              <button className={styles.secondaryButton} disabled={isSaving} type="button" onClick={cancelEditing}>Cancel</button>
              <button className={styles.primaryButton} disabled={isSaving} type="submit">{isSaving ? "Saving..." : "Save changes"}</button>
            </div>
          </form>
        ) : (
          <>
            <section className={styles.summaryGrid} aria-label="Professional summary">
              <div><strong>{profile.experience_years ?? "-"}</strong><span>Years experience</span></div>
              <div><strong>{profile.sport || "-"}</strong><span>Sport</span></div>
              <div><strong>{profile.country || "-"}</strong><span>Country</span></div>
            </section>
            <section className={styles.detailsCard}>
              <h2>Professional information</h2>
              <dl className={styles.detailGrid}>
                {details.map((item) => <div className={styles.detailItem} key={item.label}><dt>{item.label}</dt><dd>{item.value}</dd></div>)}
              </dl>
            </section>
            <div className={styles.contentGrid}>
              <section className={styles.textCard}><h2>Achievements</h2><p>{profile.achievements || "Add notable results, placements, or successful player development."}</p></section>
              <section className={styles.textCard}><h2>Certificates</h2><p>{profile.certificates || "Add coaching licenses and professional qualifications."}</p></section>
            </div>
          </>
        )}

        {message && <p className={styles.successMessage}>{message}</p>}
        {error && <p className={styles.errorMessage}>{error}</p>}
      </div>
    </main>
  );
}
