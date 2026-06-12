"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

type GameRow = {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  description: string | null;
  tag_label: string | null;
  tag_placeholder: string | null;
  image_url: string | null;
  badge: string | null;
  sort_order: number | null;
  is_active: boolean;
};

export default function GamesPage() {
  const supabase = useMemo(() => createClient(), []);

  const [games, setGames] = useState<GameRow[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadGames();
  }, []);

  async function loadGames() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setGames((data ?? []) as GameRow[]);
  }

  const filteredGames = games.filter((game) => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return true;

    return (
      game.name.toLowerCase().includes(keyword) ||
      game.slug.toLowerCase().includes(keyword) ||
      (game.description ?? "").toLowerCase().includes(keyword)
    );
  });

  return (
    <main className="min-h-screen bg-white text-black">
      <nav className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-black text-black">
            Booster Lounge
          </Link>

          <div className="hidden items-center gap-6 text-sm font-semibold text-zinc-700 md:flex">
            <Link href="/games" className="text-yellow-600">
              Games
            </Link>
            <Link href="/services" className="hover:text-black">
              Services
            </Link>
            <Link href="/accounts" className="hover:text-black">
              Accounts
            </Link>
            <Link href="/offers" className="hover:text-black">
              Offers
            </Link>
            <Link href="/market" className="hover:text-black">
              Market
            </Link>
            <Link href="/dashboard" className="hover:text-black">
              Dashboard
            </Link>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl bg-yellow-400 px-5 py-3 text-sm font-black text-black hover:bg-yellow-300"
          >
            My Dashboard
          </Link>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-yellow-600">
              Choose Game
            </p>

            <h1 className="mt-3 text-5xl font-black tracking-tight">
              Top Up & Services
            </h1>

            <p className="mt-3 max-w-2xl text-zinc-600">
              Select a game to browse accounts, offers, market items, and
              services.
            </p>
          </div>

          <div className="w-full md:w-80">
            <input
              className="w-full rounded-2xl border border-zinc-300 bg-white px-5 py-4 text-sm outline-none focus:border-yellow-400"
              placeholder="Search games..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {errorMessage && (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {errorMessage}
          </div>
        )}

        {loading ? (
          <div className="mt-10 text-zinc-500">Loading games...</div>
        ) : (
          <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}

            {filteredGames.length === 0 && (
              <div className="rounded-2xl border border-zinc-200 p-6 text-zinc-500">
                No games found.
              </div>
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function GameCard({ game }: { game: GameRow }) {
  const imageUrl =
    game.image_url ||
    "https://placehold.co/600x400/facc15/000000?text=Game";

  return (
    <Link
      href={`/accounts?game=${game.slug}`}
      className="group block rounded-3xl transition hover:-translate-y-1"
    >
      <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100 shadow-sm">
        <img
          src={imageUrl}
          alt={game.name}
          className="aspect-square w-full object-cover transition group-hover:scale-105"
        />

        {game.badge && (
          <span className="absolute left-4 top-4 rounded-full bg-sky-400 px-4 py-2 text-sm font-black text-white">
            {game.badge}
          </span>
        )}
      </div>

      <h2 className="mt-4 text-2xl font-black text-black">{game.name}</h2>

      {game.description && (
        <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
          {game.description}
        </p>
      )}
    </Link>
  );
}