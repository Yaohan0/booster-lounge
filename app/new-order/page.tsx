"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewOrderPage() {
  const supabase = createClient();
  const router = useRouter();

  const [serviceType, setServiceType] = useState("Coaching Session");
  const [currentRank, setCurrentRank] = useState("");
  const [targetRank, setTargetRank] = useState("");
  const [notes, setNotes] = useState("");

  async function createOrder(e: React.FormEvent) {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      service_type: serviceType,
      current_rank: currentRank,
      target_rank: targetRank,
      notes,
    });

    if (error) {
      alert(error.message);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <form
        onSubmit={createOrder}
        className="w-full max-w-lg rounded-xl border border-zinc-800 bg-zinc-900 p-8"
      >
        <h1 className="text-3xl font-bold">Create Order</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Submit a coaching or order-tracking request.
        </p>

        <label className="mt-6 block text-sm text-zinc-400">
          Service type
        </label>

        <select
          className="mt-2 w-full rounded bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
        >
          <option>Coaching Session</option>
          <option>Rank Improvement Guidance</option>
          <option>Gameplay Review</option>
          <option>Team Strategy Help</option>
        </select>

        <input
          className="mt-4 w-full rounded bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder="Current rank"
          value={currentRank}
          onChange={(e) => setCurrentRank(e.target.value)}
        />

        <input
          className="mt-4 w-full rounded bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder="Target rank"
          value={targetRank}
          onChange={(e) => setTargetRank(e.target.value)}
        />

        <textarea
          className="mt-4 min-h-32 w-full rounded bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder="Notes. Do not include passwords, 2FA codes, or recovery info."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <button className="mt-6 w-full rounded bg-yellow-400 p-3 font-bold text-black">
          Submit Order
        </button>

        <Link
          href="/dashboard"
          className="mt-4 block text-center text-sm text-zinc-400 hover:text-white"
        >
          Back to dashboard
        </Link>
      </form>
    </main>
  );
}