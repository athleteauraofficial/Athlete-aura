import Link from "next/link";
import AuthForm from "../auth-form";
import BrandLogo from "@/components/brand/BrandLogo";
import styles from "../page.module.css";

export default function SignupPage() {
  return (
    <main className={styles.authRoutePage}>
      <section className={styles.authRouteShell}>
        <BrandLogo className={styles.brand} theme="light" />

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
