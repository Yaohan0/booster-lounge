import Link from "next/link";

const services = [
  {
    title: "Coaching Session",
    description:
      "Get gameplay advice, strategy tips, and improvement guidance based on your current level.",
  },
  {
    title: "Gameplay Review",
    description:
      "Submit details about your playstyle and receive structured feedback from the admin.",
  },
  {
    title: "Rank Progress Tracking",
    description:
      "Track assigned orders, order status, chat updates, and account credits from your dashboard.",
  },
];

const steps = [
  "Create an account",
  "Admin assigns your order",
  "Track progress from your dashboard",
  "Chat with admin for updates",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#27272a,_#09090b_55%)] text-white">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-xl font-bold text-yellow-400">
          Booster Lounge
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-900"
          >
            Login
          </Link>

          <Link
            href="/register"
            className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
          >
            Get Started
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid min-h-[75vh] max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2">
        <div>
          <p className="inline-flex rounded-full border border-yellow-400/40 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-300">
            Brawl Stars Coaching & Order Tracking
          </p>

          <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-7xl">
            Track your boost orders like a real dashboard.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
            Booster Lounge lets users log in, view assigned orders, track
            progress, manage credits, and chat with the admin in one clean
            dashboard.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/register"
              className="rounded-xl bg-yellow-400 px-6 py-3 text-center font-bold text-black hover:bg-yellow-300"
            >
              Create Account
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-zinc-700 px-6 py-3 text-center font-bold text-white hover:bg-zinc-900"
            >
              Login
            </Link>
          </div>

          <p className="mt-6 max-w-xl text-sm text-zinc-500">
            Safety notice: Do not share Supercell ID passwords, email passwords,
            2FA codes, or recovery information.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-2xl">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Dashboard Preview</p>
                <h2 className="mt-1 text-2xl font-bold">Order Progress</h2>
              </div>

              <span className="rounded-full border border-yellow-400/40 bg-yellow-400/10 px-3 py-1 text-xs font-semibold text-yellow-300">
                Live
              </span>
            </div>

            <div className="mt-6 grid gap-4">
              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Rank Improvement Guidance</p>
                  <span className="rounded-full border border-blue-400/40 bg-blue-400/10 px-3 py-1 text-xs font-semibold text-blue-300">
                    in progress
                  </span>
                </div>
                <p className="mt-2 text-sm text-zinc-400">
                  Diamond → Masters
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-sm text-zinc-400">Available Credits</p>
                <p className="mt-2 text-3xl font-bold text-yellow-400">
                  $25.00
                </p>
              </div>

              <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                <p className="text-sm font-semibold">Admin Chat</p>
                <p className="mt-2 rounded-lg bg-zinc-800 p-3 text-sm text-zinc-300">
                  Your order has been accepted. Progress will be updated soon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold">Services</h2>
          <p className="mt-3 text-zinc-400">
            Users do not create orders directly. Admins assign orders, while
            users track progress from their dashboard.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {services.map((service) => (
            <div
              key={service.title}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6"
            >
              <h3 className="text-xl font-bold">{service.title}</h3>
              <p className="mt-3 text-sm leading-6 text-zinc-400">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/70 p-8">
          <h2 className="text-3xl font-bold">How it works</h2>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {steps.map((step, index) => (
              <div
                key={step}
                className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-400 font-bold text-black">
                  {index + 1}
                </div>
                <p className="mt-4 font-semibold">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-zinc-900 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-4 text-sm text-zinc-500 md:flex-row">
          <p>© 2026 Booster Lounge. Side project dashboard.</p>
          <p>No passwords, 2FA codes, or recovery details should be shared.</p>
        </div>
      </footer>
    </main>
  );
}