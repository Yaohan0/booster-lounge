import Link from "next/link";
import AdminProductManager from "@/components/AdminProductManager";

export default function AdminProductsPage() {
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

            <Link href="/admin" className="text-zinc-300 hover:text-white">
              Orders Admin
            </Link>

            <Link
              href="/admin/products"
              className="text-yellow-300 hover:text-white"
            >
              Product Manager
            </Link>
          </div>
        </nav>

        <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">
              Product Manager
            </h1>

            <p className="mt-2 max-w-2xl text-zinc-400">
              Create and manage marketplace listings for accounts, pins, offers,
              finger sleeves, keychains, and other products.
            </p>
          </div>

          <Link
            href="/admin"
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-900"
          >
            Back to Orders Admin
          </Link>
        </header>

        <AdminProductManager />
      </section>
    </main>
  );
}