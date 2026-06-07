"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import Link from "next/link";

export default function RegisterPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Account created. Check your email to verify your account.");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#27272a,_#09090b_55%)] px-6 py-10 text-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="text-xl font-bold text-yellow-400">
          Booster Lounge
        </Link>

        <Link
          href="/login"
          className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-900"
        >
          Login
        </Link>
      </nav>

      <section className="mx-auto mt-20 grid max-w-6xl items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="inline-flex rounded-full border border-yellow-400/40 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-300">
            Create your account
          </p>

          <h1 className="mt-6 text-5xl font-bold tracking-tight">
            Start tracking your orders.
          </h1>

          <p className="mt-5 max-w-xl text-zinc-400">
            Register to view assigned orders, credit balance, order status, and
            admin chat updates from one dashboard.
          </p>

          <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 text-sm text-zinc-400">
            Do not submit Supercell ID passwords, email passwords, 2FA codes, or
            recovery information.
          </div>
        </div>

        <form
          onSubmit={handleRegister}
          className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8 shadow-2xl"
        >
          <h2 className="text-3xl font-bold">Create account</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Use your email to create a Booster Lounge account.
          </p>

          <label className="mt-6 block text-sm font-medium text-zinc-300">
            Email
          </label>
          <input
            className="mt-2 w-full rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label className="mt-4 block text-sm font-medium text-zinc-300">
            Password
          </label>
          <input
            className="mt-2 w-full rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
            type="password"
            placeholder="Minimum 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />

          <button className="mt-6 w-full rounded-xl bg-yellow-400 p-3 font-bold text-black hover:bg-yellow-300">
            Register
          </button>

          {message && (
            <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-900 p-3 text-sm text-zinc-300">
              {message}
            </div>
          )}

          <p className="mt-6 text-center text-sm text-zinc-400">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-yellow-400">
              Login
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}