"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseClient";

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
  const supabase = useMemo(() => createClient(), []);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setIsAdmin(profile?.role === "admin");
    }

    checkRole();
  }, [supabase]);

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

            <Link href="/dashboard" className="text-zinc-300 hover:text-white">
              Dashboard
            </Link>

            {isAdmin && (
              <Link href="/admin" className="text-yellow-300 hover:text-white">
                Admin
              </Link>
            )}
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