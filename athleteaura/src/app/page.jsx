"use client";

import { ArrowRight, MessageCircle, Target, UserRound, UsersRound } from "lucide-react";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import AuthForm from "./auth-form";
import styles from "./page.module.css";

const features = [
  {
    icon: UserRound,
    title: "Create Your Profile",
    text: "Showcase your skills, stats, achievements and highlights in one powerful profile.",
  },
  {
    icon: UsersRound,
    title: "Join the Community",
    text: "Connect, share, and learn from athletes, coaches and people who live the game.",
  },
  {
    icon: MessageCircle,
    title: "Share and Engage",
    text: "Post, comment, and interact with the sports community around you.",
  },
  {
    icon: Target,
    title: "Unlock Opportunities",
    text: "Get discovered by the right people and take the next step in your journey.",
  },
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

  function scrollToFeatures() {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className={styles.homePage}>
      <header className={styles.landingHeader}>
        <a className={styles.brand} href="#top" aria-label="AthleteAura home">
          <strong>
            ATHLETE<span>AURA</span>
          </strong>
          <small>Rise. Connect. Inspire.</small>
        </a>

        <nav className={styles.navLinks} aria-label="Landing navigation">
          <button type="button" onClick={() => openAuth("register")}>
            Discover
          </button>
          <button type="button" onClick={() => openAuth("login")}>
            Explore
          </button>
          <button type="button" onClick={() => openAuth("register")}>
            For Athletes
          </button>
          <button type="button" onClick={() => openAuth("register")}>
            For Coaches & Scouts
          </button>
        </nav>

        <div className={styles.headerActions}>
          <button className={styles.loginButton} type="button" onClick={() => openAuth("login")}>
            Log In
          </button>
          <button className={styles.signupButton} type="button" onClick={() => openAuth("register")}>
            Sign Up
          </button>
        </div>
      </header>

      <section className={styles.hero} id="top">
        <div className={styles.heroCopy}>
          <p className={styles.badge}>
            <span />
            The sports network that works for you
          </p>
          <h1>
            Your Talent.
            <span>The Right People.</span>
          </h1>
          <p className={styles.heroText}>
            AthleteAura connects athletes with coaches and scouts, helps you showcase your journey,
            grow your network, and unlock real opportunities.
          </p>
          <div className={styles.heroActions}>
            <button className={styles.primaryCta} type="button" onClick={() => openAuth("register")}>
              Create Your Profile
              <ArrowRight size={20} />
            </button>
            <button className={styles.secondaryCta} type="button" onClick={scrollToFeatures}>
              Learn More
            </button>
          </div>
        </div>

        <div className={styles.heroVisual} aria-hidden="true" />
      </section>

      <section className={styles.featuresSection} id="features" aria-label="AthleteAura features">
        <div className={styles.sectionHeading}>
          <p>Built for athletes. Designed for growth.</p>
          <h2>
            Everything you need to <span>stand out</span>
          </h2>
        </div>

        <div className={styles.featureGrid}>
          {features.map((feature) => (
            <article className={styles.featureCard} key={feature.title}>
              <div className={styles.featureIcon}>
                <feature.icon size={31} />
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      {authMode && (
        <section className={styles.authSection} id="auth" aria-label="Sign up or log in">
          <div className={styles.authIntro}>
            <p className={styles.badge}>
              <span />
              {authMode === "register" ? "Start your profile" : "Welcome back"}
            </p>
            <h2>{authMode === "register" ? "Create your AthleteAura account" : "Log in to AthleteAura"}</h2>
            <p>
              Pick athlete or scout/coach, then continue to your profile setup and community feed.
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
