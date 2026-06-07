import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-4 rounded-full border border-yellow-400/40 px-4 py-2 text-sm text-yellow-400">
          Booster Lounge
        </p>

        <h1 className="text-5xl font-bold tracking-tight md:text-7xl">
          Brawl Stars Coaching & Order Tracking
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-zinc-300">
          Create an account, submit coaching requests, and track your order
          status from your personal dashboard.
        </p>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/register"
            className="rounded-lg bg-yellow-400 px-6 py-3 font-semibold text-black"
          >
            Get Started
          </Link>

          <Link
            href="/login"
            className="rounded-lg border border-zinc-700 px-6 py-3 font-semibold hover:bg-zinc-900"
          >
            Login
          </Link>
        </div>

        <p className="mt-8 max-w-xl text-sm text-zinc-500">
          Do not share Supercell ID passwords, email passwords, 2FA codes, or
          recovery information.
        </p>
      </section>
    </main>
  );
}