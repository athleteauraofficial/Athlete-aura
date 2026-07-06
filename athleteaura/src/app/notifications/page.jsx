"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, MessageCircle, UserPlus } from "lucide-react";
import { hasSupabaseEnv, supabase, supabaseConfigError } from "@/lib/supabase";
import styles from "./notifications.module.css";

function getDisplayName(profile) {
  const name = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
  return name || profile?.full_name || "Someone";
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

function NotificationIcon({ type }) {
  if (type === "follow") return <UserPlus size={20} />;
  if (type === "comment") return <MessageCircle size={20} />;
  return <Heart size={20} />;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      if (!hasSupabaseEnv) {
        setError(supabaseConfigError);
        setIsLoading(false);
        return;
      }

      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        const user = sessionData.session?.user;
        if (!user) {
          router.replace("/");
          return;
        }

        const [{ data: ownPosts, error: postsError }, { data: follows, error: followsError }] =
          await Promise.all([
            supabase
              .from("posts")
              .select("id,content,created_at")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false })
              .limit(120),
            supabase
              .from("user_follows")
              .select("follower_id,created_at")
              .eq("following_id", user.id)
              .neq("follower_id", user.id)
              .order("created_at", { ascending: false })
              .limit(80),
          ]);

        if (postsError) throw postsError;
        if (followsError && followsError.code !== "42P01") throw followsError;

        const postIds = (ownPosts ?? []).map((post) => post.id);
        let likes = [];
        let comments = [];

        if (postIds.length > 0) {
          const [{ data: likeRows, error: likesError }, { data: commentRows, error: commentsError }] =
            await Promise.all([
              supabase
                .from("post_likes")
                .select("post_id,user_id,created_at")
                .in("post_id", postIds)
                .neq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(80),
              supabase
                .from("comments")
                .select("id,post_id,user_id,content,created_at")
                .in("post_id", postIds)
                .neq("user_id", user.id)
                .order("created_at", { ascending: false })
                .limit(80),
            ]);

          if (likesError) throw likesError;
          if (commentsError) throw commentsError;

          likes = likeRows ?? [];
          comments = commentRows ?? [];
        }

        const followRows = followsError ? [] : follows ?? [];
        const actorIds = Array.from(
          new Set([
            ...likes.map((item) => item.user_id),
            ...comments.map((item) => item.user_id),
            ...followRows.map((item) => item.follower_id),
          ])
        );

        let profiles = [];
        if (actorIds.length > 0) {
          const { data, error: profilesError } = await supabase
            .from("community_profiles")
            .select("user_id,full_name,first_name,last_name,role,profile_pic_url")
            .in("user_id", actorIds);

          if (profilesError) throw profilesError;
          profiles = data ?? [];
        }

        const postsById = Object.fromEntries((ownPosts ?? []).map((post) => [post.id, post]));
        const profilesById = Object.fromEntries(profiles.map((profile) => [profile.user_id, profile]));
        const nextItems = [
          ...followRows.map((follow) => ({
            id: `follow-${follow.follower_id}-${follow.created_at}`,
            type: "follow",
            actorId: follow.follower_id,
            actor: profilesById[follow.follower_id],
            createdAt: follow.created_at,
          })),
          ...likes.map((like) => ({
            id: `like-${like.post_id}-${like.user_id}`,
            type: "like",
            actorId: like.user_id,
            actor: profilesById[like.user_id],
            post: postsById[like.post_id],
            createdAt: like.created_at,
          })),
          ...comments.map((comment) => ({
            id: `comment-${comment.id}`,
            type: "comment",
            actorId: comment.user_id,
            actor: profilesById[comment.user_id],
            post: postsById[comment.post_id],
            comment: comment.content,
            createdAt: comment.created_at,
          })),
        ]
          .filter((item) => item.type === "follow" || item.post)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        if (isMounted) setItems(nextItems);
      } catch (notificationError) {
        if (isMounted) {
          setError(notificationError.message || "Unable to load notifications.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, [router]);

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <p>Activity</p>
        <h1>Notifications</h1>
        <span>Likes, comments, and new followers appear here.</span>
      </section>

      {isLoading && <div className={styles.status}>Loading notifications...</div>}
      {error && <div className={styles.error}>{error}</div>}

      {!isLoading && !error && (
        <section className={styles.list} aria-label="Notifications list">
          {items.length === 0 ? (
            <div className={styles.empty}>
              <strong>No notifications yet</strong>
              <span>When people follow you or react to your posts, you will see it here.</span>
            </div>
          ) : (
            items.map((item) => {
              const actorName = getDisplayName(item.actor);
              const actorHref = `/profiles/${encodeURIComponent(item.actorId)}`;

              return (
                <article className={styles.item} key={item.id}>
                  <Link
                    className={styles.avatar}
                    href={actorHref}
                    style={
                      item.actor?.profile_pic_url
                        ? { backgroundImage: `url("${item.actor.profile_pic_url}")` }
                        : undefined
                    }
                  >
                    {!item.actor?.profile_pic_url && getInitials(item.actor)}
                  </Link>

                  <div className={styles.body}>
                    <div className={styles.line}>
                      <span className={styles.typeIcon}>
                        <NotificationIcon type={item.type} />
                      </span>
                      <p>
                        <Link href={actorHref}>{actorName}</Link>{" "}
                        {item.type === "follow" && "followed you"}
                        {item.type === "like" && "liked your post"}
                        {item.type === "comment" && "commented on your post"}
                      </p>
                    </div>

                    {item.comment && <blockquote>{item.comment}</blockquote>}

                    {item.post && (
                      <Link className={styles.postLink} href={`/explore#post-${item.post.id}`}>
                        {item.post.content.slice(0, 120)}
                        {item.post.content.length > 120 ? "..." : ""}
                      </Link>
                    )}

                    <time>{formatTime(item.createdAt)}</time>
                  </div>
                </article>
              );
            })
          )}
        </section>
      )}
    </main>
  );
}
