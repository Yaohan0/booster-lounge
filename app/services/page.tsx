"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const serviceTabs = [
  "Rank Boost",
  "Trophy Boost",
  "Prestige Icon",
  "Brawlers Rank",
  "Custom Request",
];

const ranks = [
  "Bronze I",
  "Bronze II",
  "Bronze III",
  "Silver I",
  "Silver II",
  "Silver III",
  "Gold I",
  "Gold II",
  "Gold III",
  "Diamond",
  "Mythic",
  "Legendary",
  "Masters",
  "Pro",
];

export default function ServicesPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [serviceType, setServiceType] = useState("Rank Boost");
  const [currentRank, setCurrentRank] = useState("Bronze I");
  const [targetRank, setTargetRank] = useState("Pro");
  const [notes, setNotes] = useState("");

  const [soloMode, setSoloMode] = useState(true);
  const [stream, setStream] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [specificBrawlers, setSpecificBrawlers] = useState(false);

  const [loading, setLoading] = useState(false);

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const extraNotes = [
      notes,
      "",
      "Options:",
      `Mode: ${soloMode ? "Solo" : "Duo"}`,
      `Stream: ${stream ? "Yes" : "No"}`,
      `Offline mode: ${offlineMode ? "Yes" : "No"}`,
      `Specific brawlers: ${specificBrawlers ? "Yes" : "No"}`,
    ].join("\n");

    const { error } = await supabase.from("order_requests").insert({
      user_id: user.id,
      service_type: serviceType,
      current_rank: currentRank,
      target_rank: targetRank,
      notes: extraNotes,
      status: "pending",
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Request submitted. Admin will review it soon.");
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#08080b] text-white">
      <nav className="border-b border-zinc-900 bg-[#0b0b10]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-bold text-yellow-400">
            Booster Lounge
          </Link>

          <div className="hidden items-center gap-6 text-sm text-zinc-300 md:flex">
            <Link href="/services" className="text-yellow-300">
              Services
            </Link>
            <Link href="/dashboard" className="hover:text-white">
              Dashboard
            </Link>
            <Link href="/login" className="hover:text-white">
              Login
            </Link>
          </div>

          <Link
            href="/register"
            className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <section className="border-b border-zinc-900 bg-[#181821]">
        <div className="mx-auto flex max-w-7xl items-center gap-8 px-6 py-5 text-sm">
          <span className="rounded bg-yellow-400 px-2 py-1 font-bold text-black">
            BS
          </span>
          <Link href="/services" className="border-b-2 border-yellow-400 pb-4">
            Boosting
          </Link>
          <span className="text-zinc-500">Coaching</span>
          <span className="text-zinc-500">Custom Requests</span>
          <span className="text-zinc-500">Order Tracking</span>
        </div>
      </section>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(250,204,21,0.16),_transparent_35%),radial-gradient(circle_at_left,_rgba(59,130,246,0.10),_transparent_30%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-yellow-300">
                Brawl Stars Boosting Service
              </p>

              <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
                Get a custom order request reviewed by admin.
              </h1>

              <p className="mt-5 max-w-2xl text-zinc-400">
                Choose your service, current rank, desired rank, and options.
                Your request will be reviewed before becoming an active order.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
              <p className="text-sm text-zinc-400">Positive feedback</p>
              <p className="mt-2 text-3xl font-bold text-yellow-400">98%</p>
              <p className="mt-1 text-sm text-zinc-500">
                Based on completed orders
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            {serviceTabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setServiceType(tab)}
                className={`rounded-full border px-5 py-2 text-sm font-semibold ${
                  serviceType === tab
                    ? "border-yellow-400 bg-yellow-400 text-black"
                    : "border-zinc-700 bg-zinc-950 text-zinc-300 hover:bg-zinc-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <form
            onSubmit={submitRequest}
            className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px]"
          >
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-yellow-400 text-3xl text-black">
                    ★
                  </div>

                  <div>
                    <p className="text-sm text-zinc-400">Current Rank</p>
                    <h2 className="text-2xl font-bold">{currentRank}</h2>
                  </div>
                </div>

                <label className="text-sm font-semibold text-zinc-300">
                  Current Rank
                </label>
                <select
                  className="mt-2 w-full rounded-xl bg-zinc-800 p-4 outline-none focus:ring-2 focus:ring-yellow-400"
                  value={currentRank}
                  onChange={(e) => setCurrentRank(e.target.value)}
                >
                  {ranks.map((rank) => (
                    <option key={rank}>{rank}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <div className="mb-6 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500 text-3xl text-white">
                    ♛
                  </div>

                  <div>
                    <p className="text-sm text-zinc-400">Desired Rank</p>
                    <h2 className="text-2xl font-bold">{targetRank}</h2>
                  </div>
                </div>

                <label className="text-sm font-semibold text-zinc-300">
                  Desired Rank
                </label>
                <select
                  className="mt-2 w-full rounded-xl bg-zinc-800 p-4 outline-none focus:ring-2 focus:ring-yellow-400"
                  value={targetRank}
                  onChange={(e) => setTargetRank(e.target.value)}
                >
                  {ranks.map((rank) => (
                    <option key={rank}>{rank}</option>
                  ))}
                </select>
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 md:col-span-2">
                <h2 className="text-xl font-bold">Request Notes</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Add any useful details. Do not include passwords, 2FA codes,
                  or recovery information.
                </p>

                <textarea
                  className="mt-4 min-h-36 w-full rounded-xl bg-zinc-800 p-4 outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Example: I want help with ranked push, preferred brawlers, timing, or special instructions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 md:col-span-2">
                <h2 className="text-xl font-bold">Why trust Booster Lounge?</h2>
                <p className="mt-3 text-zinc-400">
                  Your request is reviewed before becoming an active order.
                  Users track everything through the dashboard, including status,
                  credits, and admin chat.
                </p>

                <div className="mt-5 grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-zinc-900 p-4">
                    <p className="font-semibold">No password sharing</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      Never submit account credentials.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-zinc-900 p-4">
                    <p className="font-semibold">Admin reviewed</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      Requests are accepted or rejected manually.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-zinc-900 p-4">
                    <p className="font-semibold">Live dashboard</p>
                    <p className="mt-1 text-sm text-zinc-500">
                      Track status, credits, and chat updates.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <aside className="h-fit rounded-3xl border border-yellow-400/70 bg-zinc-950 p-6 shadow-2xl shadow-yellow-400/10">
              <div className="rounded-2xl bg-gradient-to-br from-blue-400 to-yellow-200 p-5 text-black">
                <p className="text-sm font-bold">CUSTOMIZE ORDER</p>
                <h2 className="mt-2 text-2xl font-black">{serviceType}</h2>
              </div>

              <div className="mt-5 rounded-2xl border border-zinc-800 bg-[#09090d] p-4">
                <div className="grid grid-cols-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-1">
                  <button
                    type="button"
                    onClick={() => setSoloMode(true)}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                      soloMode
                        ? "bg-zinc-700 text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Solo
                  </button>

                  <button
                    type="button"
                    onClick={() => setSoloMode(false)}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                      !soloMode
                        ? "bg-zinc-700 text-white"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Duo
                  </button>
                </div>

                <div className="mt-6 space-y-5">
                  <ToggleRow
                    label="Stream"
                    enabled={stream}
                    setEnabled={setStream}
                  />
                  <ToggleRow
                    label="Offline mode"
                    enabled={offlineMode}
                    setEnabled={setOfflineMode}
                  />
                  <ToggleRow
                    label="Specific brawlers"
                    enabled={specificBrawlers}
                    setEnabled={setSpecificBrawlers}
                  />
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Request Summary</p>

                <div className="mt-4 space-y-3 text-sm">
                  <SummaryRow label="Service" value={serviceType} />
                  <SummaryRow label="Current" value={currentRank} />
                  <SummaryRow label="Target" value={targetRank} />
                  <SummaryRow label="Mode" value={soloMode ? "Solo" : "Duo"} />
                </div>

                <div className="mt-5 rounded-xl bg-yellow-400/10 p-4 text-sm text-yellow-200">
                  Admin will review your request and provide confirmation.
                </div>
              </div>

              <button
                disabled={loading}
                className="mt-5 w-full rounded-xl bg-yellow-400 p-4 font-bold text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit request"}
              </button>

              <p className="mt-4 text-center text-xs text-zinc-500">
                Protected by dashboard review. No account passwords should be
                shared.
              </p>
            </aside>
          </form>
        </div>
      </section>
    </main>
  );
}

type ToggleRowProps = {
  label: string;
  enabled: boolean;
  setEnabled: (value: boolean) => void;
};

function ToggleRow({ label, enabled, setEnabled }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-zinc-200">{label}</span>

      <button
        type="button"
        onClick={() => setEnabled(!enabled)}
        className={`relative h-7 w-12 rounded-full transition ${
          enabled ? "bg-yellow-400" : "bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

type SummaryRowProps = {
  label: string;
  value: string;
};

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-zinc-500">{label}</span>
      <span className="font-semibold text-zinc-200">{value}</span>
    </div>
  );
}