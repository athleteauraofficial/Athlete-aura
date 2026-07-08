"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { accountRoles, getPostAuthRoute, isStrongPassword, roleLabels } from "@/lib/auth";
import { hasSupabaseEnv, supabase, supabaseConfigError } from "@/lib/supabase";
import styles from "./page.module.css";

const landingSections = [
  { href: "#for-athletes", id: "for-athletes", label: "For Athletes" },
  { href: "#for-coaches", id: "for-coaches", label: "For Coaches & Scouts" },
  { href: "#explore-talent", label: "Explore Talent" },
];

const athleteFeatures = [
  {
    title: "Stop being just a name",
    text: "Sport, position, club, country, physical details, achievements, and highlights in one clean page.",
  },
  {
    title: "Put proof beside your details",
    text: "Add highlight links and short videos so coaches can see the moments that explain your level.",
  },
  {
    title: "Bring your socials with you",
    text: "Instagram, TikTok, and YouTube stay one click away from the same profile coaches review.",
  },
];

const coachFeatures = [
  {
    title: "Find players faster",
    text: "Search by sport, country, position, and details instead of digging through random clips.",
  },
  {
    title: "Review without guessing",
    text: "Open the profile, check the details, watch highlights, and visit the athlete's socials.",
  },
  {
    title: "Keep talent close",
    text: "Follow athletes, save profiles worth watching, and come back when their story grows.",
  },
];

