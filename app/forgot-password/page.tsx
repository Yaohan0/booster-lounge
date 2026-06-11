"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

export default function ForgotPasswordPage() {
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function sendResetEmail(e: React.FormEvent) {
    e.preventDefault();

    setMessage("");
    setErrorMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setErrorMessage("Enter your email first.");
      return;
    }

    setLoading(true);

    const redirectTo = `${window.location.origin}/reset-password`;

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage(
      "Password reset email sent. Check your inbox and open the reset link."
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#08080b] px-6 text-white">
      <section className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-950 p-8 shadow-2xl shadow-yellow-400/10">
        <Link href="/" className="text-lg font-bold text-yellow-400">
          Booster Lounge
        </Link>

        <h1 className="mt-8 text-3xl font-black">Reset your password</h1>

        <p className="mt-3 text-sm text-zinc-400">
          Enter your account email. We will send you a password reset link.
        </p>

        <form onSubmit={sendResetEmail} className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-zinc-300">Email</span>
            <input
              type="email"
              className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
            {loading ? "Sending..." : "Send reset email"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/login" className="text-sm text-zinc-400 hover:text-white">
            Back to login
          </Link>
        </div>
      </section>
    </main>
  );
}