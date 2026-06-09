import Link from "next/link";

const newsItems = [
  {
    title: "Brawl Stars News Archive",
    description:
      "Official Brawl Stars blog posts, release notes, balance updates, and event guides from Supercell.",
    href: "https://supercell.com/en/games/brawlstars/blog/",
    source: "Supercell",
  },
  {
    title: "Official Brawl Stars Page",
    description:
      "Latest official Brawl Stars updates and featured news from Supercell.",
    href: "https://supercell.com/en/games/brawlstars/",
    source: "Supercell",
  },
  {
    title: "Brawl Stars YouTube",
    description:
      "Brawl Talk videos, update previews, and official announcements.",
    href: "https://www.youtube.com/brawlstars",
    source: "YouTube",
  },
];

export default function NewsPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#27272a,_#09090b_55%)] px-6 py-8 text-white">
      <section className="mx-auto max-w-6xl">
        <nav className="mb-8 flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-4 backdrop-blur md:flex-row md:items-center md:justify-between">
          <Link href="/" className="text-lg font-bold text-yellow-400">
            Booster Lounge
          </Link>

          <div className="flex flex-wrap items-center gap-4 text-sm">
            <Link href="/" className="text-zinc-300 hover:text-white">
              Home
            </Link>
            <Link href="/services" className="text-zinc-300 hover:text-white">
              Services
            </Link>
            <Link href="/accounts" className="text-zinc-300 hover:text-white">
              Accounts
            </Link>
            <Link href="/pins" className="text-zinc-300 hover:text-white">
              Pins
            </Link>
            <Link href="/offers" className="text-zinc-300 hover:text-white">
              Offers
            </Link>
            <Link href="/market" className="text-zinc-300 hover:text-white">
              Market
            </Link>
            <Link href="/dashboard" className="text-zinc-300 hover:text-white">
              Dashboard
            </Link>
          </div>
        </nav>

        <header>
          <p className="text-sm font-bold text-yellow-300">
            Brawl Stars Updates
          </p>
          <h1 className="mt-3 text-5xl font-bold tracking-tight">News</h1>
          <p className="mt-4 max-w-2xl text-zinc-400">
            Quick links to official Brawl Stars news, release notes, event
            guides, and update videos.
          </p>
        </header>

        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {newsItems.map((item) => (
            <a
              key={item.title}
              href={item.href}
              target="_blank"
              rel="noreferrer"
              className="rounded-3xl border border-zinc-800 bg-zinc-900/80 p-6 hover:border-yellow-400/50"
            >
              <p className="text-sm text-yellow-300">{item.source}</p>
              <h2 className="mt-3 text-xl font-bold">{item.title}</h2>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {item.description}
              </p>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}