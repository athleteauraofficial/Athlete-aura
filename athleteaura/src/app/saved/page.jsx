"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, Heart, MessageCircle } from "lucide-react";
import { hasSupabaseEnv, supabase, supabaseConfigError } from "@/lib/supabase";
import styles from "./saved.module.css";

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

function formatTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ProfileAvatar({ profile }) {
  if (profile?.profile_pic_url) {
    return (
      <div
        aria-label={`${getDisplayName(profile)} profile picture`}
        className={styles.avatar}
        role="img"
        style={{ backgroundImage: `url("${profile.profile_pic_url}")` }}
      />
    );
  }

  return <div className={styles.avatar}>{getInitials(profile)}</div>;
}

export default function SavedPage() {
  const [posts, setPosts] = useState([]);
  const [profilesById, setProfilesById] = useState({});
  const [likesByPostId, setLikesByPostId] = useState({});
  const [commentsByPostId, setCommentsByPostId] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSavedPosts() {
      if (!hasSupabaseEnv) {
        setError(supabaseConfigError);
        setIsLoading(false);
        return;
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const userId = sessionData.session?.user?.id;

      if (sessionError || !userId) {
        setError("Log in to see your saved posts.");
        setIsLoading(false);
        return;
      }

      try {
        const { data: savedRows, error: savedError } = await supabase
          .from("post_saves")
          .select("post_id,created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (savedError) throw savedError;

        const postIds = (savedRows ?? []).map((row) => row.post_id);
        if (postIds.length === 0) {
          if (isMounted) {
            setPosts([]);
            setIsLoading(false);
          }
          return;
        }

        const { data: postRows, error: postsError } = await supabase
          .from("posts")
          .select("id,user_id,content,category,image_url,video_url,created_at")
          .in("id", postIds);

        if (postsError) throw postsError;

        const orderedPosts = postIds
          .map((postId) => (postRows ?? []).find((post) => post.id === postId))
          .filter(Boolean);
        const userIds = Array.from(new Set(orderedPosts.map((post) => post.user_id)));

        const [
          { data: profileRows, error: profilesError },
          { data: likeRows, error: likesError },
          { data: commentRows, error: commentsError },
        ] = await Promise.all([
          supabase
            .from("community_profiles")
            .select("user_id,role,full_name,first_name,last_name,country,sport,profile_pic_url")
            .in("user_id", userIds),
          supabase.from("post_likes").select("post_id,user_id").in("post_id", postIds),
          supabase.from("comments").select("post_id,id").in("post_id", postIds),
        ]);

        if (profilesError) throw profilesError;
        if (likesError) throw likesError;
        if (commentsError) throw commentsError;

        const nextLikesByPostId = (likeRows ?? []).reduce((acc, like) => {
          acc[like.post_id] = (acc[like.post_id] ?? 0) + 1;
          return acc;
        }, {});
        const nextCommentsByPostId = (commentRows ?? []).reduce((acc, comment) => {
          acc[comment.post_id] = (acc[comment.post_id] ?? 0) + 1;
          return acc;
        }, {});

        if (isMounted) {
          setPosts(orderedPosts);
          setProfilesById(Object.fromEntries((profileRows ?? []).map((profile) => [profile.user_id, profile])));
          setLikesByPostId(nextLikesByPostId);
          setCommentsByPostId(nextCommentsByPostId);
        }
      } catch (loadError) {
        if (isMounted) setError(loadError.message || "Unable to load saved posts.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadSavedPosts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <header className={styles.header}>
          <p>Saved</p>
          <h1>Saved posts</h1>
          <span>Posts you bookmarked from Explore appear here.</span>
        </header>

        {isLoading && <p className={styles.status}>Loading saved posts...</p>}
        {!isLoading && error && <p className={styles.error}>{error}</p>}
        {!isLoading && !error && posts.length === 0 && (
          <p className={styles.status}>No saved posts yet.</p>
        )}

        {!isLoading && !error && posts.length > 0 && (
          <div className={styles.feed}>
            {posts.map((post) => {
              const author = profilesById[post.user_id];

              return (
                <article className={styles.postCard} key={post.id}>
                  <div className={styles.postHeader}>
                    <Link className={styles.authorBlock} href={`/profiles/${encodeURIComponent(post.user_id)}`}>
                      <ProfileAvatar profile={author} />
                      <div>
                        <strong>{getDisplayName(author)}</strong>
                        <small>
                          {[author?.country, formatTime(post.created_at)].filter(Boolean).join(" - ")}
                        </small>
                      </div>
                    </Link>
                    <Link className={styles.savedLink} href={`/explore#post-${post.id}`}>
                      <Bookmark size={18} fill="currentColor" />
                      View post
                    </Link>
                  </div>

                  <span className={styles.category}>{post.category}</span>
                  <p>{post.content}</p>

                  {post.image_url && (
                    <Image
                      unoptimized
                      alt=""
                      className={styles.postImage}
                      height={520}
                      src={post.image_url}
                      width={900}
                    />
                  )}

                  {post.video_url && (
                    <video className={styles.postVideo} controls preload="metadata" src={post.video_url}>
                      <track kind="captions" />
                    </video>
                  )}

                  <div className={styles.postStats}>
                    <span>
                      <Heart size={18} />
                      {likesByPostId[post.id] ?? 0}
                    </span>
                    <span>
                      <MessageCircle size={18} />
                      {commentsByPostId[post.id] ?? 0}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
