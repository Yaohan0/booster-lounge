import Link from "next/link";

type PageShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  rightAction?: React.ReactNode;
};

export default function PageShell({
  title,
  subtitle,
  children,
  rightAction,
}: PageShellProps) {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#27272a,_#09090b_55%)] px-6 py-8 text-white">
      <section className="mx-auto max-w-6xl">
        <nav className="mb-8 flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950/70 px-5 py-4 backdrop-blur">
          <Link href="/" className="text-lg font-bold text-yellow-400">
            Booster Lounge
          </Link>

          <div className="flex items-center gap-3 text-sm">
            <Link href="/dashboard" className="text-zinc-300 hover:text-white">
              Dashboard
            </Link>
            <Link href="/admin" className="text-zinc-300 hover:text-white">
              Admin
            </Link>
          </div>
        </nav>

        <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-zinc-400">{subtitle}</p>}
          </div>

          {rightAction}
        </header>

        {children}
      </section>
    </main>
  );
}