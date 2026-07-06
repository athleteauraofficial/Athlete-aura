"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle, Target, UserRound, UsersRound } from "lucide-react";
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

function scrollToFeatures() {
  document.getElementById("features")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function Home() {
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
          <a href="#features">Discover</a>
          <a href="#features">For Athletes</a>
          <a href="#features">For Coaches & Scouts</a>
        </nav>

        <div className={styles.headerActions}>
          <Link className={styles.loginButton} href="/login">
            Log In
          </Link>
          <Link className={styles.signupButton} href="/signup">
            Sign Up
          </Link>
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
            <Link className={styles.primaryCta} href="/signup">
              Create Your Profile
              <ArrowRight size={20} />
            </Link>
            <button className={styles.secondaryCta} type="button" onClick={scrollToFeatures}>
              Learn More
            </button>
          </div>
        </div>

        <aside className={styles.landingSignupPanel} aria-label="Join AthleteAura">
          <h2>Community-Powered Sports Growth</h2>
          <p>
            Build your profile, share your progress, and connect with the right people in sport.
          </p>
          <p className={styles.memberPrompt}>
            Already a Member? <Link href="/login">Log In</Link>
          </p>
          <Link className={styles.emailSignupButton} href="/signup">
            Sign Up With Email
          </Link>
          <small>By continuing, you can create an athlete or coach/scout account.</small>
        </aside>

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
    </main>
  );
}
