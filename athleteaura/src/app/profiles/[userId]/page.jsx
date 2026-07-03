"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Heart, MessageCircle } from "lucide-react";
import { hasSupabaseEnv, supabase, supabaseConfigError } from "@/lib/supabase";
import styles from "./public-user-profile.module.css";

function getDisplayName(profile) {
  const name = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
  return name || profile?.full_name || "AthleteAura user";
}

function getInitials(profile) {
  return getDisplayName(profile)
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function getRoleLabel(role) {
  if (role === "athlete") return "Athlete";
  if (role === "scout_coach") return "Coach / Scout";
  return "Member";
}

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ProfileAvatar({ profile }) {
  if (profile?.profile_pic_url) {
    return (
      <div
        aria-label={`${getDisplayName(profile)} profile photo`}
        className={styles.avatar}
        role="img"
        style={{ backgroundImage: `url("${profile.profile_pic_url}")` }}
      />
    );
  }

  return <div className={styles.avatar}>{getInitials(profile)}</div>;
}

export default function PublicUserProfilePage() {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [details, setDetails] = useState(null);
  const [posts, setPosts] = useState([]);
  const [likesByPostId, setLikesByPostId] = useState({});
  const [commentsByPostId, setCommentsByPostId] = useState({});
  const [profileViewsCount, setProfileViewsCount] = useState(0);
  const [likesReceivedCount, setLikesReceivedCount] = useState(0);
  const [currentUserId, setCurrentUserId] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowSaving, setIsFollowSaving] = useState(false);
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

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const activeUserId = sessionData.session?.user?.id ?? "";

        const { data: publicProfile, error: profileError } = await supabase
          .from("community_profiles")
          .select("user_id,role,full_name,first_name,last_name,country,current_club,sport,profile_pic_url")
          .eq("user_id", userId)
          .maybeSingle();

        if (profileError) throw profileError;
        if (!publicProfile) {
          setError("This profile is not available.");
          return;
        }

        let detailRows = null;
        if (publicProfile.role === "athlete") {
          const { data, error: athleteError } = await supabase
            .from("athlete_profiles")
            .select("main_position,secondary_position,height,weight,preferred_foot")
            .eq("user_id", userId)
            .maybeSingle();
          if (athleteError) throw athleteError;
          detailRows = data;
        }

        if (publicProfile.role === "scout_coach") {
          const { data, error: scoutError } = await supabase
            .from("scout_coach_profiles")
            .select("role_title,organization,experience_years,achievements,certificates")
            .eq("user_id", userId)
            .maybeSingle();
          if (scoutError) throw scoutError;
          detailRows = data;
        }

        const { data: postRows, error: postsError } = await supabase
          .from("posts")
          .select("id,user_id,content,category,image_url,created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (postsError) throw postsError;

        const shouldTrackView = activeUserId && activeUserId !== userId;
        if (shouldTrackView) {
          const { error: viewError } = await supabase
            .from("profile_views")
            .upsert(
              {
                profile_user_id: userId,
                viewer_user_id: activeUserId,
              },
              {
                ignoreDuplicates: true,
                onConflict: "profile_user_id,viewer_user_id",
              }
            );

          if (viewError && viewError.code !== "42P01") throw viewError;
        }

        const [
          { count: followers, error: followersError },
          { count: following, error: followingError },
          { count: profileViews, error: profileViewsError },
        ] = await Promise.all([
          supabase
            .from("user_follows")
            .select("*", { count: "exact", head: true })
            .eq("following_id", userId),
          supabase
            .from("user_follows")
            .select("*", { count: "exact", head: true })
            .eq("follower_id", userId),
          supabase
            .from("profile_views")
            .select("*", { count: "exact", head: true })
            .eq("profile_user_id", userId),
        ]);

        const followsTableMissing =
          followersError?.code === "42P01" || followingError?.code === "42P01";
        const profileViewsTableMissing = profileViewsError?.code === "42P01";
        if (!followsTableMissing) {
          if (followersError) throw followersError;
          if (followingError) throw followingError;
        }
        if (!profileViewsTableMissing && profileViewsError) throw profileViewsError;

        let followsThisProfile = false;
        if (!followsTableMissing && activeUserId && activeUserId !== userId) {
          const { data: followRow, error: followError } = await supabase
            .from("user_follows")
            .select("follower_id,following_id")
            .eq("follower_id", activeUserId)
            .eq("following_id", userId)
            .maybeSingle();

          if (followError) throw followError;
          followsThisProfile = Boolean(followRow);
        }

        const postIds = (postRows ?? []).map((post) => post.id);
        let likeRows = [];
        let commentRows = [];
        let commentLikeRows = [];

        if (postIds.length > 0) {
          const [{ data: likes, error: likesError }, { data: comments, error: commentsError }] =
            await Promise.all([
              supabase.from("post_likes").select("post_id,user_id").in("post_id", postIds),
              supabase.from("comments").select("post_id,id,user_id").in("post_id", postIds),
            ]);

          if (likesError) throw likesError;
          if (commentsError) throw commentsError;
          likeRows = likes ?? [];
          commentRows = comments ?? [];
        }

        const ownCommentIds = commentRows
          .filter((comment) => comment.user_id === userId)
          .map((comment) => comment.id);

        if (ownCommentIds.length > 0) {
          const { data: commentLikes, error: commentLikesError } = await supabase
            .from("comment_likes")
            .select("comment_id,user_id")
            .in("comment_id", ownCommentIds);

          if (commentLikesError) throw commentLikesError;
          commentLikeRows = commentLikes ?? [];
        }

        const nextLikesByPostId = likeRows.reduce((acc, like) => {
          acc[like.post_id] = (acc[like.post_id] ?? 0) + 1;
          return acc;
        }, {});
        const nextCommentsByPostId = commentRows.reduce((acc, comment) => {
          acc[comment.post_id] = (acc[comment.post_id] ?? 0) + 1;
          return acc;
        }, {});

        if (isMounted) {
          setCurrentUserId(activeUserId);
          setProfile(publicProfile);
          setDetails(detailRows);
          setPosts(postRows ?? []);
          setLikesByPostId(nextLikesByPostId);
          setCommentsByPostId(nextCommentsByPostId);
          setProfileViewsCount(profileViewsTableMissing ? 0 : profileViews ?? 0);
          setLikesReceivedCount(likeRows.length + commentLikeRows.length);
          setFollowersCount(followsTableMissing ? 0 : followers ?? 0);
          setFollowingCount(followsTableMissing ? 0 : following ?? 0);
          setIsFollowing(followsThisProfile);
        }
      } catch (loadError) {
        if (isMounted) setError(loadError.message || "Unable to load profile.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    if (userId) loadProfile();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  async function handleToggleFollow() {
    if (!currentUserId || !profile || currentUserId === profile.user_id) return;

    setIsFollowSaving(true);
    setError("");

    try {
      if (isFollowing) {
        const { error: unfollowError } = await supabase
          .from("user_follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", profile.user_id);

        if (unfollowError) throw unfollowError;
        setIsFollowing(false);
        setFollowersCount((count) => Math.max(0, count - 1));
      } else {
        const { error: followError } = await supabase
          .from("user_follows")
          .upsert(
            {
              follower_id: currentUserId,
              following_id: profile.user_id,
            },
            {
              ignoreDuplicates: true,
              onConflict: "follower_id,following_id",
            }
          );

        if (followError) throw followError;
        const { count, error: countError } = await supabase
          .from("user_follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", profile.user_id);

        if (countError) throw countError;
        setIsFollowing(true);
        setFollowersCount(count ?? followersCount);
      }
    } catch (followError) {
      setError(followError.message || "Unable to update follow.");
    } finally {
      setIsFollowSaving(false);
    }
  }

  const detailItems = useMemo(() => {
    if (!profile) return [];

    if (profile.role === "athlete") {
      return [
        { label: "Sport", value: profile.sport },
        { label: "Main position", value: details?.main_position },
        { label: "Secondary position", value: details?.secondary_position },
        { label: "Country", value: profile.country },
        { label: "Current club", value: profile.current_club },
        { label: "Height", value: details?.height ? `${details.height} cm` : null },
        { label: "Weight", value: details?.weight ? `${details.weight} kg` : null },
        { label: "Preferred foot / hand", value: details?.preferred_foot },
      ].filter((item) => item.value);
    }

    return [
      { label: "Sport", value: profile.sport },
      { label: "Country", value: profile.country },
      { label: "Current club", value: profile.current_club },
      { label: "Role title", value: details?.role_title },
      { label: "Organization", value: details?.organization },
      {
        label: "Experience",
        value:
          details?.experience_years !== null && details?.experience_years !== undefined
            ? `${details.experience_years} years`
            : null,
      },
      { label: "Achievements", value: details?.achievements },
      { label: "Certificates", value: details?.certificates },
    ].filter((item) => item.value);
  }, [details, profile]);

  if (isLoading) {
    return (
      <main className={styles.page}>
        <p className={styles.status}>Loading profile...</p>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className={styles.page}>
        <section className={styles.statePanel}>
          <h1>Profile unavailable</h1>
          <p>{error || "This profile could not be found."}</p>
          <Link href="/explore">Back to Explore</Link>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Link className={styles.backLink} href="/explore">
          &larr; Back to Explore
        </Link>

        <header className={styles.profileHeader}>
          <ProfileAvatar profile={profile} />
          <div className={styles.identity}>
            <span>{getRoleLabel(profile.role)}</span>
            <h1>{getDisplayName(profile)}</h1>
            <p>{[profile.country, profile.sport, profile.current_club].filter(Boolean).join(" - ")}</p>
            <div className={styles.followStats}>
              <strong>{followersCount}</strong> followers
              <strong>{followingCount}</strong> following
            </div>
            <div className={styles.profileStats}>
              <div>
                <strong>{profileViewsCount}</strong>
                <span>profile views</span>
              </div>
              <div>
                <strong>{likesReceivedCount}</strong>
                <span>likes received</span>
              </div>
            </div>
            {currentUserId && currentUserId !== profile.user_id && (
              <button
                className={isFollowing ? styles.followingButton : styles.followButton}
                disabled={isFollowSaving}
                type="button"
                onClick={handleToggleFollow}
              >
                {isFollowing ? "Following" : "Follow"}
              </button>
            )}
          </div>
        </header>

        <section className={styles.section}>
          <h2>Profile Information</h2>
          {detailItems.length > 0 ? (
            <dl className={styles.detailGrid}>
              {detailItems.map((item) => (
                <div key={item.label}>
                  <dt>{item.label}</dt>
                  <dd>{item.value}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className={styles.muted}>No public profile details yet.</p>
          )}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Posts</h2>
            <span>{posts.length} post{posts.length === 1 ? "" : "s"}</span>
          </div>

          {posts.length === 0 ? (
            <p className={styles.muted}>No posts yet.</p>
          ) : (
            <div className={styles.postList}>
              {posts.map((post) => (
                <article className={styles.postCard} key={post.id}>
                  <div className={styles.postMeta}>
                    <span>{post.category}</span>
                    <time>{formatDate(post.created_at)}</time>
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
                  <div className={styles.postStats}>
                    <span>
                      <Heart size={16} />
                      {likesByPostId[post.id] ?? 0}
                    </span>
                    <span>
                      <MessageCircle size={16} />
                      {commentsByPostId[post.id] ?? 0}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
