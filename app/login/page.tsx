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
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-8"
      >
        <h1 className="text-3xl font-bold">Login</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Access your Booster Lounge dashboard.
        </p>

        <input
          className="mt-6 w-full rounded bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <input
          className="mt-4 w-full rounded bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button className="mt-6 w-full rounded bg-yellow-400 p-3 font-bold text-black">
          Login
        </button>

        <p className="mt-6 text-sm text-zinc-400">
          No account?{" "}
          <Link href="/register" className="text-yellow-400">
            Register
          </Link>
        </p>
      </form>
    </main>
  );
}