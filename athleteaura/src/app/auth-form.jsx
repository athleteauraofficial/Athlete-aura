"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { hasSupabaseEnv, supabase, supabaseConfigError } from "@/lib/supabase";
import styles from "./page.module.css";

const pendingRoleKey = "athleteaura.pendingRole";

const roleLabels = {
  athlete: "Athlete",
  scout_coach: "Scout / Coach",
};

const accountRoles = ["athlete", "scout_coach"];

function getPostAuthRoute(userRole) {
  return userRole === "scout_coach" ? "/scout/profile" : "/profile";
}

export default function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState("register");
  const [role, setRole] = useState("athlete");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const selectedRoleLabel = useMemo(() => roleLabels[role], [role]);

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

      const pendingRole = window.localStorage.getItem(pendingRoleKey);
      if (data.user && pendingRole && !data.user.user_metadata?.role) {
        const { data: updatedUser, error: updateError } = await supabase.auth.updateUser({
          data: { role: pendingRole },
        });

        if (updateError) {
          setError(updateError.message);
        } else {
          setUser(updatedUser.user);
          window.localStorage.removeItem(pendingRoleKey);
        }
      }
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

  async function handleOAuth(provider) {
    setError("");
    setMessage("");

    if (!hasSupabaseEnv) {
      setError(supabaseConfigError);
      return;
    }

    setIsLoading(true);
    window.localStorage.setItem(pendingRoleKey, role);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}${getPostAuthRoute(role)}`,
      },
    });

    if (oauthError) {
      window.localStorage.removeItem(pendingRoleKey);
      setError(oauthError.message);
      setIsLoading(false);
    }
  }

  return (
    <main className={styles.pageShell}>
      <section className={styles.authPanel} aria-label="AthleteAura authentication">
        <div className={styles.brandBlock}>
          <p className={styles.kicker}>AthleteAura</p>
          <h1>{mode === "register" ? "Create your account" : "Welcome back"}</h1>
          <p>
            Choose your account type first. After signup, you will create your full
            profile on the next page.
          </p>
        </div>

        <div className={styles.modeSwitch} aria-label="Authentication mode">
          <button
            className={mode === "register" ? styles.activeSwitch : ""}
            type="button"
            onClick={() => setMode("register")}
          >
            Register
          </button>
          <button
            className={mode === "login" ? styles.activeSwitch : ""}
            type="button"
            onClick={() => setMode("login")}
          >
            Login
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
            <div className={styles.roleGrid} aria-label="Choose account type">
              {accountRoles.map((accountRole) => (
                <button
                  className={role === accountRole ? styles.selectedRole : ""}
                  key={accountRole}
                  type="button"
                  onClick={() => setRole(accountRole)}
                >
                  <span>{roleLabels[accountRole]}</span>
                </button>
              ))}
            </div>

            <div className={styles.oauthGrid}>
              <button type="button" onClick={() => handleOAuth("google")} disabled={isLoading}>
                Continue with Google
              </button>
              <button type="button" onClick={() => handleOAuth("apple")} disabled={isLoading}>
                Continue with Apple
              </button>
            </div>

            <div className={styles.divider}>
              <span>or use email</span>
            </div>

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
                  minLength={6}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="At least 6 characters"
                  required
                  type="password"
                  value={password}
                />
              </label>

              <button className={styles.primaryButton} disabled={isLoading} type="submit">
                {isLoading
                  ? "Working..."
                  : mode === "register"
                    ? `Create ${selectedRoleLabel} account`
                    : "Login"}
              </button>
            </form>
          </>
        )}

        {message && <p className={styles.successMessage}>{message}</p>}
        {error && <p className={styles.errorMessage}>{error}</p>}
      </section>
    </main>
  );
}
