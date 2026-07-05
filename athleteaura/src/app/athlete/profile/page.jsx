"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Heart, MessageCircle } from "lucide-react";
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

function getAge(dateValue) {
  if (!dateValue) return null;
  const birthDate = new Date(`${dateValue}T00:00:00`);
  if (Number.isNaN(birthDate.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDifference = today.getMonth() - birthDate.getMonth();
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age;
}

function getCompletion(profile) {
  const fields = [
    profile.first_name,
    profile.last_name,
    profile.country,
    profile.sport,
    profile.main_position,
    profile.date_of_birth,
    profile.height,
    profile.weight,
    profile.preferred_foot,
    profile.profile_pic_url,
    profile.current_club,
    profile.instagram || profile.youtube || profile.tiktok,
    profile.highlights?.length,
  ];
  return Math.round((fields.filter((value) => value !== null && value !== undefined && value !== "").length / fields.length) * 100);
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

function normalizeUrl(value) {
  const trimmedValue = value.trim();
  return /^https?:\/\//i.test(trimmedValue) ? trimmedValue : `https://${trimmedValue}`;
}

function formatPostDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AthleteProfilePage() {
  const router = useRouter();
  const photoInputRef = useRef(null);
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [profilePosts, setProfilePosts] = useState([]);
  const [activityStats, setActivityStats] = useState({
    profileViews: 0,
    likesReceived: 0,
    comments: 0,
  });
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPhotoMenuOpen, setIsPhotoMenuOpen] = useState(false);
  const [isPhotoSaving, setIsPhotoSaving] = useState(false);
  const [highlightTitle, setHighlightTitle] = useState("");
  const [highlightUrl, setHighlightUrl] = useState("");
  const [isHighlightSaving, setIsHighlightSaving] = useState(false);
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
          const { data: postRows, error: postsError } = await supabase
            .from("posts")
            .select("id,content,category,image_url,video_url,created_at")
            .eq("user_id", data.user.id)
            .order("created_at", { ascending: false });

          if (postsError) throw postsError;

          const postIds = (postRows ?? []).map((post) => post.id);
          let likesReceived = 0;
          let commentsCount = 0;
          let postsWithStats = postRows ?? [];

          if (postIds.length > 0) {
            const [{ data: likes }, { data: comments }] = await Promise.all([
              supabase.from("post_likes").select("post_id,user_id").in("post_id", postIds),
              supabase.from("comments").select("post_id,id").in("post_id", postIds),
            ]);

            const likesByPostId = (likes ?? []).reduce((acc, like) => {
              acc[like.post_id] = (acc[like.post_id] ?? 0) + 1;
              return acc;
            }, {});
            const commentsByPostId = (comments ?? []).reduce((acc, comment) => {
              acc[comment.post_id] = (acc[comment.post_id] ?? 0) + 1;
              return acc;
            }, {});

            likesReceived = (likes ?? []).length;
            commentsCount = (comments ?? []).length;
            postsWithStats = (postRows ?? []).map((post) => ({
              ...post,
              likes_count: likesByPostId[post.id] ?? 0,
              comments_count: commentsByPostId[post.id] ?? 0,
            }));
          }

          const { count: profileViews, error: profileViewsError } = await supabase
            .from("profile_views")
            .select("*", { count: "exact", head: true })
            .eq("profile_user_id", data.user.id);

          if (profileViewsError && profileViewsError.code !== "42P01") throw profileViewsError;

          setUserId(data.user.id);
          setProfile(loadedProfile);
          setDraft(loadedProfile);
          setProfilePosts(postsWithStats);
          setActivityStats({
            profileViews: profileViewsError ? 0 : profileViews ?? 0,
            likesReceived,
            comments: commentsCount,
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

  async function handleQuickPhotoUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError("");
    setMessage("");
    setIsPhotoSaving(true);

    try {
      const extension = file.name.split(".").pop() || "jpg";
      const path = `${userId}/profile.${extension}`;
      const { error: uploadError } = await supabase.storage
        .from("profile-pictures")
        .upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const publicUrl = supabase.storage.from("profile-pictures").getPublicUrl(path).data.publicUrl;
      const { error: updateError } = await supabase
        .from("athlete_profiles")
        .update({ profile_pic_url: publicUrl })
        .eq("user_id", userId);
      if (updateError) throw updateError;

      const updatedProfile = { ...profile, profile_pic_url: publicUrl };
      setProfile(updatedProfile);
      setDraft(updatedProfile);
      setMessage("Profile picture updated.");
      setIsPhotoMenuOpen(false);
    } catch (photoError) {
      setError(photoError.message);
    } finally {
      event.target.value = "";
      setIsPhotoSaving(false);
    }
  }

  async function handleDeletePhoto() {
    setError("");
    setMessage("");
    setIsPhotoSaving(true);

    try {
      const { data: files, error: listError } = await supabase.storage
        .from("profile-pictures")
        .list(userId);
      if (listError) throw listError;

      const paths = (files ?? []).map((file) => `${userId}/${file.name}`);
      if (paths.length > 0) {
        const { error: removeError } = await supabase.storage
          .from("profile-pictures")
          .remove(paths);
        if (removeError) throw removeError;
      }

      const { error: updateError } = await supabase
        .from("athlete_profiles")
        .update({ profile_pic_url: null })
        .eq("user_id", userId);
      if (updateError) throw updateError;

      const updatedProfile = { ...profile, profile_pic_url: null };
      setProfile(updatedProfile);
      setDraft(updatedProfile);
      setMessage("Profile picture removed.");
      setIsPhotoMenuOpen(false);
    } catch (photoError) {
      setError(photoError.message);
    } finally {
      setIsPhotoSaving(false);
    }
  }

  async function handleAddHighlight(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!highlightTitle.trim() || !highlightUrl.trim()) {
      setError("Add a title and link for the highlight.");
      return;
    }

    let url;
    try {
      url = normalizeUrl(highlightUrl);
      new URL(url);
    } catch {
      setError("Enter a valid highlight link.");
      return;
    }

    setIsHighlightSaving(true);
    const { data, error: insertError } = await supabase
      .from("athlete_highlights")
      .insert({ user_id: userId, title: highlightTitle.trim(), url })
      .select("id,title,url,created_at")
      .single();

    if (insertError) {
      setError(insertError.message);
    } else {
      const updatedProfile = {
        ...profile,
        highlights: [data, ...(profile.highlights ?? [])],
      };
      setProfile(updatedProfile);
      setDraft(updatedProfile);
      setHighlightTitle("");
      setHighlightUrl("");
      setMessage("Highlight added.");
    }
    setIsHighlightSaving(false);
  }

  async function handleDeleteHighlight(highlightId) {
    setError("");
    const { error: deleteError } = await supabase
      .from("athlete_highlights")
      .delete()
      .eq("id", highlightId)
      .eq("user_id", userId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    const updatedProfile = {
      ...profile,
      highlights: (profile.highlights ?? []).filter((highlight) => highlight.id !== highlightId),
    };
    setProfile(updatedProfile);
    setDraft(updatedProfile);
    setMessage("Highlight removed.");
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
    setMessage("");
    setError("");
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
        })
        .eq("user_id", userId);

      if (athleteError) {
        throw athleteError;
      }

      const savedProfile = {
        ...draft,
        full_name: fullName,
      };
      setProfile(savedProfile);
      setDraft(savedProfile);
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

  if (error && !profile) {
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
  const completion = getCompletion(profile);
  const age = getAge(profile.date_of_birth);

  return (
    <main className={styles.pageShell}>
      <div className={styles.container}>
        <header className={styles.profileHeader}>
          <div className={styles.avatarArea}>
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
            <button
              aria-label="Edit profile picture"
              className={styles.photoEditButton}
              disabled={isPhotoSaving}
              title="Edit profile picture"
              type="button"
              onClick={() => setIsPhotoMenuOpen((isOpen) => !isOpen)}
            >
              &#9998;
            </button>
            {isPhotoMenuOpen && (
              <div className={styles.photoMenu}>
                <button
                  disabled={isPhotoSaving}
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                >
                  {profile.profile_pic_url ? "Replace photo" : "Upload photo"}
                </button>
                {profile.profile_pic_url && (
                  <button
                    className={styles.deleteAction}
                    disabled={isPhotoSaving}
                    type="button"
                    onClick={handleDeletePhoto}
                  >
                    Delete photo
                  </button>
                )}
              </div>
            )}
            <input
              ref={photoInputRef}
              accept="image/*"
              className={styles.hiddenInput}
              type="file"
              onChange={handleQuickPhotoUpload}
            />
          </div>

          <div className={styles.identity}>
            <span className={styles.roleBadge}>Athlete</span>
            <h1>{displayName}</h1>
            <p>{[profile.main_position, profile.sport, profile.current_club].filter(Boolean).join(" | ")}</p>

            <div className={styles.actions}>
              <button className={styles.primaryLink} type="button" onClick={startEditing}>
                Edit profile
              </button>
            </div>
          </div>
        </header>

        <section className={styles.completionSection}>
          <div>
            <strong>{completion}% complete</strong>
            <span>Complete profiles give scouts a clearer view of your background.</span>
          </div>
          <div className={styles.progressTrack} aria-label={`${completion}% profile complete`}>
            <span style={{ width: `${completion}%` }} />
          </div>
        </section>

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
            <section className={styles.summaryGrid} aria-label="Athlete summary">
              <div><strong>{age ?? "-"}</strong><span>Age</span></div>
              <div><strong>{profile.main_position || "-"}</strong><span>Main position</span></div>
              <div><strong>{profile.current_club || "Free agent"}</strong><span>Current club</span></div>
              <div><strong>{profile.country || "-"}</strong><span>Country</span></div>
            </section>
            <section className={styles.activitySection} aria-label="Your activity">
              <h2>Your Activity</h2>
              <div className={styles.activityGrid}>
                <div>
                  <Eye size={30} />
                  <strong>{activityStats.profileViews}</strong>
                  <span>Profile views</span>
                </div>
                <div>
                  <Heart size={30} />
                  <strong>{activityStats.likesReceived}</strong>
                  <span>Likes received</span>
                </div>
                <div>
                  <MessageCircle size={30} />
                  <strong>{activityStats.comments}</strong>
                  <span>Comments</span>
                </div>
              </div>
            </section>
            <section className={styles.postsSection} aria-label="Your posts">
              <div className={styles.sectionHeading}>
                <div>
                  <h2>Your posts</h2>
                  <p>All posts you shared in Explore.</p>
                </div>
              </div>
              {profilePosts.length === 0 ? (
                <p className={styles.emptyHighlights}>No posts shared yet.</p>
              ) : (
                <div className={styles.postList}>
                  {profilePosts.map((post) => (
                    <article className={styles.postCard} key={post.id}>
                      <div className={styles.postMeta}>
                        <span>{post.category}</span>
                        <time>{formatPostDate(post.created_at)}</time>
                      </div>
                      <p>{post.content}</p>
                      {post.image_url && (
                        <Image
                          unoptimized
                          alt=""
                          className={styles.postImage}
                          height={420}
                          src={post.image_url}
                          width={760}
                        />
                      )}
                      {post.video_url && (
                        <video className={styles.postVideo} controls preload="metadata" src={post.video_url}>
                          <track kind="captions" />
                        </video>
                      )}
                      <div className={styles.postStats}>
                        <span><Heart size={16} />{post.likes_count ?? 0}</span>
                        <span><MessageCircle size={16} />{post.comments_count ?? 0}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
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

            <section className={styles.highlightSection} aria-label="Highlights">
              <div className={styles.sectionHeading}>
                <div>
                  <h2>Highlights</h2>
                  <p>Add match footage, reels, or performance videos.</p>
                </div>
              </div>

              <form className={styles.highlightForm} onSubmit={handleAddHighlight}>
                <input
                  aria-label="Highlight title"
                  placeholder="Highlight title"
                  value={highlightTitle}
                  onChange={(event) => setHighlightTitle(event.target.value)}
                />
                <input
                  aria-label="Highlight link"
                  inputMode="url"
                  placeholder="https://youtube.com/..."
                  value={highlightUrl}
                  onChange={(event) => setHighlightUrl(event.target.value)}
                />
                <button className={styles.primaryLink} disabled={isHighlightSaving} type="submit">
                  {isHighlightSaving ? "Adding..." : "Add highlight"}
                </button>
              </form>

              {(profile.highlights ?? []).length > 0 ? (
                <div className={styles.highlightList}>
                  {profile.highlights.map((highlight) => (
                    <div className={styles.highlightItem} key={highlight.id}>
                      <a href={highlight.url} rel="noreferrer" target="_blank">
                        <strong>{highlight.title}</strong>
                        <span>{highlight.url}</span>
                      </a>
                      <button
                        aria-label={`Delete ${highlight.title}`}
                        title="Delete highlight"
                        type="button"
                        onClick={() => handleDeleteHighlight(highlight.id)}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.emptyHighlights}>No highlights added yet.</p>
              )}
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
