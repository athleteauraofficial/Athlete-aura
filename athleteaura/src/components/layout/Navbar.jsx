"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  Bookmark,
  ChevronDown,
  Plus,
  Search,
  User,
  Zap,
} from "lucide-react";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import styles from "./Navbar.module.css";

function getProfileHref(role) {
  if (role === "athlete") return "/athlete/profile";
  if (role === "scout_coach") return "/scout/profile";
  return "/profile";
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [currentProfile, setCurrentProfile] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
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
      const { data: ownPosts, error: postsError } = await supabase
        .from("posts")
        .select("id,content,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(80);

      if (postsError || !isMounted) return;

      const postIds = (ownPosts ?? []).map((post) => post.id);
      if (postIds.length === 0) {
        setNotifications([]);
        return;
      }

      const [{ data: likes }, { data: comments }] = await Promise.all([
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

      const actorIds = Array.from(
        new Set([...(likes ?? []), ...(comments ?? [])].map((item) => item.user_id))
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
        ...(likes ?? []).map((like) => ({
          id: `like-${like.post_id}-${like.user_id}`,
          type: "liked",
          actorId: like.user_id,
          actor: profilesById[like.user_id],
          post: postsById[like.post_id],
          createdAt: like.created_at,
        })),
        ...(comments ?? []).map((comment) => ({
          id: `comment-${comment.id}`,
          type: "commented on",
          actorId: comment.user_id,
          actor: profilesById[comment.user_id],
          post: postsById[comment.post_id],
          createdAt: comment.created_at,
        })),
      ]
        .filter((item) => item.post)
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

  async function handleSignOut() {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
    setIsSigningOut(false);
  }

  const profileHref = getProfileHref(user?.user_metadata?.role);
  const isPublicLanding = !user && ["/", "/login", "/signup"].includes(pathname);
  const isProfilePage = pathname === profileHref || pathname === "/profile";
  const isSavedPage = pathname === "/saved";
  const navLinks = user
    ? [
        { href: "/explore", label: "Explore", active: pathname === "/explore", icon: Zap },
        { href: "/discover", label: "Discover", active: pathname === "/discover", icon: Search },
      ]
    : [];

  if (isPublicLanding) {
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
              aria-expanded={isNotificationsOpen}
              aria-label="Notifications"
              className={styles.notificationButton}
              type="button"
              onClick={() => setIsNotificationsOpen((isOpen) => !isOpen)}
            >
              <Bell size={22} />
              {notifications.length > 0 && <span>{Math.min(notifications.length, 9)}</span>}
            </button>
            {isNotificationsOpen && (
              <div className={styles.notificationsMenu}>
                <div className={styles.notificationsHead}>
                  <strong>Notifications</strong>
                  <small>{notifications.length} new</small>
                </div>
                {notifications.length === 0 ? (
                  <p>No post activity yet.</p>
                ) : (
                  <div className={styles.notificationsList}>
                    {notifications.map((notification) => {
                      const actorName =
                        `${notification.actor?.first_name ?? ""} ${notification.actor?.last_name ?? ""}`.trim() ||
                        notification.actor?.full_name ||
                        "Someone";

                      return (
                        <div className={styles.notificationItem} key={notification.id}>
                          <Link
                            className={styles.notificationAvatar}
                            href={`/profiles/${encodeURIComponent(notification.actorId)}`}
                            style={
                              notification.actor?.profile_pic_url
                                ? { backgroundImage: `url("${notification.actor.profile_pic_url}")` }
                                : undefined
                            }
                          >
                            {!notification.actor?.profile_pic_url && actorName[0]}
                          </Link>
                          <div>
                            <Link href={`/profiles/${encodeURIComponent(notification.actorId)}`}>
                              {actorName}
                            </Link>
                            <span>{notification.type} your post</span>
                            <Link href={`/explore#post-${notification.post.id}`}>
                              {notification.post.content.slice(0, 72)}
                              {notification.post.content.length > 72 ? "..." : ""}
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            <button
              aria-expanded={isUserMenuOpen}
              aria-label="Profile menu"
              className={styles.profileMenuButton}
              type="button"
              onClick={() => setIsUserMenuOpen((isOpen) => !isOpen)}
            >
              <span
                className={styles.topAvatar}
                style={
                  currentProfile?.profile_pic_url
                    ? { backgroundImage: `url("${currentProfile.profile_pic_url}")` }
                    : undefined
                }
              >
                {!currentProfile?.profile_pic_url && (user.email?.[0]?.toUpperCase() ?? "A")}
              </span>
              <ChevronDown size={18} />
            </button>
            {isUserMenuOpen && (
              <div className={styles.userMenu}>
                <Link href={profileHref} onClick={() => setIsUserMenuOpen(false)}>
                  <User size={18} />
                  View Profile
                </Link>
                <button disabled={isSigningOut} type="button" onClick={handleSignOut}>
                  {isSigningOut ? "Logging out..." : "Log Out"}
                </button>
              </div>
            )}
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
                  >
                    <link.icon size={22} />
                    {link.label}
                  </Link>
                ))}
                <Link
                  aria-current={isSavedPage ? "page" : undefined}
                  className={isSavedPage ? styles.activeLink : styles.link}
                  href="/saved"
                >
                  <Bookmark size={22} />
                  Saved
                </Link>
                <Link
                  aria-current={isProfilePage ? "page" : undefined}
                  className={isProfilePage ? styles.activeLink : styles.link}
                  href={profileHref}
                >
                  <User size={22} />
                  My Profile
                </Link>
                <Link
                  className={styles.createPostLink}
                  href="/explore#compose"
                  onClick={() => window.dispatchEvent(new Event("athleteaura:open-composer"))}
                >
                  <Plus size={22} />
                  Create Post
                </Link>
              </>
            ) : (
              <>
                <Link className={styles.link} href="/login">
                  Log In
                </Link>
                <Link className={styles.createPostLink} href="/signup">
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {user && (
            <div className={styles.userCard}>
              <div>{user.email?.[0]?.toUpperCase() ?? "A"}</div>
              <span>
                <strong>AthleteAura user</strong>
                {user.email}
              </span>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}

