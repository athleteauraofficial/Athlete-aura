"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  Bookmark,
  Plus,
  Search,
  Zap,
} from "lucide-react";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import styles from "./Navbar.module.css";

function getProfileHref(role) {
  if (role === "athlete") return "/athlete/profile";
  if (role === "scout_coach") return "/scout/profile";
  return "/profile";
}

function getDisplayName(profile) {
  const name = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim();
  return name || profile?.full_name || "Profile";
}

function rememberLastAccount(user, profile) {
  if (typeof window === "undefined" || !user?.email) return;

  window.localStorage.setItem(
    "athleteaura:lastAccount",
    JSON.stringify({
      email: user.email,
      name: getDisplayName(profile),
    })
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!hasSupabaseEnv) return undefined;

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setUser(data.session?.user ?? null);
        if (!data.session?.user) setCurrentProfile(null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setCurrentProfile(null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!hasSupabaseEnv || !user?.id) {
      return undefined;
    }

    let isMounted = true;

    async function loadCurrentProfile() {
      const { data } = await supabase
        .from("community_profiles")
        .select("user_id,full_name,first_name,last_name,profile_pic_url")
        .eq("user_id", user.id)
        .maybeSingle();

      if (isMounted) setCurrentProfile(data ?? null);
    }

    async function loadNotifications() {
      const [{ data: ownPosts, error: postsError }, { data: follows, error: followsError }] =
        await Promise.all([
          supabase
            .from("posts")
            .select("id,content,created_at")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(80),
          supabase
            .from("user_follows")
            .select("follower_id,created_at")
            .eq("following_id", user.id)
            .neq("follower_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20),
        ]);

      if ((postsError || (followsError && followsError.code !== "42P01")) || !isMounted) return;

      const postIds = (ownPosts ?? []).map((post) => post.id);
      let likes = [];
      let comments = [];

      if (postIds.length > 0) {
        const [{ data: likeRows }, { data: commentRows }] = await Promise.all([
          supabase
            .from("post_likes")
            .select("post_id,user_id,created_at")
            .in("post_id", postIds)
            .neq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20),
          supabase
            .from("comments")
            .select("id,post_id,user_id,content,created_at")
            .in("post_id", postIds)
            .neq("user_id", user.id)
            .order("created_at", { ascending: false })
            .limit(20),
        ]);

        likes = likeRows ?? [];
        comments = commentRows ?? [];
      }

      const actorIds = Array.from(
        new Set([
          ...likes.map((item) => item.user_id),
          ...comments.map((item) => item.user_id),
          ...((followsError ? [] : follows) ?? []).map((item) => item.follower_id),
        ])
      );

      let profiles = [];
      if (actorIds.length > 0) {
        const { data } = await supabase
          .from("community_profiles")
          .select("user_id,full_name,first_name,last_name,profile_pic_url")
          .in("user_id", actorIds);
        profiles = data ?? [];
      }

      const postsById = Object.fromEntries((ownPosts ?? []).map((post) => [post.id, post]));
      const profilesById = Object.fromEntries(profiles.map((profile) => [profile.user_id, profile]));
      const nextNotifications = [
        ...likes.map((like) => ({
          id: `like-${like.post_id}-${like.user_id}`,
          type: "liked",
          actorId: like.user_id,
          actor: profilesById[like.user_id],
          post: postsById[like.post_id],
          createdAt: like.created_at,
        })),
        ...comments.map((comment) => ({
          id: `comment-${comment.id}`,
          type: "commented on",
          actorId: comment.user_id,
          actor: profilesById[comment.user_id],
          post: postsById[comment.post_id],
          createdAt: comment.created_at,
        })),
        ...((followsError ? [] : follows) ?? []).map((follow) => ({
          id: `follow-${follow.follower_id}-${follow.created_at}`,
          type: "followed",
          actorId: follow.follower_id,
          actor: profilesById[follow.follower_id],
          createdAt: follow.created_at,
        })),
      ]
        .filter((item) => item.type === "followed" || item.post)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 12);

      if (isMounted) setNotifications(nextNotifications);
    }

    loadCurrentProfile();
    loadNotifications();
    const intervalId = window.setInterval(loadNotifications, 45000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [user?.id]);

  const profileHref = getProfileHref(user?.user_metadata?.role);
  const isPublicPage = ["/", "/login", "/signup"].includes(pathname);
  const isProfilePage = pathname === profileHref || pathname === "/profile";
  const isSavedPage = pathname === "/saved";
  const isNotificationsPage = pathname === "/notifications";
  const navLinks = user
    ? [
        { href: "/explore", label: "Explore", active: pathname === "/explore", icon: Zap },
        { href: "/discover", label: "Discover", active: pathname === "/discover", icon: Search },
      ]
    : [];

  function collapseSidebar(event) {
    event.currentTarget.blur();
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    rememberLastAccount(user, currentProfile);
    await supabase.auth.signOut();
    setUser(null);
    setCurrentProfile(null);
    setNotifications([]);
    router.replace("/");
    router.refresh();
    setIsSigningOut(false);
  }

  if (isPublicPage) {
    return null;
  }

  return (
    <>
      <header className={`${styles.topbar} app-shell-topbar`}>
        <Link className={styles.brand} href={user ? "/explore" : "/"}>
          <strong>
            ATHLETE <span>AURA</span>
          </strong>
          <small>Rise. Connect. Inspire.</small>
        </Link>

        <label className={styles.searchBox}>
          <Search size={18} />
          <input placeholder="Find training tips, questions, achievements..." type="search" />
          <kbd>Ctrl K</kbd>
        </label>

        {user ? (
          <div className={styles.topActions}>
            <button
              className={styles.logoutButton}
              disabled={isSigningOut}
              type="button"
              onClick={handleSignOut}
            >
              {isSigningOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>
        ) : (
          <div className={styles.guestLinks}>
            <Link className={styles.link} href="/login">
              Log In
            </Link>
            <Link className={styles.signOutButton} href="/signup">
              Sign Up
            </Link>
          </div>
        )}
      </header>

      <nav className={`${styles.navbar} app-shell-nav`} aria-label="Main navigation">
        <div className={styles.container}>
          <div className={styles.links}>
            {user ? (
              <>
                {navLinks.map((link) => (
                  <Link
                    aria-current={link.active ? "page" : undefined}
                    className={link.active ? styles.activeLink : styles.link}
                    href={link.href}
                    key={link.href}
                    onClick={collapseSidebar}
                  >
                    <link.icon size={22} />
                    <span className={styles.navLabel}>{link.label}</span>
                  </Link>
                ))}
                <Link
                  aria-current={isSavedPage ? "page" : undefined}
                  className={isSavedPage ? styles.activeLink : styles.link}
                  href="/saved"
                  onClick={collapseSidebar}
                >
                  <Bookmark size={22} />
                  <span className={styles.navLabel}>Saved</span>
                </Link>
                <Link
                  aria-current={isNotificationsPage ? "page" : undefined}
                  className={isNotificationsPage ? styles.activeLink : styles.link}
                  href="/notifications"
                  onClick={collapseSidebar}
                >
                  <Bell size={22} />
                  <span className={styles.navLabel}>Notifications</span>
                  {notifications.length > 0 && (
                    <small>{Math.min(notifications.length, 9)}</small>
                  )}
                </Link>
                <Link
                  aria-current={isProfilePage ? "page" : undefined}
                  className={isProfilePage ? styles.activeLink : styles.link}
                  href={profileHref}
                  onClick={collapseSidebar}
                >
                  <span
                    className={styles.navAvatar}
                    style={
                      currentProfile?.profile_pic_url
                        ? { backgroundImage: `url("${currentProfile.profile_pic_url}")` }
                        : undefined
                    }
                  >
                    {!currentProfile?.profile_pic_url && (user.email?.[0]?.toUpperCase() ?? "A")}
                  </span>
                  <span className={styles.navLabel}>Profile</span>
                </Link>
                <Link
                  className={styles.createPostLink}
                  href="/explore#compose"
                  onClick={(event) => {
                    collapseSidebar(event);
                    window.dispatchEvent(new Event("athleteaura:open-composer"));
                  }}
                >
                  <Plus size={22} />
                  <span className={styles.navLabel}>Create Post</span>
                </Link>
              </>
            ) : (
              <>
                <Link className={styles.link} href="/login" onClick={collapseSidebar}>
                  Log In
                </Link>
                <Link className={styles.createPostLink} href="/signup" onClick={collapseSidebar}>
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {user && (
            <div className={styles.userCard}>
              <div
                style={
                  currentProfile?.profile_pic_url
                    ? { backgroundImage: `url("${currentProfile.profile_pic_url}")` }
                    : undefined
                }
              >
                {!currentProfile?.profile_pic_url && (user.email?.[0]?.toUpperCase() ?? "A")}
              </div>
              <span>
                <strong>{getDisplayName(currentProfile)}</strong>
                {user.email}
              </span>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}

