"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Eye,
  Menu,
  MessageCircle,
  PlayCircle,
  Radar,
  Search,
  Target,
  UserRound,
  Users,
  X,
} from "lucide-react";
import styles from "./LandingPage.module.css";

const NAV_ITEMS = [
  { href: "#for-athletes", id: "for-athletes", label: "For Athletes" },
  { href: "#for-coaches", id: "for-coaches", label: "For Coaches & Scouts" },
  { href: "#explore-talent", id: "explore-talent", label: "Explore Talent" },
];

const AUDIENCES = [
  {
    icon: UserRound,
    title: "Athletes",
    points: ["Build one clean sports profile", "Add highlights, stats, and socials", "Show progress beyond one clip"],
  },
  {
    icon: ClipboardCheck,
    title: "Coaches",
    points: ["Review players faster", "Track updates over time", "Save profiles worth watching"],
  },
  {
    icon: Radar,
    title: "Scouts",
    points: ["Discover talent by sport and role", "Open public player profiles", "Spot rising momentum early"],
  },
];

const STEPS = [
  { icon: UserRound, title: "Create your profile", text: "Sport, position, club, country, and physical details." },
  { icon: PlayCircle, title: "Add proof", text: "Highlights, posts, achievements, and social links." },
  { icon: Eye, title: "Get discovered", text: "Coaches and scouts can review your full story." },
  { icon: MessageCircle, title: "Connect", text: "Build attention through follows, comments, saves, and updates." },
];

const COACH_FEATURES = [
  { icon: Users, title: "Discover profiles", text: "Search athletes by sport, role, country, and public details." },
  { icon: PlayCircle, title: "Review highlights", text: "Watch clips and posts beside the player's real profile." },
  { icon: Activity, title: "Follow progress", text: "Track updates before you make contact or save a profile." },
];

const PROFILE_OPTIONS = [
  "Sport, country, club, and position",
  "Height, weight, preferred foot or hand",
  "Highlights, achievements, and certificates",
  "Instagram, TikTok, YouTube, and posts",
];

const FEED_FEATURES = [
  "Training updates, questions, wins, photos, and short videos",
  "Likes, comments, replies, saves, and follows",
  "Every post can lead viewers back to the full profile",
];

function Brand({ dark = false }) {
  return (
    <a className={`${styles.brand} ${dark ? styles.brandDark : ""}`} href="#top" aria-label="AthleteAura home">
      <span className={styles.logoMark} aria-hidden="true" />
      <span className={styles.brandCopy}>
        <strong>
          Athlete<span>Aura</span>
        </strong>
        <small>Rise. Connect. Inspire.</small>
      </span>
    </a>
  );
}

