"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { accountRoles, getPostAuthRoute, isStrongPassword, roleLabels } from "@/lib/auth";
import { hasSupabaseEnv, supabase, supabaseConfigError } from "@/lib/supabase";
import styles from "./page.module.css";

export default function AuthForm({ initialMode = "register" }) {
  const router = useRouter();
  const [mode, setMode] = useState(initialMode);
  const [role, setRole] = useState("athlete");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const selectedRoleLabel = useMemo(() => roleLabels[role], [role]);
  const passwordChecks = [
    { label: "At least 8 characters", isMet: password.length >= 8 },
    { label: "1 capital letter", isMet: /[A-Z]/.test(password) },
    { label: "1 number", isMet: /\d/.test(password) },
  ];

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      if (!hasSupabaseEnv) {
        setError(supabaseConfigError);
        return;
      }

      let data;
      try {
        const result = await supabase.auth.getUser();
        data = result.data;
      } catch {
        if (isMounted) {
          setError("Unable to reach Supabase. Check your connection and try again.");
        }
        return;
      }

      if (!isMounted) {
        return;
      }

      setUser(data.user);
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleEmailAuth(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!hasSupabaseEnv) {
      setError(supabaseConfigError);
      return;
    }

    if (mode === "register" && !isStrongPassword(password)) {
      setError("Password must be at least 8 characters and include 1 capital letter and 1 number.");
      return;
    }

    setIsLoading(true);

    const authResult =
      mode === "register"
        ? await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { role },
            },
          })
        : await supabase.auth.signInWithPassword({
            email,
            password,
          });

    setIsLoading(false);

    if (authResult.error) {
      setError(authResult.error.message);
      return;
    }

    setUser(authResult.data.user);

    if (authResult.data.session) {
      router.push(getPostAuthRoute(authResult.data.user?.user_metadata?.role ?? role));
      return;
    }

    setMessage(
      mode === "register"
        ? "Check your email to confirm your account, then sign in to create your profile."
        : "You are signed in."
    );
  }

  return (
    <div className={styles.pageShell}>
      <section className={styles.authPanel} aria-label="AthleteAura authentication">
        <div className={styles.brandBlock}>
          <p className={styles.kicker}>AthleteAura</p>
          <h1>{mode === "register" ? "Create your account" : "Welcome back"}</h1>
          <p>{mode === "register" ? "Sign up with email and choose your account type." : "Log in with your email and password."}</p>
        </div>

        <div className={styles.modeSwitch} aria-label="Authentication mode">
          <button
            className={mode === "register" ? styles.activeSwitch : ""}
            type="button"
            onClick={() => setMode("register")}
          >
            Sign Up
          </button>
          <button
            className={mode === "login" ? styles.activeSwitch : ""}
            type="button"
            onClick={() => setMode("login")}
          >
            Log In
          </button>
        </div>

        {user ? (
          <div className={styles.signedInPanel}>
            <p className={styles.statusLabel}>Signed in</p>
            <h2>{user.email}</h2>
            <p>Account type: {roleLabels[user.user_metadata?.role] ?? "Not set"}</p>
            <button
              className={styles.primaryButton}
              type="button"
              onClick={() => router.push(getPostAuthRoute(user.user_metadata?.role))}
            >
              Go to my profile
            </button>
          </div>
        ) : (
          <>
            <form className={styles.authForm} onSubmit={handleEmailAuth}>
              <label>
                Email
                <input
                  autoComplete="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  required
                  type="email"
                  value={email}
                />
              </label>

              <label>
                Password
                <input
                  autoComplete={mode === "register" ? "new-password" : "current-password"}
                  minLength={mode === "register" ? 8 : 6}
                  onChange={(event) => setPassword(event.target.value)}
                  pattern={mode === "register" ? "^(?=.*[A-Z])(?=.*\\d).{8,}$" : undefined}
                  placeholder={mode === "register" ? "8+ chars, 1 capital, 1 number" : "Your password"}
                  required
                  type="password"
                  value={password}
                />
              </label>

              {mode === "register" && (
                <div className={styles.passwordChecklist} aria-label="Password requirements">
                  {passwordChecks.map((check) => (
                    <span className={check.isMet ? styles.passwordCheckMet : ""} key={check.label}>
                      {check.isMet ? "✓" : "•"} {check.label}
                    </span>
                  ))}
                </div>
              )}

              {mode === "register" && (
                <div className={styles.accountTypeGroup}>
                  <span>Account type</span>
                  <div className={styles.roleGrid} aria-label="Choose account type">
                    {accountRoles.map((accountRole) => (
                      <button
                        className={role === accountRole ? styles.selectedRole : ""}
                        key={accountRole}
                        type="button"
                        onClick={() => setRole(accountRole)}
                      >
                        <span>{accountRole === "scout_coach" ? "Coach / Scout" : roleLabels[accountRole]}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button className={styles.primaryButton} disabled={isLoading} type="submit">
                {isLoading
                  ? mode === "register"
                    ? "Creating account..."
                    : "Logging in..."
                  : mode === "register"
                    ? `Create ${selectedRoleLabel} account`
                    : "Log In"}
              </button>
            </form>
          </>
        )}

        {message && <p className={styles.successMessage}>{message}</p>}
        {error && <p className={styles.errorMessage}>{error}</p>}
      </section>
    </div>
  );
}
