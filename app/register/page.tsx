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
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-8"
      >
        <h1 className="text-3xl font-bold">Create account</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Register with email to start creating orders.
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
          placeholder="Password, minimum 8 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />

        <button className="mt-6 w-full rounded bg-yellow-400 p-3 font-bold text-black">
          Register
        </button>

        {message && <p className="mt-4 text-sm text-zinc-300">{message}</p>}

        <p className="mt-6 text-sm text-zinc-400">
          Already have an account?{" "}
          <Link href="/login" className="text-yellow-400">
            Login
          </Link>
        </p>
      </form>
    </main>
  );
}