import Link from "next/link";
import AuthForm from "../auth-form";
import styles from "../page.module.css";

export default function LoginPage() {
  return (
    <main className={styles.authRoutePage}>
      <section className={styles.authRouteShell}>
        <Link className={styles.brand} href="/">
          <strong>
            ATHLETE<span>AURA</span>
          </strong>
          <small>Rise. Connect. Inspire.</small>
        </Link>

        <div className={styles.authRouteCard}>
          <AuthForm mode="login" />
          <p className={styles.authSwitchText}>
            New to AthleteAura? <Link href="/signup">Sign Up</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
