"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

  if (!user) {
    return null;
  }

  const profileHref = getProfileHref(user.user_metadata?.role);
  const isProfilePage = pathname === profileHref || pathname === "/profile";

  return (
    <nav className={styles.navbar} aria-label="Main navigation">
      <div className={styles.container}>
        <Link className={styles.brand} href="/discover">
          AthleteAura
        </Link>

        <div className={styles.links}>
          <Link
            aria-current={pathname === "/discover" ? "page" : undefined}
            className={
              pathname === "/discover" ? styles.activeLink : styles.link
            }
            href="/discover"
          >
            Discover
          </Link>
          <Link
            aria-current={isProfilePage ? "page" : undefined}
            className={isProfilePage ? styles.activeLink : styles.link}
            href={profileHref}
          >
            Profile
          </Link>
          <button
            className={styles.signOutButton}
            disabled={isSigningOut}
            type="button"
            onClick={handleSignOut}
          >
            {isSigningOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </div>
    </nav>
  );
}
