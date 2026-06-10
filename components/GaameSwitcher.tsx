"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { gameList, GameKey, isGameKey } from "@/lib/games";

export default function GameSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentGameParam = searchParams.get("game");
  const currentGame: GameKey = isGameKey(currentGameParam)
    ? currentGameParam
    : "brawl_stars";

  function changeGame(nextGame: GameKey) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("game", nextGame);

    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      value={currentGame}
      onChange={(e) => changeGame(e.target.value as GameKey)}
      className="rounded-xl border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-yellow-400"
    >
      {gameList.map((game) => (
        <option key={game.key} value={game.key}>
          {game.label}
        </option>
      ))}
    </select>
  );
}