function Header({ activeSection, isMenuOpen, onMenuToggle, onNavClick }) {
  return (
    <header className={styles.header}>
      <Brand />
      <nav className={styles.desktopNav} aria-label="Landing navigation">
        {NAV_ITEMS.map((item) => (
          <a
            className={activeSection === item.id ? styles.activeNavLink : ""}
            href={item.href}
            key={item.id}
            onClick={(event) => onNavClick(event, item.id)}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <div className={styles.headerActions}>
        <Link className={styles.secondaryButton} href="/login">Log In</Link>
        <Link className={styles.primaryButton} href="/signup">Sign Up</Link>
      </div>
      <button
        className={`${styles.menuButton} ${isMenuOpen ? styles.menuButtonOpen : ""}`}
        type="button"
        aria-label={isMenuOpen ? "Close menu" : "Open menu"}
        aria-expanded={isMenuOpen}
        onClick={onMenuToggle}
      >
        {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
      </button>
    </header>
  );
}

function MobileMenu({ isOpen, onClose, onNavClick }) {
  return (
    <>
      <button
        className={`${styles.mobileBackdrop} ${isOpen ? styles.mobileBackdropOpen : ""}`}
        type="button"
        aria-label="Close menu"
        onClick={onClose}
      />
      <aside className={`${styles.mobileMenu} ${isOpen ? styles.mobileMenuOpen : ""}`} aria-hidden={!isOpen}>
        <Brand />
        <nav aria-label="Mobile landing navigation">
          {NAV_ITEMS.map((item) => (
            <a href={item.href} key={item.id} onClick={(event) => onNavClick(event, item.id)}>
              {item.label}
            </a>
          ))}
        </nav>
        <div className={styles.mobileMenuActions}>
          <Link className={styles.secondaryButton} href="/login" onClick={onClose}>Log In</Link>
          <Link className={styles.primaryButton} href="/signup" onClick={onClose}>Sign Up</Link>
        </div>
      </aside>
    </>
  );
}

function HeroVisual() {
  return (
    <aside className={styles.pathCard} aria-label="AthleteAura path preview">
      <h2>
        Your path to being <span>seen</span>
      </h2>
      <div className={styles.pathSteps}>
        <article className={styles.pathStep}>
          <span className={styles.stepNumber}>01</span>
          <div className={styles.stepPanel}>
            <div className={styles.stepIcon}><UserRound size={25} aria-hidden="true" /></div>
            <div>
              <h3>Build your profile</h3>
              <p>Sport, club, position and key details.</p>
            </div>
          </div>
        </article>

        <article className={styles.pathStep}>
          <span className={styles.stepNumber}>02</span>
          <div className={styles.stepPanel}>
            <div className={styles.stepIcon}><PlayCircle size={25} aria-hidden="true" /></div>
            <div>
              <h3>Share your progress</h3>
              <p>Highlights, posts and achievements.</p>
            </div>
          </div>
        </article>

        <article className={styles.pathStep}>
          <span className={styles.stepNumber}>03</span>
          <div className={styles.stepPanel}>
            <div className={styles.stepIcon}><Users size={25} aria-hidden="true" /></div>
            <div>
              <h3>Get discovered</h3>
              <p>Coaches and scouts can review your journey.</p>
            </div>
          </div>
        </article>
      </div>
    </aside>
  );
}

function Hero() {
  return (
    <section className={styles.hero} id="top">
      <div className={styles.heroMessage}>
        <p className={styles.heroKicker}><span />Sports talent network</p>
        <h1>
          Your journey.
          <br />
          Their next <span>opportunity.</span>
        </h1>
        <p>Create your profile, share your highlights, and get discovered by coaches and scouts around the world.</p>
        <div className={styles.heroButtons}>
          <Link className={styles.primaryButton} href="/signup">
            Sign Up
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link
            className={styles.secondaryButton}
            href="/login"
          >
            Log In
          </Link>
        </div>
        <div className={styles.joinStrip} aria-label="AthleteAura community">
          <span>MH</span>
          <span>OA</span>
          <span>YA</span>
          <p>Join athletes worldwide and take your game further.</p>
        </div>
      </div>
      <HeroVisual />
    </section>
  );
}

function SectionIntro({ eyebrow, title }) {
  return (
    <div className={styles.sectionIntro}>
      <p>{eyebrow}</p>
      <h2>{title}</h2>
    </div>
  );
}

function AudienceSection() {
  return (
    <section className={styles.section} id="for-athletes">
      <SectionIntro eyebrow="Built for the people around the game" title="One platform. Three clear paths." />
      <div className={styles.audienceGrid}>
        {AUDIENCES.map((card) => (
          <article className={styles.audienceCard} key={card.title}>
            <card.icon size={24} aria-hidden="true" />
            <h3>{card.title}</h3>
            <ul>
              {card.points.map((point) => (
                <li key={point}>
                  <CheckCircle2 size={15} aria-hidden="true" />
                  {point}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className={styles.section} id="how-it-works">
      <SectionIntro eyebrow="How it works" title="From profile to opportunity." />
      <div className={styles.timeline}>
        {STEPS.map((step, index) => (
          <article className={styles.timelineStep} key={step.title}>
            <span>{index + 1}</span>
            <step.icon size={22} aria-hidden="true" />
            <h3>{step.title}</h3>
            <p>{step.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function PlatformPreview() {
  return (
    <section className={styles.section} id="explore-talent">
      <SectionIntro eyebrow="Explore Talent" title="A profile coaches can actually review." />
      <div className={styles.profilePreviewLayout}>
        <article className={styles.sampleProfileCard} aria-label="Sample AthleteAura athlete profile">
          <header className={styles.sampleProfileHeader}>
            <div className={styles.sampleAvatar}>MH</div>
            <div className={styles.sampleIdentity}>
              <span className={styles.roleBadge}>Athlete profile</span>
              <h3>Mazen Haitham</h3>
              <p>Winger | Football | Academy team</p>
            </div>
            <Link className={styles.sampleEditButton} href="/signup">Create yours</Link>
          </header>

          <div className={styles.completionPreview}>
            <div>
              <strong>Profile options</strong>
              <span>Built around what scouts need to check quickly.</span>
            </div>
            <div className={styles.progressTrack}><span /></div>
          </div>

          <div className={styles.sampleSummaryGrid}>
            <div><strong>Winger</strong><span>Main position</span></div>
            <div><strong>Academy</strong><span>Current club</span></div>
            <div><strong>Egypt</strong><span>Country</span></div>
            <div><strong>Right</strong><span>Preferred foot</span></div>
          </div>

          <div className={styles.sampleProfileSections}>
            <section>
              <h4>Highlights</h4>
              <p>Match reel, acceleration clip, finishing session</p>
            </section>
            <section>
              <h4>Social links</h4>
              <p>Instagram | TikTok | YouTube</p>
            </section>
            <section>
              <h4>Recent post</h4>
              <p>Working on first-step speed and crossing this week.</p>
            </section>
          </div>
        </article>

        <div className={styles.previewInfoStack}>
          <article className={styles.previewInfoCard}>
            <Search size={20} aria-hidden="true" />
            <h3>How coaches review</h3>
            <p>They search talent, open the profile, check details, watch highlights, and follow progress over time.</p>
          </article>
          <article className={styles.previewInfoCard}>
            <Target size={20} aria-hidden="true" />
            <h3>What the profile includes</h3>
            <ul>
              {PROFILE_OPTIONS.map((item) => (
                <li key={item}><CheckCircle2 size={15} aria-hidden="true" />{item}</li>
              ))}
            </ul>
          </article>
          <article className={styles.previewInfoCard}>
            <MessageCircle size={20} aria-hidden="true" />
            <h3>Feed feature</h3>
            <ul>
              {FEED_FEATURES.map((item) => (
                <li key={item}><CheckCircle2 size={15} aria-hidden="true" />{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}

function CoachesSection() {
  return (
    <section className={styles.section} id="for-coaches">
      <SectionIntro eyebrow="For Coaches & Scouts" title="Less guessing. Better context." />
      <div className={styles.coachGrid}>
        {COACH_FEATURES.map((feature) => (
          <article key={feature.title}>
            <feature.icon size={24} aria-hidden="true" />
            <h3>{feature.title}</h3>
            <p>{feature.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className={styles.finalCta}>
      <p>Start building your athletic future.</p>
      <div>
        <Link className={styles.primaryButton} href="/signup">
          Join as Athlete
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
        <Link
          className={styles.secondaryButton}
          href="/signup?role=scout_coach"
        >
          Explore Talent
        </Link>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className={styles.footer}>
      <Brand dark />
      <span>Profiles, highlights, feed posts, and discovery for sport.</span>
    </footer>
  );
}

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("top");

  useEffect(() => {
    const sectionIds = ["top", ...NAV_ITEMS.map((item) => item.id)];
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((first, second) => second.intersectionRatio - first.intersectionRatio);

        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-24% 0px -52% 0px", threshold: [0.12, 0.32, 0.58] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  function handleNavClick(event, sectionId) {
    event.preventDefault();
    document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(sectionId);
    setIsMenuOpen(false);
  }

  return (
    <main className={styles.page}>
      <Header
        activeSection={activeSection}
        isMenuOpen={isMenuOpen}
        onMenuToggle={() => setIsMenuOpen((open) => !open)}
        onNavClick={handleNavClick}
      />
      <MobileMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onNavClick={handleNavClick} />
      <Hero />
      <AudienceSection />
      <HowItWorks />
      <PlatformPreview />
      <CoachesSection />
      <CTASection />
      <Footer />
    </main>
  );
}
