import Link from "next/link";
import AuthForm from "../auth-form";
import BrandLogo from "@/components/brand/BrandLogo";
import styles from "../page.module.css";

export default function LoginPage() {
  return (
    <main className={styles.authRoutePage}>
      <section className={styles.authRouteShell}>
        <BrandLogo className={styles.brand} theme="light" />

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
