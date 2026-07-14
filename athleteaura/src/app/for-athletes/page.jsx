import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Eye, PlayCircle, TrendingUp, UserRound } from "lucide-react";
import PublicHeader from "@/components/landing/PublicHeader";
import styles from "@/components/landing/LandingPage.module.css";

const FEATURES = [
  {
    icon: UserRound,
    title: "Build Your Sports Profile",
    text: "Add sport, position, club, height, weight, country, and key details.",
  },
  {
    icon: PlayCircle,
    title: "Share Highlights",
    text: "Add clips, photos, achievements, posts, and important updates.",
  },
  {
    icon: TrendingUp,
    title: "Show Progress Over Time",
    text: "Build credibility with consistent updates and activity.",
  },
  {
    icon: Eye,
    title: "Get Discovered",
    text: "Share one profile link coaches and scouts can review quickly.",
  },
];

export default function ForAthletesPage() {
  return (
    <main className={styles.page}>
      <PublicHeader current="athletes" />

      <section className={`${styles.splitHero} ${styles.athleteSplit}`}>
        <Image
          className={styles.splitImage}
          src="/images/athlete-hero.png"
          alt="Football athlete training on a stadium pitch"
          width={1600}
          height={1100}
          priority
          sizes="100vw"
        />
        <div className={styles.splitContent}>
          <p className={styles.splitEyebrow}>For Athletes</p>
          <h1>
            A profile built
            <br />
            around <span>your sport.</span>
          </h1>
          <p>
            Show your details, highlights, achievements, and progress in one place.
          </p>

          <div className={styles.splitCards}>
            {FEATURES.map((feature) => (
              <article className={styles.splitCard} key={feature.title}>
                <feature.icon size={34} aria-hidden="true" />
                <div>
                  <h2>{feature.title}</h2>
                  <p>{feature.text}</p>
                </div>
              </article>
            ))}
          </div>

          <p className={styles.splitNote}>
            Coaches should not need to search across different apps to understand who you are.
          </p>

          <div className={styles.splitActions}>
            <Link className={styles.primaryButton} href="/signup">
              Create Your Athlete Profile
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
