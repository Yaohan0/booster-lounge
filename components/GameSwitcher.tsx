"use client";

import { useEffect, useState } from "react";
import { GameKey, gameList, isGameKey } from "@/lib/games";

export default function GameSwitcher() {
  const [currentGame, setCurrentGame] = useState<GameKey>("brawl_stars");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gameParam = params.get("game");

    if (isGameKey(gameParam)) {
      setCurrentGame(gameParam);
    }
  }, []);

  function changeGame(nextGame: GameKey) {
    const url = new URL(window.location.href);
    url.searchParams.set("game", nextGame);

    window.location.href = url.toString();
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