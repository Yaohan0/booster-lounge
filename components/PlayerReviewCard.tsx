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

export type VerifiedPlayer = {
  tag: string;
  name: string;
  trophies: number;
  highestTrophies: number;
  expLevel: number;
  club: string | null;
  iconId: number | null;
  brawlers: Brawler[];
};

type PlayerPreviewCardProps = {
  player: VerifiedPlayer;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-SG").format(value);
}

export default function PlayerPreviewCard({ player }: PlayerPreviewCardProps) {
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

            <h2 className="mt-2 text-4xl font-black">
              {player.name}
            </h2>

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
                Quick check of the account strength before submitting request.
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