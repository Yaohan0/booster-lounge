"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import GameSwitcher from "../../components/GameSwitcher";
import {
  GameKey,
  gameHref,
  getGameFromSearchParams,
  games,
} from "@/lib/games";

type ServiceType =
  | "Rank Boost"
  | "Trophy Boost"
  | "Prestige Icon"
  | "Coaching"
  | "Custom Request";

type OrderMode = "Boost" | "Carry";

type Brawler = {
  id: number;
  name: string;
  power: number;
  rank: number;
  trophies: number;
  highestTrophies: number;
  prestigeLevel?: number;
  currentWinStreak?: number;
  maxWinStreak?: number;
  skin?: {
    id: number;
    name: string;
  };
  gadgets?: {
    id: number;
    name: string;
  }[];
  gears?: {
    id: number;
    name: string;
    level: number;
  }[];
  starPowers?: {
    id: number;
    name: string;
  }[];
  hyperCharges?: {
    id: number;
    name: string;
  }[];
};

type VerifiedPlayer = {
  tag: string;
  name: string;
  trophies: number;
  highestTrophies: number;
  expLevel: number;
  club: string | null;
  iconId: number | null;
  brawlers: Brawler[];
};

const serviceTabs: ServiceType[] = [
  "Rank Boost",
  "Trophy Boost",
  "Prestige Icon",
  "Coaching",
  "Custom Request",
];

const prestigeOptions = ["Prestige 1", "Prestige 2", "Prestige 3"];
const coachingDurations = ["15 mins", "30 mins", "1 hour"];

const rankIcons: Record<string, string> = {
  "Bronze I": "🥉",
  "Bronze II": "🥉",
  "Bronze III": "🥉",
  "Silver I": "⚪",
  "Silver II": "⚪",
  "Silver III": "⚪",
  "Gold I": "🟡",
  "Gold II": "🟡",
  "Gold III": "🟡",
  Diamond: "💎",
  "Diamond I": "💎",
  "Diamond II": "💎",
  "Diamond III": "💎",
  "Mythic I": "🔮",
  "Mythic II": "🔮",
  "Mythic III": "🔮",
  "Legendary I": "👑",
  "Legendary II": "👑",
  "Legendary III": "👑",
  "Masters I": "🏆",
  "Masters II": "🏆",
  "Masters III": "🏆",
  Pro: "🏆",
  Radiant: "🌟",
  "Ultimate Champion": "👑",
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-SG").format(value);
}

function getHigherRanks(ranks: string[], currentRank: string) {
  const currentIndex = ranks.indexOf(currentRank);

  if (currentIndex === -1) return ranks;

  const higherRanks = ranks.slice(currentIndex + 1);

  if (higherRanks.length === 0) return [currentRank];

  return higherRanks;
}

function normalizeTag(tag: string, selectedGame: GameKey) {
  const clean = tag.trim();

  if (!clean) return "";

  if (selectedGame === "valorant") {
    return clean;
  }

  const upper = clean.toUpperCase();

  return upper.startsWith("#") ? upper : `#${upper}`;
}

function supportsBrawlApi(selectedGame: GameKey) {
  return selectedGame === "brawl_stars";
}

