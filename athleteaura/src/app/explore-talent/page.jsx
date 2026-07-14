import Link from "next/link";
import { ArrowRight, Bookmark, Heart, MessageCircle, PlayCircle, Share2, UserRound } from "lucide-react";
import PublicHeader from "@/components/landing/PublicHeader";
import styles from "@/components/landing/LandingPage.module.css";

const FEED_FEATURES = [
  {
    icon: PlayCircle,
    title: "Post your game",
    text: "Training work, match thoughts, questions, wins, photos, and short videos all live in the feed.",
  },
  {
    icon: UserRound,
    title: "Lead back to profile",
    text: "Every update connects people to your sport details, highlights, achievements, and socials.",
  },
  {
    icon: Heart,
    title: "Build attention",
    text: "Likes, comments, replies, saves, and follows help consistent progress get noticed.",
  },
];

export default function ExploreTalentPage() {
  return (
    <main className={styles.page}>
      <PublicHeader current="explore" />

      <section className={styles.exploreTalentHero}>
        <div className={styles.exploreTalentIntro}>
          <p className={styles.kicker}><span />Explore Talent</p>
          <h1>See the feed. Open the profile. Understand the player.</h1>
          <p>
            AthleteAura connects posts with public profiles, so coaches and scouts can review progress, highlights, and details from one place.
          </p>
          <div className={styles.heroActions}>
            <Link className={styles.coachButton} href="/signup?role=scout_coach">
              Create Scout Account
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className={styles.feedProfilePreview} aria-label="Explore Talent feed and profile sample">
          <article className={styles.samplePost}>
            <header>
              <span>MH</span>
              <div>
                <strong>Mazen Haitham</strong>
                <p>Athlete · Egypt · Training</p>
              </div>
            </header>
            <p className={styles.samplePostText}>
              Lower-body session today. Working on first-step speed before the weekend match.
            </p>
            <div className={styles.sampleMedia}>
              <PlayCircle size={40} aria-hidden="true" />
              <span>Short video highlight</span>
            </div>
            <footer>
              <span><Heart size={17} /> 24</span>
              <span><MessageCircle size={17} /> 6</span>
              <span><Bookmark size={17} /> Save</span>
              <span><Share2 size={17} /> Profile</span>
            </footer>
          </article>

          <article className={styles.sampleProfile}>
            <header>
              <span>MH</span>
              <div>
                <strong>Mazen Haitham</strong>
                <p>Football · Winger · Egypt</p>
              </div>
            </header>
            <div className={styles.sampleProfileRows}>
              <p><strong>Club</strong><span>Academy team</span></p>
              <p><strong>Main position</strong><span>Winger</span></p>
              <p><strong>Secondary</strong><span>Forward</span></p>
              <p><strong>Socials</strong><span>Instagram · TikTok · YouTube</span></p>
            </div>
            <div className={styles.sampleHighlights}>
              <strong>Highlights</strong>
              <span>Match reel</span>
              <span>Acceleration clip</span>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.feedFeatureSection}>
        {FEED_FEATURES.map((feature) => (
          <article key={feature.title}>
            <feature.icon size={28} aria-hidden="true" />
            <h2>{feature.title}</h2>
            <p>{feature.text}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
