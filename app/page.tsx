import Link from "next/link";

const services = [
  {
    title: "Rank Boost Request",
    description:
      "Choose your current rank, desired rank, and options. Admin reviews your request before assigning an order.",
  },
  {
    title: "Gameplay Coaching",
    description:
      "Request coaching support, gameplay review, or strategy guidance based on your current level.",
  },
  {
    title: "Accounts & Pins",
    description:
      "Browse account listings and exclusive pin listings, then submit purchase requests for admin review.",
  },
];

const steps = [
  "Browse services or listings",
  "Submit a request",
  "Admin reviews your request",
  "Track progress from dashboard",
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
            href="/services"
            className="hidden rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-900 sm:inline-block"
          >
            Services
          </Link>

          <Link
            href="/accounts"
            className="hidden rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-900 sm:inline-block"
          >
            Accounts
          </Link>

          <Link
            href="/pins"
            className="hidden rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-900 sm:inline-block"
          >
            Pins
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
          >
            My Dashboard
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid min-h-[75vh] max-w-6xl items-center gap-10 px-6 py-16 lg:grid-cols-2">
        <div>
          <p className="inline-flex rounded-full border border-yellow-400/40 bg-yellow-400/10 px-4 py-2 text-sm font-semibold text-yellow-300">
            Brawl Stars Services & Order Tracking
          </p>

          <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-7xl">
            Submit requests and track everything from one dashboard.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-zinc-300">
            Booster Lounge lets users submit boosting requests, browse account
            and pin listings, view assigned orders, track progress, manage
            credits, and chat with admin.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/services"
              className="rounded-xl bg-yellow-400 px-6 py-3 text-center font-bold text-black hover:bg-yellow-300"
            >
              View Services
            </Link>

            <Link
              href="/accounts"
              className="rounded-xl border border-zinc-700 px-6 py-3 text-center font-bold text-white hover:bg-zinc-900"
            >
              Browse Accounts
            </Link>

            <Link
              href="/dashboard"
              className="rounded-xl border border-zinc-700 px-6 py-3 text-center font-bold text-white hover:bg-zinc-900"
            >
              My Dashboard
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
                <div className="flex items-center justify-between gap-4">
                  <p className="font-semibold">Rank Boost Request</p>
                  <span className="rounded-full border border-green-400/40 bg-green-400/10 px-3 py-1 text-xs font-semibold text-green-300">
                    accepted
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
                  Your request has been reviewed. Order progress will be updated
                  here.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold">What you can do</h2>
          <p className="mt-3 text-zinc-400">
            Submit service requests, browse listings, and track all accepted
            orders through your dashboard.
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

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/services"
            className="inline-flex rounded-xl bg-yellow-400 px-6 py-3 font-bold text-black hover:bg-yellow-300"
          >
            Browse Services
          </Link>

          <Link
            href="/pins"
            className="inline-flex rounded-xl border border-zinc-700 px-6 py-3 font-bold text-white hover:bg-zinc-900"
          >
            Browse Pins
          </Link>
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

      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-3xl border border-yellow-400/30 bg-yellow-400/10 p-8">
          <h2 className="text-3xl font-bold">Ready to submit a request?</h2>
          <p className="mt-3 max-w-2xl text-zinc-300">
            Pick your service type, choose your target details, add notes, and
            submit it for admin review.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/services"
              className="rounded-xl bg-yellow-400 px-6 py-3 text-center font-bold text-black hover:bg-yellow-300"
            >
              Start Request
            </Link>

            <Link
              href="/dashboard"
              className="rounded-xl border border-zinc-700 px-6 py-3 text-center font-bold text-white hover:bg-zinc-900"
            >
              My Dashboard
            </Link>
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