"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import AuthForm from "./auth-form";
import styles from "./page.module.css";

const services = [
  {
    title: "For athletes",
    text: "Create a clean profile with your sport, position, club, physical info, photo, and highlight links.",
  },
  {
    title: "For scouts and coaches",
    text: "Find players faster by sport, position, country, and club. Open profiles without exposing private emails.",
  },
  {
    title: "For the community",
    text: "Post training updates, ask sport questions, comment, reply, follow people, and keep up with their progress.",
  },
];

const stats = [
  ["Build", "Your sports identity"],
  ["Discover", "Players and coaches"],
  ["Connect", "Through posts and follows"],
];

function HomeContent() {
  const searchParams = useSearchParams();
  const [authMode, setAuthMode] = useState(() => {
    const mode = searchParams.get("auth");
    return mode === "login" || mode === "register" ? mode : "";
  });

  function openAuth(mode) {
    setAuthMode(mode);
    window.setTimeout(() => {
      document.getElementById("auth")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  return (
    <main className={styles.homePage}>
      <section className={styles.hero} id="top">
        <div className={styles.heroCopy}>
          <p className={styles.kicker}>Sports profiles. Real opportunities.</p>
          <h1>Community-powered sports profiles.</h1>
          <p>
            Build your athlete identity, share progress, connect with scouts and
            coaches, and get discovered through a focused sports community.
          </p>
          <div className={styles.heroActions}>
            <button type="button" onClick={() => openAuth("register")}>
              Sign Up
            </button>
            <button type="button" onClick={() => openAuth("login")}>
              Log In
            </button>
          </div>
        </div>
      </section>

      <section className={styles.statsBand} aria-label="AthleteAura summary">
        {stats.map(([value, label]) => (
          <div key={value}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </section>

      <section className={styles.servicesSection} aria-label="AthleteAura services">
        <div className={styles.sectionHeading}>
          <p className={styles.kicker}>What AthleteAura serves</p>
          <h2>One place for sports identity, discovery, and community.</h2>
        </div>
        <div className={styles.serviceGrid}>
          {services.map((service) => (
            <article key={service.title}>
              <h3>{service.title}</h3>
              <p>{service.text}</p>
            </article>
          ))}
        </div>
      </section>

      {authMode && (
        <section className={styles.authSection} id="auth" aria-label="Sign up or log in">
          <div className={styles.authIntro}>
            <p className={styles.kicker}>Join the platform</p>
            <h2>{authMode === "register" ? "Create your account" : "Welcome back"}</h2>
            <p>
              Choose athlete or scout/coach. After signing up, you will complete your
              profile and enter the right side of the platform.
            </p>
          </div>
          <AuthForm initialMode={authMode} key={authMode} />
        </section>
      )}
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomeContent />
    </Suspense>
  );
}
