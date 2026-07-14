import Link from "next/link";
import styles from "./BrandLogo.module.css";

export default function BrandLogo({
  className = "",
  href = "/",
  showTagline = true,
  theme = "dark",
}) {
  return (
    <Link
      aria-label="AthleteAura home"
      className={`${styles.brand} ${styles[theme] ?? styles.dark} ${!showTagline ? styles.noTagline : ""} ${className}`}
      href={href}
    >
      <span className={styles.logoMark} aria-hidden="true" />
      <span className={styles.brandCopy}>
        <strong>
          Athlete<span>Aura</span>
        </strong>
        {showTagline && <small>Rise. Connect. Inspire.</small>}
      </span>
    </Link>
  );
}