const feedFeatures = [
  {
    title: "Post the work",
    text: "Training work, match thoughts, questions, wins, photos, and short videos belong in the feed.",
  },
  {
    title: "Make every update lead somewhere",
    text: "Every post can lead people back to your profile, highlights, socials, and sport details.",
  },
  {
    title: "Let reactions build momentum",
    text: "Likes, comments, replies, saves, and follows help the right people notice consistent progress.",
  },
];

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("athlete");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("for-athletes");

  useEffect(() => {
    const sectionIds = landingSections.map((section) => section.id ?? section.href.slice(1));
    const sections = sectionIds
      .map((sectionId) => document.getElementById(sectionId))
      .filter(Boolean);

    if (!sections.length) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio);

        if (visibleEntries[0]) {
          setActiveSection(visibleEntries[0].target.id);
        }
      },
      {
        rootMargin: "-28% 0px -48% 0px",
        threshold: [0.12, 0.3, 0.55],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  function handleSectionNavClick(event, sectionId) {
    event.preventDefault();
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(sectionId);
  }

  async function handleLandingSignup(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!hasSupabaseEnv) {
      setError(supabaseConfigError);
      return;
    }

    if (!isStrongPassword(password)) {
      setError("Password must be at least 8 characters and include 1 capital letter and 1 number.");
      return;
    }

    setIsSubmitting(true);

    const authResult = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role },
      },
    });

    setIsSubmitting(false);

    if (authResult.error) {
      setError(authResult.error.message);
      return;
    }

    if (authResult.data.session) {
      router.push(getPostAuthRoute(authResult.data.user?.user_metadata?.role ?? role));
      return;
    }

    setMessage("Check your email to confirm your account, then log in to create your profile.");
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

        <div className={styles.headerActions}>
          <Link className={styles.loginButton} href="/login">
            Log In
          </Link>
          <a className={styles.signupButton} href="#signup">
            Sign Up
          </a>
        </div>
      </header>

      <section className={styles.sectionTabs} aria-label="AthleteAura landing sections">
        {landingSections.map((section) => {
          const sectionId = section.id ?? section.href.slice(1);
          const isActive = activeSection === sectionId;

          return (
            <a
              aria-current={isActive ? "true" : undefined}
              className={isActive ? styles.activeSectionTab : ""}
              href={section.href}
              key={section.href}
              onClick={(event) => handleSectionNavClick(event, sectionId)}
            >
              {section.label}
            </a>
          );
        })}
      </section>

      <section className={styles.hero} id="top">
        <div className={styles.heroCopy}>
          <p className={styles.badge}>
            <span />
            Built for athletes, coaches, and scouts
          </p>
          <h1>
            Your sports profile.
            <span>Seen by the right people.</span>
          </h1>
          <p className={styles.heroText}>
            Create one profile for your sport details, highlights, achievements, and social links,
            then use the feed to keep your progress visible.
          </p>
          <div className={styles.heroActions}>
            <a className={styles.primaryCta} href="#signup">
              Create Your Profile
              <ArrowRight size={20} />
            </a>
            <a className={styles.secondaryCta} href="#explore-talent">
              Explore Talent
            </a>
          </div>
        </div>

        <aside className={styles.landingSignupPanel} id="signup" aria-label="Create your AthleteAura account">
          <div className={styles.signupCardHeader}>
            <p>Start free</p>
            <h2>Create your profile</h2>
            <span>Already a member? <Link href="/login">Log In</Link></span>
          </div>

          <form className={styles.landingAuthForm} onSubmit={handleLandingSignup}>
            <label>
              Email
              <input
                autoComplete="email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </label>

            <label>
              Password
              <input
                autoComplete="new-password"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                pattern="^(?=.*[A-Z])(?=.*\\d).{8,}$"
                placeholder="Create a password"
                required
                type="password"
                value={password}
              />
            </label>

            <div className={styles.accountTypeGroup}>
              <span>Account type</span>
              <div className={styles.roleGrid} aria-label="Choose account type">
                {accountRoles.map((accountRole) => (
                  <button
                    className={role === accountRole ? styles.selectedRole : ""}
                    key={accountRole}
                    type="button"
                    onClick={() => setRole(accountRole)}
                  >
                    {accountRole === "scout_coach" ? "Coach / Scout" : roleLabels[accountRole]}
                  </button>
                ))}
              </div>
            </div>

            <button className={styles.signupSubmitButton} disabled={isSubmitting} type="submit">
              {isSubmitting ? "Creating account..." : "Create account"}
            </button>
          </form>

          {message && <p className={styles.successMessage}>{message}</p>}
          {error && <p className={styles.errorMessage}>{error}</p>}
        </aside>
      </section>

      <section className={styles.splitSection} id="for-athletes">
        <div className={styles.centerSectionHeading}>
          <p className={styles.kicker}>For Athletes</p>
          <h2>Your profile should speak before you do.</h2>
        </div>
        <div className={styles.centerFeatureGrid}>
          {athleteFeatures.map((feature) => (
            <article className={styles.centerFeature} key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>

        <article className={styles.profileSample} aria-label="Sample athlete profile">
          <div className={styles.sampleHeader}>
            <div className={styles.sampleAvatar}>MH</div>
            <div>
              <strong>Mazen Haitham</strong>
              <span>Football · Winger · Egypt</span>
            </div>
            <small>Athlete profile</small>
          </div>

          <div className={styles.sampleDetails}>
            <span>Current club: Academy team</span>
            <span>Main position: Winger</span>
            <span>Secondary position: Forward</span>
            <span>Preferred foot: Right</span>
          </div>

          <div className={styles.sampleSections}>
            <div>
              <strong>Highlights</strong>
              <p>Match reel, acceleration clip, training video</p>
            </div>
            <div>
              <strong>Social links</strong>
              <p>Instagram · TikTok · YouTube</p>
            </div>
            <div>
              <strong>Recent post</strong>
              <p>Working on first-step speed and finishing this week.</p>
            </div>
          </div>
        </article>
      </section>

      <section className={styles.splitSection} id="for-coaches">
        <div className={styles.centerSectionHeading}>
          <p className={styles.kicker}>For Coaches & Scouts</p>
          <h2>See more than one lucky moment.</h2>
        </div>
        <div className={styles.centerFeatureGrid}>
          {coachFeatures.map((feature) => (
            <article className={styles.centerFeature} key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.previewSection} id="explore-talent">
        <div className={styles.centerSectionHeading}>
          <p className={styles.kicker}>Explore Talent</p>
          <h2>The feed is where progress gets noticed.</h2>
        </div>
        <div className={styles.centerFeatureGrid}>
          {feedFeatures.map((feature) => (
            <article className={styles.centerFeature} key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.finalCta}>
        <p className={styles.kicker}>Ready when you are</p>
        <h2>Start building your sports profile today.</h2>
        <div className={styles.finalActions}>
          <a className={styles.primaryCta} href="#signup">
            Create Your Profile
            <ArrowRight size={20} />
          </a>
          <Link className={styles.secondaryCta} href="/login">
            Log In
          </Link>
        </div>
      </section>

      <footer className={styles.footer}>
        <strong>AthleteAura</strong>
        <span>Profiles, feed posts, highlights, social links, and discovery for sport.</span>
      </footer>
    </main>
  );
}
