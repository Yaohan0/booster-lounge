export type GameKey =
  | "brawl_stars"
  | "clash_royale"
  | "fc_mobile"
  | "valorant";

export type GameConfig = {
  key: GameKey;
  label: string;
  shortLabel: string;
  categories: string[];
  ranks: string[];
  tagLabel: string;
  tagPlaceholder: string;
  description: string;
};

export const games: Record<GameKey, GameConfig> = {
  brawl_stars: {
    key: "brawl_stars",
    label: "Brawl Stars",
    shortLabel: "BS",
    categories: ["services", "accounts", "pins", "offers", "market"],
    ranks: [
      "Bronze I",
      "Bronze II",
      "Bronze III",
      "Silver I",
      "Silver II",
      "Silver III",
      "Diamond I",
      "Diamond II",
      "Diamond III",
      "Mythic I",
      "Mythic II",
      "Mythic III",
      "Legendary I",
      "Legendary II",
      "Legendary III",
      "Masters I",
      "Masters II",
      "Masters III",
      "Pro",
    ],
    tagLabel: "Player Tag",
    tagPlaceholder: "#ABC123",
    description: "Brawl Stars boosts, accounts, pins, offers, and market items.",
  },

  clash_royale: {
    key: "clash_royale",
    label: "Clash Royale",
    shortLabel: "CR",
    categories: ["services", "accounts", "offers", "market"],
    ranks: [
      "Arena 1",
      "Arena 2",
      "Arena 3",
      "Arena 4",
      "Arena 5",
      "Arena 6",
      "Arena 7",
      "Arena 8",
      "Arena 9",
      "Arena 10",
      "League 1",
      "League 2",
      "League 3",
      "Master I",
      "Master II",
      "Master III",
      "Champion",
      "Grand Champion",
      "Royal Champion",
      "Ultimate Champion",
    ],
    tagLabel: "Player Tag",
    tagPlaceholder: "#ABC123",
    description: "Clash Royale trophy, ladder, account, and offer services.",
  },

  fc_mobile: {
    key: "fc_mobile",
    label: "FC Mobile",
    shortLabel: "FC",
    categories: ["services", "accounts", "offers", "market"],
    ranks: [
      "Amateur III",
      "Amateur II",
      "Amateur I",
      "Pro III",
      "Pro II",
      "Pro I",
      "World Class III",
      "World Class II",
      "World Class I",
      "Legendary III",
      "Legendary II",
      "Legendary I",
      "FC Champion III",
      "FC Champion II",
      "FC Champion I",
    ],
    tagLabel: "User ID",
    tagPlaceholder: "Enter FC Mobile ID",
    description: "FC Mobile division, account, and market services.",
  },

  valorant: {
    key: "valorant",
    label: "Valorant",
    shortLabel: "VAL",
    categories: ["services", "accounts", "offers"],
    ranks: [
      "Iron 1",
      "Iron 2",
      "Iron 3",
      "Bronze 1",
      "Bronze 2",
      "Bronze 3",
      "Silver 1",
      "Silver 2",
      "Silver 3",
      "Gold 1",
      "Gold 2",
      "Gold 3",
      "Platinum 1",
      "Platinum 2",
      "Platinum 3",
      "Diamond 1",
      "Diamond 2",
      "Diamond 3",
      "Ascendant 1",
      "Ascendant 2",
      "Ascendant 3",
      "Immortal 1",
      "Immortal 2",
      "Immortal 3",
      "Radiant",
    ],
    tagLabel: "Riot ID",
    tagPlaceholder: "Name#0000",
    description: "Valorant rank, coaching, accounts, and offers.",
  },
};

export const gameList = Object.values(games);

export function isGameKey(value: string | null): value is GameKey {
  return (
    value === "brawl_stars" ||
    value === "clash_royale" ||
    value === "fc_mobile" ||
    value === "valorant"
  );
}

export function getGameFromSearchParams(searchParams: URLSearchParams) {
  const value = searchParams.get("game");

  if (isGameKey(value)) {
    return value;
  }

  return "brawl_stars";
}

export function gameHref(path: string, game: GameKey) {
  return `${path}?game=${game}`;
}