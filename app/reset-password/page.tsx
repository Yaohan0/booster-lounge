"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [checkingSession, setCheckingSession] = useState(true);
  const [hasRecoverySession, setHasRecoverySession] = useState(false);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        setHasRecoverySession(true);
      }

      setCheckingSession(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setHasRecoverySession(true);
      }

      if (session) {
        setHasRecoverySession(true);
      }

      setCheckingSession(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function updatePassword(e: React.FormEvent) {
    e.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!password.trim()) {
      setErrorMessage("Enter a new password.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("Password updated. Redirecting to login...");

    await supabase.auth.signOut();

    setTimeout(() => {
      router.push("/login");
    }, 1200);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08080b] px-6 text-white">
      <section className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl shadow-yellow-400/10">
        <Link href="/" className="text-lg font-bold text-yellow-400">
          Booster Lounge
        </Link>

        <h1 className="mt-8 text-3xl font-black">Set new password</h1>

        <p className="mt-3 text-sm text-zinc-400">
          Enter a new password for your account.
        </p>

        {checkingSession ? (
          <div className="mt-8 rounded-xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-300">
            Checking reset session...
          </div>
        ) : !hasRecoverySession ? (
          <div className="mt-8 space-y-5">
            <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
              This reset link is invalid or expired. Request a new password reset
              email.
            </div>

            <Link
              href="/forgot-password"
              className="block w-full rounded-xl bg-yellow-400 px-4 py-3 text-center font-bold text-black hover:bg-yellow-300"
            >
              Request new reset link
            </Link>
          </div>
        ) : (
          <form onSubmit={updatePassword} className="mt-8 space-y-5">
            <label className="block">
              <span className="text-sm font-semibold text-zinc-300">
                New password
              </span>
              <input
                type="password"
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                placeholder="Minimum 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <label className="block">
              <span className="text-sm font-semibold text-zinc-300">
                Confirm password
              </span>
              <input
                type="password"
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400"
                placeholder="Re-enter new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </label>

            {message && (
              <div className="rounded-xl border border-green-400/30 bg-green-400/10 p-4 text-sm text-green-300">
                {message}
              </div>
            )}

            {errorMessage && (
              <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
                {errorMessage}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-xl bg-yellow-400 px-4 py-3 font-bold text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Updating..." : "Update password"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-zinc-400 hover:text-white">
            Back to login
          </Link>
        </div>
      </section>
    </main>
  );
}