"use client";

import AdminProductManager from "@/components/AdminProductManager";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function AdminProductsPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      if (profile?.role !== "admin") {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      setIsAdmin(true);
      setCheckingAdmin(false);
    }

    checkAdmin();
  }, [router, supabase]);

  if (checkingAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08080b] text-white">
        Checking admin access...
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08080b] px-6 text-white">
        <section className="max-w-md rounded-3xl border border-red-400/30 bg-red-400/10 p-8 text-center">
          <h1 className="text-2xl font-bold text-red-300">Access denied</h1>
          <p className="mt-3 text-sm text-red-100">
            Only admins can manage products.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08080b] px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <AdminProductManager />
      </section>
    </main>
  );
}