function ServicesPageContent() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const searchParams = useSearchParams();

  const selectedGame = getGameFromSearchParams(searchParams);
  const gameConfig = games[selectedGame];

  const requireVerifiedTag =
    process.env.NODE_ENV === "development" && selectedGame === "brawl_stars";

  const [isAdmin, setIsAdmin] = useState(false);

  const [serviceType, setServiceType] = useState<ServiceType>("Rank Boost");
  const [orderMode, setOrderMode] = useState<OrderMode>("Boost");

  const [currentRank, setCurrentRank] = useState(gameConfig.ranks[0]);
  const [targetRank, setTargetRank] = useState(
    gameConfig.ranks[1] ?? gameConfig.ranks[0]
  );

  const [currentTrophies, setCurrentTrophies] = useState("");
  const [targetTrophies, setTargetTrophies] = useState("");
  const [totalTrophies, setTotalTrophies] = useState("");

  const [brawler, setBrawler] = useState("");
  const [brawlerTrophies, setBrawlerTrophies] = useState("");
  const [prestigeTarget, setPrestigeTarget] = useState("Prestige 1");

  const [coachingFocus, setCoachingFocus] = useState("");
  const [coachingDuration, setCoachingDuration] = useState("30 mins");

  const [tag, setTag] = useState("");
  const [verifiedPlayer, setVerifiedPlayer] = useState<VerifiedPlayer | null>(
    null
  );
  const [verifyingTag, setVerifyingTag] = useState(false);
  const [verificationWarning, setVerificationWarning] = useState("");

  const [notes, setNotes] = useState("");
  const [express, setExpress] = useState(false);
  const [loading, setLoading] = useState(false);

  const availableTargetRanks = getHigherRanks(gameConfig.ranks, currentRank);

  useEffect(() => {
    const firstRank = gameConfig.ranks[0];
    const secondRank = gameConfig.ranks[1] ?? firstRank;

    setCurrentRank(firstRank);
    setTargetRank(secondRank);
    setTag("");
    setVerifiedPlayer(null);
    setVerificationWarning("");
  }, [selectedGame, gameConfig.ranks]);

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setIsAdmin(profile?.role === "admin");
    }

    checkAdmin();
  }, [supabase]);

  function updateTag(value: string) {
    setTag(value);
    setVerifiedPlayer(null);
    setVerificationWarning("");
  }

  function changeCurrentRank(nextRank: string) {
    setCurrentRank(nextRank);

    const higherRanks = getHigherRanks(gameConfig.ranks, nextRank);
    const currentTargetIndex = gameConfig.ranks.indexOf(targetRank);
    const nextRankIndex = gameConfig.ranks.indexOf(nextRank);

    if (currentTargetIndex <= nextRankIndex) {
      setTargetRank(higherRanks[0] ?? nextRank);
    }
  }

  function resetFieldsForTab(tab: ServiceType) {
    setServiceType(tab);
    setOrderMode("Boost");
    setExpress(false);
    setNotes("");
    setTag("");
    setVerifiedPlayer(null);
    setVerificationWarning("");

    if (tab === "Rank Boost") {
      setCurrentRank(gameConfig.ranks[0]);
      setTargetRank(gameConfig.ranks[1] ?? gameConfig.ranks[0]);
    }

    if (tab === "Trophy Boost") {
      setCurrentTrophies("");
      setTargetTrophies("");
      setTotalTrophies("");
      setBrawler("");
    }

    if (tab === "Prestige Icon") {
      setPrestigeTarget("Prestige 1");
      setBrawler("");
      setBrawlerTrophies("");
    }

    if (tab === "Coaching") {
      setCoachingFocus("");
      setCoachingDuration("30 mins");
    }

    if (tab === "Custom Request") {
      setNotes("");
    }
  }

  function getCurrentValue() {
    if (serviceType === "Rank Boost") return currentRank;
    if (serviceType === "Trophy Boost") return currentTrophies || "N/A";
    if (serviceType === "Prestige Icon") return brawler || "N/A";
    if (serviceType === "Coaching") return coachingFocus || "Coaching Review";
    return "Custom";
  }

  function getTargetValue() {
    if (serviceType === "Rank Boost") return targetRank;
    if (serviceType === "Trophy Boost") return targetTrophies || "N/A";
    if (serviceType === "Prestige Icon") return prestigeTarget;
    if (serviceType === "Coaching") return coachingDuration;
    return "Admin Review";
  }

  function buildRequestNotes() {
    const normalizedTag = normalizeTag(tag, selectedGame);

    const lines = [
      notes,
      "",
      "Order Details:",
      `Game: ${gameConfig.label}`,
      `Service: ${serviceType}`,
      `Type: ${orderMode}`,
      `Express: ${express ? "Yes" : "No"}`,
      `${gameConfig.tagLabel}: ${normalizedTag || "Not provided"}`,
      `Verification Status: ${
        verifiedPlayer
          ? "Verified"
          : supportsBrawlApi(selectedGame)
          ? "Unverified"
          : "Manual review"
      }`,
    ];

    if (verificationWarning && !verifiedPlayer) {
      lines.push(`Verification Warning: ${verificationWarning}`);
    }

    if (verifiedPlayer) {
      lines.push("");
      lines.push("Verified Brawl Stars Account:");
      lines.push(`Player Name: ${verifiedPlayer.name}`);
      lines.push(`Verified Tag: ${verifiedPlayer.tag}`);
      lines.push(`Trophies: ${verifiedPlayer.trophies}`);
      lines.push(`Highest Trophies: ${verifiedPlayer.highestTrophies}`);
      lines.push(`EXP Level: ${verifiedPlayer.expLevel}`);
      lines.push(`Club: ${verifiedPlayer.club || "No club"}`);
      lines.push(`Icon ID: ${verifiedPlayer.iconId ?? "N/A"}`);
      lines.push(`Total Brawlers: ${verifiedPlayer.brawlers?.length ?? 0}`);
    }

    if (serviceType === "Rank Boost") {
      lines.push("");
      lines.push(`Current Rank: ${currentRank}`);
      lines.push(`Target Rank: ${targetRank}`);
    }

    if (serviceType === "Trophy Boost") {
      lines.push("");
      lines.push(`Current Trophies: ${currentTrophies}`);
      lines.push(`Target Trophies: ${targetTrophies}`);
      lines.push(`Total Trophies: ${totalTrophies}`);
      lines.push(`Character / Brawler / Item: ${brawler}`);
    }

    if (serviceType === "Prestige Icon") {
      lines.push("");
      lines.push(`Prestige Target: ${prestigeTarget}`);
      lines.push(`Character / Brawler: ${brawler}`);
      lines.push(`Character / Brawler Trophies: ${brawlerTrophies}`);
    }

    if (serviceType === "Coaching") {
      lines.push("");
      lines.push(`Areas to Work On: ${coachingFocus}`);
      lines.push(`Duration: ${coachingDuration}`);
    }

    return lines.join("\n");
  }

  function validateRequest() {
    if (isAdmin) {
      alert(
        "Admins cannot submit customer requests. Use the admin panel to assign, edit, or delete orders."
      );
      return false;
    }

    const cleanTag = normalizeTag(tag, selectedGame);

    if (!cleanTag) {
      alert(`${gameConfig.tagLabel} is required.`);
      return false;
    }

    if (selectedGame !== "valorant" && !cleanTag.startsWith("#")) {
      alert(`${gameConfig.tagLabel} must start with #.`);
      return false;
    }

    if (requireVerifiedTag && !verifiedPlayer) {
      alert("Please verify your Brawl Stars player tag before submitting.");
      return false;
    }

    if (
      verifiedPlayer &&
      normalizeTag(verifiedPlayer.tag, selectedGame) !== cleanTag
    ) {
      alert("Your tag changed after verification. Please verify it again.");
      return false;
    }

    if (serviceType === "Rank Boost") {
      if (!currentRank || !targetRank) {
        alert("Current rank and target rank are required.");
        return false;
      }

      const currentIndex = gameConfig.ranks.indexOf(currentRank);
      const targetIndex = gameConfig.ranks.indexOf(targetRank);

      if (targetIndex <= currentIndex) {
        alert("Target rank must be above your current rank.");
        return false;
      }
    }

    if (serviceType === "Trophy Boost") {
      if (
        !currentTrophies.trim() ||
        !targetTrophies.trim() ||
        !totalTrophies.trim() ||
        !brawler.trim()
      ) {
        alert(
          "Current value, target value, total value, and character/item field are required."
        );
        return false;
      }
    }

    if (serviceType === "Prestige Icon") {
      if (!prestigeTarget || !brawler.trim() || !brawlerTrophies.trim()) {
        alert(
          "Prestige, character/brawler, and trophy/value field are required."
        );
        return false;
      }
    }

    if (serviceType === "Coaching") {
      if (!coachingFocus.trim() || !coachingDuration) {
        alert("Areas to work on and coaching duration are required.");
        return false;
      }
    }

    if (serviceType === "Custom Request") {
      if (!notes.trim()) {
        alert("Custom request details are required.");
        return false;
      }
    }

    return true;
  }

  async function verifyPlayerTag() {
    const cleanTag = normalizeTag(tag, selectedGame);

    if (!cleanTag) {
      alert(`Enter your ${gameConfig.tagLabel} first.`);
      return;
    }

    if (!supportsBrawlApi(selectedGame)) {
      setVerificationWarning(
        `${gameConfig.label} does not have API verification connected yet. Admin will review this manually.`
      );
      return;
    }

    setVerifyingTag(true);
    setVerifiedPlayer(null);
    setVerificationWarning("");

    try {
      const response = await fetch(
        `/api/brawl-player?tag=${encodeURIComponent(cleanTag)}`
      );

      const data = await response.json();

      if (!response.ok) {
        const message =
          data.error ||
          "Unable to verify player tag. You may still submit the tag for manual admin review.";

        setVerificationWarning(message);

        if (requireVerifiedTag) {
          alert(message);
        }

        return;
      }

      setVerifiedPlayer({
        tag: data.tag,
        name: data.name,
        trophies: Number(data.trophies ?? 0),
        highestTrophies: Number(data.highestTrophies ?? 0),
        expLevel: Number(data.expLevel ?? 0),
        club: data.club ?? null,
        iconId: data.iconId ?? null,
        brawlers: data.brawlers ?? [],
      });

      setTag(data.tag || cleanTag);
      setVerificationWarning("");
    } catch (error) {
      console.error(error);

      const message =
        "Verification server is unavailable. You may still submit the tag for manual admin review.";

      setVerificationWarning(message);

      if (requireVerifiedTag) {
        alert(message);
      }
    } finally {
      setVerifyingTag(false);
    }
  }

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();

    if (!validateRequest()) return;

    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role === "admin") {
      setLoading(false);
      alert("Admins cannot submit customer requests. Use the admin panel instead.");
      router.push("/admin");
      return;
    }

    const { error } = await supabase.from("order_requests").insert({
      user_id: user.id,
      game: selectedGame,
      service_type: `${gameConfig.label} ${serviceType}`,
      current_rank: getCurrentValue(),
      target_rank: getTargetValue(),
      notes: buildRequestNotes(),
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
          <Link
            href={gameHref("/", selectedGame)}
            className="text-2xl font-bold text-yellow-400"
          >
            Booster Lounge
          </Link>

          <div className="hidden items-center gap-6 text-sm text-zinc-300 md:flex">
            <GameSwitcher />

            <Link
              href={gameHref("/services", selectedGame)}
              className="text-yellow-300"
            >
              Services
            </Link>

            <Link
              href={gameHref("/accounts", selectedGame)}
              className="hover:text-white"
            >
              Accounts
            </Link>

            {gameConfig.categories.includes("pins") && (
              <Link
                href={gameHref("/pins", selectedGame)}
                className="hover:text-white"
              >
                Pins
              </Link>
            )}

            <Link
              href={gameHref("/offers", selectedGame)}
              className="hover:text-white"
            >
              Offers
            </Link>

            <Link
              href={gameHref("/market", selectedGame)}
              className="hover:text-white"
            >
              Market
            </Link>

            <Link href="/dashboard" className="hover:text-white">
              Dashboard
            </Link>

            {isAdmin && (
              <Link href="/admin" className="text-yellow-300 hover:text-white">
                Admin
              </Link>
            )}
          </div>

          <Link
            href={isAdmin ? "/admin" : "/dashboard"}
            className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
          >
            {isAdmin ? "Admin Panel" : "My Dashboard"}
          </Link>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(250,204,21,0.16),_transparent_35%),radial-gradient(circle_at_left,_rgba(59,130,246,0.10),_transparent_30%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-yellow-300">
                {gameConfig.label} Services
              </p>

              <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
                Build your request for {gameConfig.label}.
              </h1>

              <p className="mt-5 max-w-2xl text-zinc-400">
                Choose your service, boost type, target details, and{" "}
                {gameConfig.tagLabel.toLowerCase()}. Your request will be
                reviewed before becoming an active order.
              </p>

              {supportsBrawlApi(selectedGame) && !requireVerifiedTag && (
                <div className="mt-5 rounded-2xl border border-blue-400/30 bg-blue-400/10 p-4 text-sm text-blue-200">
                  Production mode: Brawl Stars tag verification is optional. If
                  verification fails because of API IP restrictions, your request
                  can still be submitted for manual admin review.
                </div>
              )}

              {!supportsBrawlApi(selectedGame) && (
                <div className="mt-5 rounded-2xl border border-blue-400/30 bg-blue-400/10 p-4 text-sm text-blue-200">
                  {gameConfig.label} API verification is not connected yet.
                  Admin will review your account ID manually.
                </div>
              )}

              {isAdmin && (
                <div className="mt-5 rounded-2xl border border-yellow-400/40 bg-yellow-400/10 p-4 text-sm text-yellow-200">
                  Admin mode: customer requests are disabled. Use the admin
                  panel to assign, edit, or delete orders.
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
              <p className="text-sm text-zinc-400">Selected Game</p>
              <p className="mt-2 text-3xl font-bold text-yellow-400">
                {gameConfig.label}
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Dashboard-managed orders
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            {serviceTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => resetFieldsForTab(tab)}
                className={`rounded-full border px-5 py-2 text-sm font-semibold ${
                  serviceType === tab
                    ? "border-yellow-400 bg-white text-black"
                    : "border-zinc-700 bg-zinc-950 text-zinc-300 hover:bg-zinc-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <form
            onSubmit={submitRequest}
            className="mt-8 grid gap-8 lg:grid-cols-[1fr_430px]"
          >
            <div className="grid gap-6">
              <ServiceForm
                gameLabel={gameConfig.label}
                ranks={gameConfig.ranks}
                serviceType={serviceType}
                currentRank={currentRank}
                setCurrentRank={changeCurrentRank}
                targetRank={targetRank}
                setTargetRank={setTargetRank}
                availableTargetRanks={availableTargetRanks}
                currentTrophies={currentTrophies}
                setCurrentTrophies={setCurrentTrophies}
                targetTrophies={targetTrophies}
                setTargetTrophies={setTargetTrophies}
                totalTrophies={totalTrophies}
                setTotalTrophies={setTotalTrophies}
                brawler={brawler}
                setBrawler={setBrawler}
                brawlerTrophies={brawlerTrophies}
                setBrawlerTrophies={setBrawlerTrophies}
                prestigeTarget={prestigeTarget}
                setPrestigeTarget={setPrestigeTarget}
                coachingFocus={coachingFocus}
                setCoachingFocus={setCoachingFocus}
                coachingDuration={coachingDuration}
                setCoachingDuration={setCoachingDuration}
              />

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <h2 className="text-xl font-bold">Request Notes</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Add useful details. Do not include passwords, 2FA codes, email
                  access, or recovery information.
                </p>

                <textarea
                  className="mt-4 min-h-36 w-full rounded-xl bg-zinc-800 p-4 outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Example: preferred timing, special instructions, account details, or questions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {verifiedPlayer && <PlayerPreviewCard player={verifiedPlayer} />}

              <TrustPanel />
            </div>

            <aside className="h-fit rounded-3xl border border-yellow-400/70 bg-zinc-950 p-6 shadow-2xl shadow-yellow-400/10">
              <div className="rounded-2xl bg-gradient-to-br from-blue-400 to-yellow-200 p-5 text-black">
                <p className="text-sm font-bold">CUSTOMIZE REQUEST</p>
                <h2 className="mt-2 text-2xl font-black">{serviceType}</h2>
              </div>

              <div className="mt-5 rounded-2xl border border-zinc-800 bg-[#09090d] p-4">
                <div className="grid grid-cols-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-1">
                  <button
                    type="button"
                    onClick={() => setOrderMode("Boost")}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                      orderMode === "Boost"
                        ? "bg-yellow-400 text-black"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Boost
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrderMode("Carry")}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                      orderMode === "Carry"
                        ? "bg-yellow-400 text-black"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Carry
                  </button>
                </div>

                <div className="mt-6 space-y-5">
                  <ToggleRow
                    label="Express"
                    enabled={express}
                    setEnabled={setExpress}
                  />

                  {serviceType === "Rank Boost" && (
                    <SelectField
                      label="Rank Boost Selection"
                      value={targetRank}
                      onChange={setTargetRank}
                      options={availableTargetRanks}
                    />
                  )}

                  {serviceType === "Trophy Boost" && (
                    <>
                      <TextField
                        label="Total Value / Trophies"
                        value={totalTrophies}
                        onChange={setTotalTrophies}
                        placeholder="e.g. 45000"
                      />

                      <TextField
                        label="Character / Brawler / Item"
                        value={brawler}
                        onChange={setBrawler}
                        placeholder="e.g. Shelly, Arena deck, agent"
                      />
                    </>
                  )}

                  {serviceType === "Prestige Icon" && (
                    <>
                      <SelectField
                        label="Prestige"
                        value={prestigeTarget}
                        onChange={setPrestigeTarget}
                        options={prestigeOptions}
                      />

                      <TextField
                        label="Character / Brawler"
                        value={brawler}
                        onChange={setBrawler}
                        placeholder="e.g. Edgar"
                      />

                      <TextField
                        label="Character / Brawler Trophies"
                        value={brawlerTrophies}
                        onChange={setBrawlerTrophies}
                        placeholder="e.g. 850"
                      />
                    </>
                  )}

                  {serviceType === "Coaching" && (
                    <>
                      <TextField
                        label="Areas to Work On"
                        value={coachingFocus}
                        onChange={setCoachingFocus}
                        placeholder="e.g. positioning, drafting, aim, map control"
                      />

                      <SelectField
                        label="Duration"
                        value={coachingDuration}
                        onChange={setCoachingDuration}
                        options={coachingDurations}
                      />
                    </>
                  )}

                  <div className="grid gap-2">
                    <span className="text-sm font-semibold text-zinc-200">
                      {gameConfig.tagLabel}
                    </span>

                    <input
                      className="rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                      value={tag}
                      onChange={(e) => updateTag(e.target.value)}
                      placeholder={gameConfig.tagPlaceholder}
                    />

                    <button
                      type="button"
                      onClick={verifyPlayerTag}
                      disabled={verifyingTag}
                      className="rounded-xl border border-yellow-400/50 px-4 py-3 text-sm font-bold text-yellow-300 hover:bg-yellow-400/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {verifyingTag
                        ? "Verifying..."
                        : supportsBrawlApi(selectedGame)
                        ? "Verify Player Tag"
                        : "Manual Review Only"}
                    </button>
                  </div>

                  {verifiedPlayer && (
                    <div className="rounded-2xl border border-green-400/30 bg-green-400/10 p-4 text-sm text-green-300">
                      <p className="font-bold">Verified Account</p>
                      <p className="mt-1">{verifiedPlayer.name}</p>
                      <p className="text-xs text-green-200">
                        {verifiedPlayer.tag}
                      </p>
                    </div>
                  )}

                  {verificationWarning && !verifiedPlayer && (
                    <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-sm text-yellow-200">
                      <p className="font-bold">Verification note</p>
                      <p className="mt-1">{verificationWarning}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Request Summary</p>

                <div className="mt-4 space-y-3 text-sm">
                  <SummaryRow label="Game" value={gameConfig.label} />
                  <SummaryRow label="Service" value={serviceType} />
                  <SummaryRow label="Type" value={orderMode} />
                  <SummaryRow label="Current" value={getCurrentValue()} />
                  <SummaryRow label="Target" value={getTargetValue()} />
                  <SummaryRow label="Express" value={express ? "Yes" : "No"} />
                  <SummaryRow
                    label={gameConfig.tagLabel}
                    value={normalizeTag(tag, selectedGame) || "-"}
                  />
                  <SummaryRow
                    label="Verified"
                    value={
                      verifiedPlayer
                        ? "Yes"
                        : supportsBrawlApi(selectedGame)
                        ? "No"
                        : "Manual"
                    }
                  />
                </div>

                <div className="mt-5 rounded-xl bg-yellow-400/10 p-4 text-sm text-yellow-200">
                  Admin will review your request and provide confirmation.
                </div>
              </div>

              <button
                disabled={loading || isAdmin}
                className="mt-5 w-full rounded-xl bg-yellow-400 p-4 font-bold text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isAdmin
                  ? "Admin Cannot Submit Requests"
                  : loading
                  ? "Submitting..."
                  : "Submit request"}
              </button>

              <p className="mt-4 text-center text-xs text-zinc-500">
                Do not share passwords, email access, 2FA codes, or recovery
                information.
              </p>
            </aside>
          </form>
        </div>
      </section>
    </main>
  );
}

type ServiceFormProps = {
  gameLabel: string;
  ranks: string[];
  serviceType: ServiceType;
  currentRank: string;
  setCurrentRank: (value: string) => void;
  targetRank: string;
  setTargetRank: (value: string) => void;
  availableTargetRanks: string[];
  currentTrophies: string;
  setCurrentTrophies: (value: string) => void;
  targetTrophies: string;
  setTargetTrophies: (value: string) => void;
  totalTrophies: string;
  setTotalTrophies: (value: string) => void;
  brawler: string;
  setBrawler: (value: string) => void;
  brawlerTrophies: string;
  setBrawlerTrophies: (value: string) => void;
  prestigeTarget: string;
  setPrestigeTarget: (value: string) => void;
  coachingFocus: string;
  setCoachingFocus: (value: string) => void;
  coachingDuration: string;
  setCoachingDuration: (value: string) => void;
};

function ServiceForm(props: ServiceFormProps) {
  if (props.serviceType === "Rank Boost") {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <RankCard
          title="Current Rank"
          value={props.currentRank}
          options={props.ranks}
          onChange={props.setCurrentRank}
        />

        <RankCard
          title="Desired Rank"
          value={props.targetRank}
          options={props.availableTargetRanks}
          onChange={props.setTargetRank}
        />
      </div>
    );
  }

  if (props.serviceType === "Trophy Boost") {
    return (
      <FormPanel title="Trophy / Value Boost">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Current value"
            value={props.currentTrophies}
            onChange={props.setCurrentTrophies}
            placeholder="e.g. 0"
          />

          <TextInput
            label="Desired value"
            value={props.targetTrophies}
            onChange={props.setTargetTrophies}
            placeholder="e.g. 100"
          />

          <TextInput
            label="Total value"
            value={props.totalTrophies}
            onChange={props.setTotalTrophies}
            placeholder="e.g. 45000"
          />

          <TextInput
            label="Character / Brawler / Item"
            value={props.brawler}
            onChange={props.setBrawler}
            placeholder="e.g. Colt, deck, agent"
          />
        </div>
      </FormPanel>
    );
  }

  if (props.serviceType === "Prestige Icon") {
    return (
      <FormPanel title="Prestige Icon">
        <div className="grid gap-4 md:grid-cols-3">
          <SelectInput
            label="Prestige"
            value={props.prestigeTarget}
            onChange={props.setPrestigeTarget}
            options={prestigeOptions}
          />

          <TextInput
            label="Character / Brawler"
            value={props.brawler}
            onChange={props.setBrawler}
            placeholder="e.g. Edgar"
          />

          <TextInput
            label="Character / Brawler trophies"
            value={props.brawlerTrophies}
            onChange={props.setBrawlerTrophies}
            placeholder="e.g. 850"
          />
        </div>
      </FormPanel>
    );
  }

  if (props.serviceType === "Coaching") {
    return (
      <FormPanel title={`${props.gameLabel} Coaching`}>
        <p className="mb-5 max-w-3xl text-zinc-300">
          Request gameplay feedback, strategy review, drafting advice, or
          improvement planning.
        </p>

        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Areas to work on"
            value={props.coachingFocus}
            onChange={props.setCoachingFocus}
            placeholder="e.g. positioning, aiming, drafting, map control"
          />

          <SelectInput
            label="Session duration"
            value={props.coachingDuration}
            onChange={props.setCoachingDuration}
            options={coachingDurations}
          />
        </div>
      </FormPanel>
    );
  }

  return (
    <FormPanel title="Custom Request">
      <p className="max-w-3xl text-zinc-300">
        Have something that does not match the standard categories? Add your
        request details in the notes section and admin will review it.
      </p>
    </FormPanel>
  );
}

function RankCard({
  title,
  value,
  options,
  onChange,
}: {
  title: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
      <div className="mb-6 flex items-center gap-4">
        <RankIcon rank={value} />

        <div>
          <p className="text-sm text-zinc-400">{title}</p>
          <h2 className="text-2xl font-bold">{value}</h2>
        </div>
      </div>

      <label className="text-sm font-semibold text-zinc-300">{title}</label>

      <select
        className="mt-2 w-full rounded-xl bg-zinc-800 p-4 outline-none focus:ring-2 focus:ring-yellow-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function RankIcon({ rank }: { rank: string }) {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-yellow-400/30 bg-zinc-900 text-3xl shadow-lg shadow-yellow-400/10">
      {rankIcons[rank] || "🏆"}
    </div>
  );
}

function PlayerPreviewCard({ player }: { player: VerifiedPlayer }) {
  const brawlers = player.brawlers ?? [];

  const totalBrawlers = brawlers.length;
  const power11Count = brawlers.filter((brawler) => brawler.power >= 11).length;

  const gadgetCount = brawlers.reduce(
    (total, brawler) => total + (brawler.gadgets?.length ?? 0),
    0
  );

  const starPowerCount = brawlers.reduce(
    (total, brawler) => total + (brawler.starPowers?.length ?? 0),
    0
  );

  const gearCount = brawlers.reduce(
    (total, brawler) => total + (brawler.gears?.length ?? 0),
    0
  );

  const hyperChargeCount = brawlers.reduce(
    (total, brawler) => total + (brawler.hyperCharges?.length ?? 0),
    0
  );

  const prestigeCount = brawlers.filter(
    (brawler) => Number(brawler.prestigeLevel ?? 0) > 0
  ).length;

  const topBrawlers = [...brawlers]
    .sort((a, b) => b.trophies - a.trophies)
    .slice(0, 8);

  const maxedPercent =
    totalBrawlers > 0 ? Math.round((power11Count / totalBrawlers) * 100) : 0;

  return (
    <div className="overflow-hidden rounded-3xl border border-green-400/30 bg-zinc-950 shadow-2xl shadow-green-400/10">
      <div className="bg-gradient-to-br from-green-300 via-yellow-200 to-blue-300 p-6 text-black">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-wide">
              Verified Brawl Stars Account
            </p>

            <h2 className="mt-2 text-4xl font-black">{player.name}</h2>

            <p className="mt-1 font-bold">{player.tag}</p>
          </div>

          <div className="rounded-2xl bg-black/10 px-5 py-3 text-right">
            <p className="text-sm font-bold">Trophies</p>
            <p className="text-3xl font-black">
              {formatNumber(player.trophies)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-5 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <StatBox
            label="Highest Trophies"
            value={formatNumber(player.highestTrophies)}
          />

          <StatBox label="EXP Level" value={player.expLevel} />

          <StatBox label="Club" value={player.club || "No club"} />

          <StatBox label="Icon ID" value={player.iconId ?? "N/A"} />
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h3 className="text-xl font-bold">Account Summary</h3>
              <p className="mt-1 text-sm text-zinc-400">
                Quick check of account strength before submitting request.
              </p>
            </div>

            <div className="rounded-full bg-yellow-400 px-4 py-2 text-sm font-black text-black">
              {maxedPercent}% Power 11
            </div>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <SummaryBox label="Total Brawlers" value={totalBrawlers} />
            <SummaryBox label="Power 11 Brawlers" value={power11Count} />
            <SummaryBox label="Prestige Brawlers" value={prestigeCount} />
            <SummaryBox label="Hypercharges" value={hyperChargeCount} />
            <SummaryBox label="Gadgets" value={gadgetCount} />
            <SummaryBox label="Star Powers" value={starPowerCount} />
            <SummaryBox label="Gears" value={gearCount} />
          </div>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h3 className="text-xl font-bold">Top Brawlers</h3>
              <p className="mt-1 text-sm text-zinc-400">
                Highest current trophy brawlers from this account.
              </p>
            </div>

            <p className="text-sm text-zinc-500">
              Showing top {topBrawlers.length}
            </p>
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {topBrawlers.map((brawler) => (
              <BrawlerRow key={brawler.id} brawler={brawler} />
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-sm text-yellow-200">
          Confirm this is the correct account before submitting. Never provide
          Supercell ID passwords, email passwords, recovery codes, or 2FA codes.
        </div>
      </div>
    </div>
  );
}

function BrawlerRow({ brawler }: { brawler: Brawler }) {
  const hasHypercharge = (brawler.hyperCharges?.length ?? 0) > 0;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="flex justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold">{brawler.name}</p>

            <span className="rounded-full bg-purple-500/20 px-2 py-1 text-xs font-bold text-purple-300">
              P{brawler.power}
            </span>

            {hasHypercharge && (
              <span className="rounded-full bg-yellow-400 px-2 py-1 text-xs font-bold text-black">
                Hyper
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-zinc-400">
            {brawler.skin?.name || "Default skin"}
          </p>
        </div>

        <div className="text-right">
          <p className="text-lg font-black text-yellow-300">
            {formatNumber(brawler.trophies)}
          </p>
          <p className="text-xs text-zinc-500">
            Best {formatNumber(brawler.highestTrophies)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
        <MiniStat label="Gadgets" value={brawler.gadgets?.length ?? 0} />
        <MiniStat label="SP" value={brawler.starPowers?.length ?? 0} />
        <MiniStat label="Gears" value={brawler.gears?.length ?? 0} />
      </div>
    </div>
  );
}

function FormPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
      <h2 className="text-3xl font-bold">{title}</h2>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-300">{label}</span>
      <input
        className="mt-2 w-full rounded-xl bg-zinc-800 p-4 outline-none focus:ring-2 focus:ring-yellow-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-300">{label}</span>
      <select
        className="mt-2 w-full rounded-xl bg-zinc-800 p-4 outline-none focus:ring-2 focus:ring-yellow-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

function ToggleRow({
  label,
  enabled,
  setEnabled,
}: {
  label: string;
  enabled: boolean;
  setEnabled: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-semibold text-zinc-200">{label}</span>

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

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-semibold text-zinc-200">{label}</span>
      <input
        className="rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-semibold text-zinc-200">{label}</span>
      <select
        className="rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right font-semibold text-zinc-200">{value}</span>
    </div>
  );
}

function StatBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-2 truncate text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function SummaryBox({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-yellow-400">{value}</p>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl bg-zinc-900 p-2 text-center">
      <p className="text-zinc-500">{label}</p>
      <p className="font-bold text-zinc-200">{value}</p>
    </div>
  );
}

function TrustPanel() {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
      <h2 className="text-xl font-bold">Why trust Booster Lounge?</h2>
      <p className="mt-3 text-zinc-400">
        Your request is reviewed before becoming an active order. Users track
        everything through the dashboard, including status, credits, and admin
        chat.
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
          <p className="font-semibold">Manual review fallback</p>
          <p className="mt-1 text-sm text-zinc-500">
            If API verification is unavailable, admin can still review your
            request manually.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#08080b] p-8 text-white">
          Loading services...
        </main>
      }
    >
      <ServicesPageContent />
    </Suspense>
  );
}