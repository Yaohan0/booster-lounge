"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(error.message);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role === "admin") {
        router.push("/admin");
        return;
      }
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#27272a,_#09090b_55%)] px-6 py-10 text-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" className="text-xl font-bold text-yellow-400">
          Booster Lounge
        </Link>

        <Link
          href="/register"
          className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
        >
          Create Account
        </Link>
      </nav>

      <section className="mx-auto mt-20 grid max-w-6xl items-center gap-10 lg:grid-cols-2">
        <div>
          <p className="inline-flex rounded-full border border-yellow-400/40 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-300">
            Welcome back
          </p>

          <h1 className="mt-6 text-5xl font-bold tracking-tight">
            Login to your dashboard.
          </h1>

          <p className="mt-5 max-w-xl text-zinc-400">
            Track assigned orders, view credit balance, and continue admin/user
            chat from your account.
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8 shadow-2xl"
        >
          <h2 className="text-3xl font-bold">Login</h2>
          <p className="mt-2 text-sm text-zinc-400">
            Enter your email and password to continue.
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
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button className="mt-6 w-full rounded-xl bg-yellow-400 p-3 font-bold text-black hover:bg-yellow-300">
            Login
          </button>


          <Link
            href="/forgot-password"
            className="text-sm text-yellow-300 hover:text-yellow-200"
          >
            Forgot password?
          </Link>

          <p className="mt-6 text-center text-sm text-zinc-400">
            No account?{" "}
            <Link href="/register" className="font-semibold text-yellow-400">
              Register
            </Link>
          </p>
          
        </form>
      </section>
    </main>
  );
}