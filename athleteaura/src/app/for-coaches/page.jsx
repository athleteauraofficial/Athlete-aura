import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Eye, PlayCircle, Star, Users } from "lucide-react";
import PublicHeader from "@/components/landing/PublicHeader";
import styles from "@/components/landing/LandingPage.module.css";

const FEATURES = [
  {
    icon: Eye,
    title: "Discover Athletes",
    text: "Explore athlete profiles by sport, position, country, and context.",
  },
  {
    icon: PlayCircle,
    title: "Review Profiles & Highlights",
    text: "See sport details, clips, posts, achievements, and activity.",
  },
  {
    icon: Users,
    title: "Follow Progress",
    text: "Track athletes over time before making contact.",
  },
  {
    icon: Star,
    title: "Save Talent",
    text: "Build a shortlist of players worth watching.",
  },
];

export default function ForCoachesPage() {
  return (
    <main className={styles.page}>
      <PublicHeader current="coaches" />

      <section className={`${styles.splitHero} ${styles.coachSplit}`}>
        <Image
          className={styles.splitImage}
          src="/images/coach-hero.png"
          alt="Coach or scout reviewing players on a football training pitch"
          width={1600}
          height={1100}
          priority
          sizes="100vw"
        />
        <div className={styles.splitContent}>
          <p className={styles.splitEyebrow}>For Coaches & Scouts</p>
          <h1>
            Discover talent
            <br />
            with <span>more context.</span>
          </h1>
          <p>
            Review athlete profiles, highlights, activity, and progress before making contact.
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
            One clip is not enough. AthleteAura helps you see the bigger picture.
          </p>

          <div className={styles.splitActions}>
            <Link className={styles.coachButton} href="/signup">
              Start Discovering Athletes
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
