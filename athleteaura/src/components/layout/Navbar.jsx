"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell,
  ChevronDown,
  Compass,
  MessageCircle,
  Plus,
  Search,
  Settings,
  Sparkles,
  Sun,
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
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    if (!hasSupabaseEnv) return undefined;

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        setUser(data.session?.user ?? null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
    setIsSigningOut(false);
  }

  const profileHref = getProfileHref(user?.user_metadata?.role);
  const isProfilePage = pathname === profileHref || pathname === "/profile";
  const navLinks = user
    ? [
        { href: "/explore", label: "Explore", active: pathname === "/explore", icon: Zap },
        { href: "/discover", label: "Discover", active: pathname === "/discover", icon: Search },
      ]
    : [];

  return (
    <>
      <header className={styles.topbar}>
        <Link className={styles.brand} href={user ? "/explore" : "/"}>
          <strong>
            ATHLETE <span>AURA</span>
          </strong>
          <small>Rise. Connect. Inspire.</small>
        </Link>

        <label className={styles.searchBox}>
          <Search size={18} />
          <input placeholder="Find training tips, questions, achievements..." type="search" />
          <kbd>⌘ K</kbd>
        </label>

        {user ? (
          <div className={styles.topActions}>
            <button aria-label="Theme" type="button">
              <Sun size={22} />
            </button>
            <button aria-label="Notifications" className={styles.notificationButton} type="button">
              <Bell size={22} />
              <span>3</span>
            </button>
            <div className={styles.topAvatar}>
              {user.email?.[0]?.toUpperCase() ?? "A"}
            </div>
            <ChevronDown size={18} />
          </div>
        ) : (
          <div className={styles.guestLinks}>
            <Link className={styles.link} href="/?auth=login#auth">
              Log In
            </Link>
            <Link className={styles.signOutButton} href="/?auth=register#auth">
              Sign Up
            </Link>
          </div>
        )}
      </header>

      <nav className={styles.navbar} aria-label="Main navigation">
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
                <span className={styles.link}>
                  <MessageCircle size={22} />
                  Messages
                  <small>2</small>
                </span>
                <span className={styles.link}>
                  <Bell size={22} />
                  Notifications
                </span>
                <span className={styles.link}>
                  <Compass size={22} />
                  Saved
                </span>
                <Link
                  aria-current={isProfilePage ? "page" : undefined}
                  className={isProfilePage ? styles.activeLink : styles.link}
                  href={profileHref}
                >
                  <User size={22} />
                  My Profile
                </Link>
                <span className={styles.link}>
                  <Settings size={22} />
                  Settings
                </span>
                <Link className={styles.createPostLink} href="/explore">
                  <Plus size={22} />
                  Create Post
                </Link>
              </>
            ) : (
              <>
                <Link className={styles.link} href="/?auth=login#auth">
                  Log In
                </Link>
                <Link className={styles.createPostLink} href="/?auth=register#auth">
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
              <Sparkles size={18} />
              <button
                className={styles.signOutButton}
                disabled={isSigningOut}
                type="button"
                onClick={handleSignOut}
              >
                {isSigningOut ? "Signing out..." : "Sign Out"}
              </button>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
