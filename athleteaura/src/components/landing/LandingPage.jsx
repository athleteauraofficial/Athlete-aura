"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BarChart3,
  Bookmark,
  Dumbbell,
  Eye,
  PlayCircle,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import BrandLogo from "@/components/brand/BrandLogo";
import PublicHeader from "@/components/landing/PublicHeader";
import styles from "./LandingPage.module.css";

const WORKFLOW = [
  { step: "01", title: "Create your account", text: "Choose athlete or coach/scout and start with email." },
  { step: "02", title: "Build your profile", text: "Add the details people need before they review you." },
  { step: "03", title: "Share, discover, grow", text: "Use posts, highlights, follows, and saves to build momentum." },
];

const HERO_FEATURES = [
  { icon: UserRound, title: "Build Your Profile", text: "Show your skills, achievements and sports background." },
  { icon: PlayCircle, title: "Share Highlights", text: "Upload videos, photos and update your progress." },
  { icon: Eye, title: "Get Discovered", text: "Coaches and scouts find talent like yours." },
  { icon: Users, title: "Connect & Grow", text: "Build connections that can shape your future." },
  { icon: BarChart3, title: "Track Progress", text: "Stay consistent and see your improvement." },
];

function HeroVisualImage() {
  return (
    <div className={styles.heroVisualFrame}>
      <Image
        className={styles.heroVisualImage}
        src="/images/landing-hero-collage-final.png"
        alt="AthleteAura sports visual with football, basketball, running, and gym athletes"
        width={1536}
        height={1024}
        priority
      />
    </div>
  );
}

function Hero() {
  return (
    <section className={styles.landingHero}>
      <div className={styles.landingHeroText}>
        <p className={styles.landingKicker}>Connect. Grow. Succeed.</p>
        <h1>
          Your journey.
          <br />
          Their next
          <br />
          <span>opportunity.</span>
        </h1>
        <p>
          AthleteAura is the bridge between athletes and coaches. Showcase your talent, build your profile, and get discovered by the right people.
        </p>
        <div className={styles.landingHeroActions}>
          <Link className={styles.primaryButton} href="/signup">
            Create Your Profile
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link className={styles.landingOutlineButton} href="/explore-talent">
            Explore Talent
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </div>
      <HeroVisualImage />
    </section>
  );
}

function LandingFeatureStrip() {
  return (
    <section className={styles.landingFeatureStrip} aria-label="AthleteAura features">
      {HERO_FEATURES.map((feature) => (
        <article key={feature.title}>
          <feature.icon size={34} aria-hidden="true" />
          <div>
            <h2>{feature.title}</h2>
            <p>{feature.text}</p>
          </div>
        </article>
      ))}
    </section>
  );
}

function PlatformSection() {
  return (
    <section className={`${styles.whatAthleteAuraDoes} ${styles.revealBlock}`} data-landing-reveal>
      <div className={styles.whatAthleteAuraContent}>
        <p className={styles.whatEyebrow}>What AthleteAura does</p>
        <h2>
          One place for profiles,
          <br />
          progress, and discovery.
        </h2>
        <p className={styles.whatDescription}>
          AthleteAura brings profiles, highlights, progress, and talent discovery together in one place.
        </p>
        <div className={styles.whatAccentLine} aria-hidden="true" />
      </div>
    </section>
  );
}

function WorkflowSection() {
  return (
    <section className={styles.section}>
      <div className={styles.sectionIntro}>
        <p>How it works</p>
        <h2>Start simple. Build momentum.</h2>
      </div>
      <div className={styles.workflow}>
        {WORKFLOW.map((item) => (
          <article key={item.step}>
            <span>{item.step}</span>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function AudienceCards() {
  return (
    <section className={styles.audienceSection}>
      <div className={styles.audienceSplit}>
        <article className={styles.audiencePanel}>
          <Dumbbell size={28} aria-hidden="true" />
          <h2>For Athletes</h2>
          <p>Create a sports profile, share highlights, post progress, and make your journey easier to review.</p>
          <Link className={styles.audienceLearnMore} href="/for-athletes">
            Learn more
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </article>
        <article className={styles.audiencePanel}>
          <ShieldCheck size={28} aria-hidden="true" />
          <h2>For Coaches & Scouts</h2>
          <p>Discover athletes, review their profile context, follow updates, and save talent worth watching.</p>
          <Link className={styles.audienceLearnMore} href="/for-coaches">
            Learn more
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </article>
      </div>
    </section>
  );
}

function ProductPreview() {
  return (
    <section className={styles.section}>
      <div className={styles.productPreview}>
        <div>
          <p className={styles.kicker}><span />Platform preview</p>
          <h2>Profiles connect the feed, highlights, socials, and discovery.</h2>
          <p>
            Every update can lead people back to a public profile with sport details, highlights, achievements, and recent posts.
          </p>
        </div>
        <div className={styles.previewColumns}>
          <article><UserRound size={22} /><strong>Profile</strong><span>Sport, position, club, country</span></article>
          <article><PlayCircle size={22} /><strong>Highlights</strong><span>Clips, photos, achievements</span></article>
          <article><Bookmark size={22} /><strong>Saved talent</strong><span>Follow and revisit athletes</span></article>
          <article><BarChart3 size={22} /><strong>Progress</strong><span>Posts and activity over time</span></article>
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section className={styles.finalCta}>
      <h2>Start building your sports profile today.</h2>
      <div>
        <Link className={styles.primaryButton} href="/signup">Sign Up</Link>
        <Link className={styles.secondaryButton} href="/login">Log In</Link>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <main className={styles.page}>
      <PublicHeader />
      <Hero />
      <LandingFeatureStrip />
      <PlatformSection />
      <WorkflowSection />
      <AudienceCards />
      <ProductPreview />
      <FinalCta />
      <footer className={styles.footer}>
        <BrandLogo theme="light" />
        <span>Profiles, highlights, feed posts, and discovery for sport.</span>
      </footer>
    </main>
  );
}
