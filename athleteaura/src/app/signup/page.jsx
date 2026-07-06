import Link from "next/link";
import AuthForm from "../auth-form";
import styles from "../page.module.css";

export default function SignupPage() {
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
          <AuthForm mode="signup" />
          <p className={styles.authSwitchText}>
            Already have an account? <Link href="/login">Log In</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
