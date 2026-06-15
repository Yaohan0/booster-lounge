"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

type GameRow = {
  id: string;
  slug: string;
  name: string;
  short_name: string | null;
  description: string | null;
  image_url?: string | null;
  badge?: string | null;
  is_active: boolean;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function GameSwitcher() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const [games, setGames] = useState<GameRow[]>([]);
  const [selectedGame, setSelectedGame] = useState<GameRow | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadGames();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function loadGames() {
    const { data, error } = await supabase
      .from("games")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) {
      console.error(error.message);
      return;
    }

    const loadedGames = (data ?? []) as GameRow[];
    setGames(loadedGames);

    const gameFromUrl = searchParams.get("game");
    const gameFromStorage =
      typeof window !== "undefined"
        ? window.localStorage.getItem("selected_game")
        : null;

    const selected =
      loadedGames.find((game) => game.slug === gameFromUrl) ||
      loadedGames.find((game) => game.slug === gameFromStorage) ||
      loadedGames[0] ||
      null;

    setSelectedGame(selected);

    if (selected && typeof window !== "undefined") {
      window.localStorage.setItem("selected_game", selected.slug);
    }
  }

  function selectGame(game: GameRow) {
    setSelectedGame(game);
    setOpen(false);

    if (typeof window !== "undefined") {
      window.localStorage.setItem("selected_game", game.slug);
      window.dispatchEvent(
        new CustomEvent("selected-game-changed", {
          detail: { slug: game.slug },
        })
      );
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("game", game.slug);

    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div ref={dropdownRef} className="relative z-50 w-[230px]">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className={`flex w-full items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-left transition ${
          open
            ? "border-yellow-400 bg-zinc-900 shadow-[0_0_0_3px_rgba(250,204,21,0.12)]"
            : "border-zinc-800 bg-zinc-950 hover:border-yellow-400/70"
        }`}
      >
        <div className="flex min-w-0 items-center gap-3">
          <GameIcon game={selectedGame} />

          <div className="min-w-0">
            <p className="truncate text-sm font-black text-white">
              {selectedGame?.name ?? "Select Game"}
            </p>
            <p className="truncate text-xs text-zinc-500">
              {selectedGame?.short_name || selectedGame?.slug || "Choose"}
            </p>
          </div>
        </div>

        <span
          className={`text-sm text-yellow-300 transition ${
            open ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-3 w-[360px] overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
          <div className="border-b border-zinc-800 bg-gradient-to-r from-yellow-400/10 to-transparent px-4 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-yellow-300">
              Choose Game
            </p>
            <p className="mt-1 text-sm text-zinc-400">
              Switch between available game services.
            </p>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-2">
            {games.map((game) => {
              const active = selectedGame?.slug === game.slug;

              return (
                <button
                  key={game.id}
                  type="button"
                  onClick={() => selectGame(game)}
                  className={`group flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
                    active
                      ? "bg-yellow-400 text-black"
                      : "text-white hover:bg-zinc-900"
                  }`}
                >
                  <GameIcon game={game} active={active} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p
                        className={`truncate text-sm font-black ${
                          active ? "text-black" : "text-white"
                        }`}
                      >
                        {game.name}
                      </p>

                      {game.badge && (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
                            active
                              ? "bg-black/15 text-black"
                              : "bg-yellow-400/15 text-yellow-300"
                          }`}
                        >
                          {game.badge}
                        </span>
                      )}
                    </div>

                    <p
                      className={`mt-1 line-clamp-1 text-xs ${
                        active ? "text-black/70" : "text-zinc-500"
                      }`}
                    >
                      {game.description || "Top-ups, accounts, pins, and items"}
                    </p>
                  </div>

                  <span
                    className={`text-lg transition ${
                      active
                        ? "text-black"
                        : "text-zinc-600 group-hover:text-yellow-300"
                    }`}
                  >
                    →
                  </span>
                </button>
              );
            })}

            {games.length === 0 && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-sm text-zinc-400">
                No active games found. Add or activate games in Admin Catalog.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GameIcon({
  game,
  active = false,
}: {
  game: GameRow | null;
  active?: boolean;
}) {
  if (game?.image_url) {
    return (
      <img
        src={game.image_url}
        alt={game.name}
        className={`h-11 w-11 shrink-0 rounded-xl object-cover ${
          active ? "ring-2 ring-black/20" : "ring-1 ring-zinc-800"
        }`}
      />
    );
  }

  return (
    <div
      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
        active
          ? "bg-black/15 text-black"
          : "bg-zinc-900 text-yellow-300 ring-1 ring-zinc-800"
      }`}
    >
      {game ? getInitials(game.name) : "?"}
    </div>
  );
}