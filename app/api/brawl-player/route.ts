import { NextResponse } from "next/server";

type BrawlStarsPlayer = {
  tag: string;
  name: string;
  trophies: number;
  highestTrophies: number;
  expLevel: number;
  club?: {
    name?: string;
  };
  icon?: {
    id?: number;
  };
  brawlers?: unknown[];
};

function normalizeTag(tag: string) {
  const clean = tag.trim().toUpperCase();

  if (!clean) return "";

  if (!clean.startsWith("#")) {
    return `#${clean}`;
  }

  return clean;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawTag = searchParams.get("tag");

    if (!rawTag) {
      return NextResponse.json(
        { error: "Player tag is required." },
        { status: 400 }
      );
    }

    const token = process.env.BRAWL_STARS_API_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          error:
            "Brawl Stars API token is missing. Add BRAWL_STARS_API_TOKEN to .env.local.",
        },
        { status: 500 }
      );
    }

    const tag = normalizeTag(rawTag);

    if (!tag) {
      return NextResponse.json(
        { error: "Player tag is invalid." },
        { status: 400 }
      );
    }

    const encodedTag = encodeURIComponent(tag);

    const response = await fetch(
      `https://api.brawlstars.com/v1/players/${encodedTag}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        cache: "no-store",
      }
    );

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      let message = "Unable to verify player tag.";

      if (response.status === 404) {
        message = "Player tag not found.";
      }

      if (response.status === 403) {
        message =
          "Brawl Stars API access denied. Check your API token and allowed IP address.";
      }

      if (response.status === 429) {
        message = "Too many requests. Try again later.";
      }

      return NextResponse.json(
        {
          error: message,
          status: response.status,
          details: data?.message ?? null,
        },
        { status: response.status }
      );
    }

    const player = data as BrawlStarsPlayer;

    return NextResponse.json({
      tag: player.tag,
      name: player.name,
      trophies: player.trophies,
      highestTrophies: player.highestTrophies,
      expLevel: player.expLevel,
      club: player.club?.name ?? null,
      iconId: player.icon?.id ?? null,
      brawlers: player.brawlers ?? [],
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Server error while verifying player tag." },
      { status: 500 }
    );
  }
}