"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import BrandLogo from "@/components/brand/BrandLogo";
import styles from "./LandingPage.module.css";

const NAV_ITEMS = [
  { key: "athletes", href: "/for-athletes", label: "For Athletes" },
  { key: "coaches", href: "/for-coaches", label: "For Coaches & Scouts" },
  { key: "explore", href: "/explore-talent", label: "Explore Talent" },
];

export default function PublicHeader({ hideActions = false }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const drawerId = useId();
  const navItems = NAV_ITEMS;

  const closeMenu = () => setIsMenuOpen(false);

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    const previousDocumentOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    function handleKeyDown(event) {
      if (event.key === "Escape") setIsMenuOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.documentElement.style.overflow = previousDocumentOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  return (
    <header className={styles.header}>
      <BrandLogo href="/" showTagline={false} />
      <nav className={styles.desktopNav} aria-label="Public navigation">
        {navItems.map((item) => (
          <Link href={item.href} key={item.href}>
            {item.label}
          </Link>
        ))}
      </nav>
      {!hideActions && (
        <div className={styles.headerActions}>
          <Link className={styles.secondaryButton} href="/login">
            Log In
          </Link>
          <Link className={styles.primaryButton} href="/signup">
            Sign Up
          </Link>
        </div>
      )}
      <button
        className={`${styles.menuButton} ${isMenuOpen ? styles.menuButtonOpen : ""}`}
        type="button"
        aria-controls={drawerId}
        aria-expanded={isMenuOpen}
        aria-label="Open navigation menu"
        onClick={() => setIsMenuOpen((open) => !open)}
      >
        <span aria-hidden="true" />
        <span aria-hidden="true" />
        <span aria-hidden="true" />
      </button>
      <button
        className={`${styles.mobileBackdrop} ${isMenuOpen ? styles.mobileBackdropOpen : ""}`}
        type="button"
        aria-label="Close navigation menu"
        onClick={closeMenu}
      />
      <aside
        aria-hidden={!isMenuOpen}
        aria-label="Mobile navigation menu"
        className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ""}`}
        id={drawerId}
      >
        <div className={styles.mobileMenuHead}>
          <BrandLogo showTagline={false} />
          <button
            aria-label="Close navigation menu"
            className={styles.mobileCloseButton}
            type="button"
            onClick={closeMenu}
          >
            <span aria-hidden="true" />
            <span aria-hidden="true" />
          </button>
        </div>
        <nav aria-label="Mobile public navigation">
          {navItems.map((item) => (
            <Link href={item.href} key={item.href} onClick={closeMenu}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className={styles.mobileMenuActions}>
          <Link className={styles.mobileLoginLink} href="/login" onClick={closeMenu}>
            Log In
          </Link>
          <Link className={styles.mobileSignupLink} href="/signup" onClick={closeMenu}>
            Sign Up
          </Link>
        </div>
      </aside>
    </header>
  );
}
