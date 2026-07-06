"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { accountRoles, getPostAuthRoute, isStrongPassword, roleLabels } from "@/lib/auth";
import { hasSupabaseEnv, supabase, supabaseConfigError } from "@/lib/supabase";
import styles from "./page.module.css";

const LAST_ACCOUNT_KEY = "athleteaura:lastAccount";

function getStoredLastAccount() {
  if (typeof window === "undefined") return null;

  try {
    return JSON.parse(window.localStorage.getItem(LAST_ACCOUNT_KEY) ?? "null");
  } catch {
    return null;
  }
}

function rememberLastAccount(user) {
  if (typeof window === "undefined" || !user?.email) return;

  window.localStorage.setItem(
    LAST_ACCOUNT_KEY,
    JSON.stringify({
      email: user.email,
      name: user.user_metadata?.full_name ?? user.email,
    })
  );
}

export default function AuthForm({ mode = "signup" }) {
  const router = useRouter();
  const isSignup = mode !== "login";
  const [role, setRole] = useState("athlete");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitchingAccount, setIsSwitchingAccount] = useState(false);
  const [lastAccount, setLastAccount] = useState(null);
  const [authChoice, setAuthChoice] = useState("");

  const selectedRoleLabel = useMemo(() => roleLabels[role], [role]);
  const shouldShowLoginChoice = !isSignup && !user && lastAccount && !authChoice;
  const shouldShowSignupChoice = isSignup && !user && authChoice !== "signup";

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      if (!hasSupabaseEnv) {
        setError(supabaseConfigError);
        return;
      }

      if (isMounted) {
        setLastAccount(getStoredLastAccount());
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

    if (isSignup && !isStrongPassword(password)) {
      setError("Password must be at least 8 characters and include 1 capital letter and 1 number.");
      return;
    }

    setIsLoading(true);

    const authResult = isSignup
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
      isSignup
        ? "Check your email to confirm your account, then sign in to create your profile."
        : "You are signed in."
    );
  }

  async function handleUseAnotherAccount() {
    if (!hasSupabaseEnv) {
      setError(supabaseConfigError);
      return;
    }

    setIsSwitchingAccount(true);
    setError("");
    setMessage("");

    const { error: signOutError } = await supabase.auth.signOut();

    setIsSwitchingAccount(false);

    if (signOutError) {
      setError(signOutError.message);
      return;
    }

    rememberLastAccount(user);
    setLastAccount(getStoredLastAccount());
    setUser(null);
    setEmail(isSignup ? "" : "");
    setPassword("");
    setAuthChoice(isSignup ? "signup" : "other");
  }

  function handleContinueAsLastAccount() {
    setEmail(lastAccount?.email ?? "");
    setPassword("");
    setAuthChoice("same");
    setError("");
    setMessage("");
  }

  function handleUseDifferentEmail() {
    setEmail("");
    setPassword("");
    setAuthChoice("other");
    setError("");
    setMessage("");
  }

  return (
    <div className={styles.pageShell}>
      <section className={styles.authPanel} aria-label="AthleteAura authentication">
        <div className={styles.brandBlock}>
          <p className={styles.kicker}>AthleteAura</p>
          <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
          <p>
            {isSignup
              ? "Sign up with email, choose your account type, and start building your profile."
              : "Log in with your email and password."}
          </p>
        </div>

        {user ? (
          <div className={styles.signedInPanel}>
            <p className={styles.statusLabel}>Signed in</p>
            <h2>{user.email}</h2>
            <p>Account type: {roleLabels[user.user_metadata?.role] ?? "Not set"}</p>
            <div className={styles.signedInActions}>
              <button
                className={styles.primaryButton}
                type="button"
                onClick={() => router.push(getPostAuthRoute(user.user_metadata?.role))}
              >
                Go to my profile
              </button>
              <button
                className={styles.secondaryButton}
                disabled={isSwitchingAccount}
                type="button"
                onClick={handleUseAnotherAccount}
              >
                {isSwitchingAccount
                  ? "Preparing..."
                  : isSignup
                    ? "Create new account"
                    : "Log in with another account"}
              </button>
            </div>
          </div>
        ) : shouldShowLoginChoice ? (
          <div className={styles.authChoicePanel}>
            <button className={styles.loginSubmitButton} type="button" onClick={handleContinueAsLastAccount}>
              Continue as {lastAccount.email}
            </button>
            <button className={styles.secondaryButton} type="button" onClick={handleUseDifferentEmail}>
              Use another email
            </button>
          </div>
        ) : shouldShowSignupChoice ? (
          <div className={styles.authChoicePanel}>
            <button className={styles.secondaryButton} type="button" onClick={() => router.push("/login")}>
              Log in with existing account
            </button>
            <button
              className={styles.signupSubmitButton}
              type="button"
              onClick={() => {
                setAuthChoice("signup");
                setError("");
                setMessage("");
              }}
            >
              Create new account
            </button>
          </div>
        ) : (
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
                autoComplete={isSignup ? "new-password" : "current-password"}
                minLength={isSignup ? 8 : 6}
                onChange={(event) => setPassword(event.target.value)}
                pattern={isSignup ? "^(?=.*[A-Z])(?=.*\\d).{8,}$" : undefined}
                placeholder="Your password"
                required
                type="password"
                value={password}
              />
            </label>

            {isSignup && (
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

            <button className={isSignup ? styles.signupSubmitButton : styles.loginSubmitButton} disabled={isLoading} type="submit">
              {isLoading
                ? isSignup
                  ? "Creating account..."
                  : "Logging in..."
                : isSignup
                  ? `Create ${selectedRoleLabel} account`
                  : "Log In"}
            </button>
          </form>
        )}

        {message && <p className={styles.successMessage}>{message}</p>}
        {error && <p className={styles.errorMessage}>{error}</p>}
      </section>
    </div>
  );
}
