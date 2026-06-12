"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  email: string | null;
  username: string | null;
  role: string | null;
  credits: number | null;
  created_at: string | null;
};

export default function AdminUsersPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [checkingAdmin, setCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

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

      if (error || profile?.role !== "admin") {
        setIsAdmin(false);
        setCheckingAdmin(false);
        return;
      }

      setIsAdmin(true);
      setCheckingAdmin(false);
    }

    checkAdmin();
  }, [router, supabase]);

  useEffect(() => {
    if (isAdmin) {
      loadUsers();
    }
  }, [isAdmin]);

  async function loadUsers() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, username, role, credits, created_at")
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setProfiles((data ?? []) as Profile[]);
  }

  async function updateCredits(profile: Profile, mode: "add" | "subtract" | "set") {
    setMessage("");
    setErrorMessage("");

    const input = window.prompt(
      mode === "set"
        ? `Set credits for ${profile.email || profile.username || profile.id}`
        : `${mode === "add" ? "Add" : "Subtract"} how many credits?`
    );

    if (input === null) return;

    const amount = Number(input);

    if (Number.isNaN(amount) || amount < 0) {
      setErrorMessage("Enter a valid positive number.");
      return;
    }

    const currentCredits = Number(profile.credits ?? 0);

    let nextCredits = currentCredits;

    if (mode === "add") {
      nextCredits = currentCredits + amount;
    }

    if (mode === "subtract") {
      nextCredits = Math.max(0, currentCredits - amount);
    }

    if (mode === "set") {
      nextCredits = amount;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        credits: nextCredits,
      })
      .eq("id", profile.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage(
      `Updated credits for ${profile.email || profile.username || profile.id}.`
    );

    await loadUsers();
  }

  async function makeAdmin(profile: Profile) {
    const confirmed = window.confirm(
      `Make ${profile.email || profile.username || profile.id} an admin?`
    );

    if (!confirmed) return;

    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        role: "admin",
      })
      .eq("id", profile.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("User is now admin.");
    await loadUsers();
  }

  async function makeUser(profile: Profile) {
    const confirmed = window.confirm(
      `Change ${profile.email || profile.username || profile.id} back to normal user?`
    );

    if (!confirmed) return;

    setMessage("");
    setErrorMessage("");

    const { error } = await supabase
      .from("profiles")
      .update({
        role: "user",
      })
      .eq("id", profile.id);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("User is now normal user.");
    await loadUsers();
  }

  const filteredProfiles = profiles.filter((profile) => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return true;

    const text = [
      profile.email,
      profile.username,
      profile.role,
      profile.id,
      String(profile.credits ?? 0),
    ]
      .join(" ")
      .toLowerCase();

    return text.includes(keyword);
  });

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
            Only admins can manage users and credits.
          </p>

          <Link
            href="/dashboard"
            className="mt-6 inline-block rounded-xl bg-yellow-400 px-4 py-3 font-bold text-black"
          >
            Back to dashboard
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08080b] px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
        <nav className="mb-8 flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 px-5 py-4 md:flex-row md:items-center md:justify-between">
          <Link href="/" className="text-xl font-bold text-yellow-400">
            Booster Lounge
          </Link>

          <div className="flex flex-wrap gap-4 text-sm">
            <Link href="/admin" className="text-zinc-300 hover:text-white">
              Admin Orders
            </Link>

            <Link
              href="/admin/products"
              className="text-zinc-300 hover:text-white"
            >
              Products
            </Link>

            <Link
              href="/admin/catalog"
              className="text-zinc-300 hover:text-white"
            >
              Catalog
            </Link>

            <Link href="/admin/users" className="text-yellow-300">
              Users
            </Link>

            <Link href="/dashboard" className="text-zinc-300 hover:text-white">
              Dashboard
            </Link>
          </div>
        </nav>

        <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-semibold text-yellow-300">Admin Users</p>
            <h1 className="mt-2 text-4xl font-black">Users and Credits</h1>
            <p className="mt-3 max-w-2xl text-zinc-400">
              View registered users, add credits, subtract credits, or change
              roles.
            </p>
          </div>

          <button
            type="button"
            onClick={loadUsers}
            className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-bold text-zinc-200 hover:bg-zinc-900"
          >
            Refresh
          </button>
        </header>

        {message && (
          <div className="mb-6 rounded-2xl border border-green-400/30 bg-green-400/10 p-4 text-sm text-green-300">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold">Registered Users</h2>
              <p className="mt-2 text-sm text-zinc-400">
                {loading
                  ? "Loading users..."
                  : `${filteredProfiles.length} user(s) shown`}
              </p>
            </div>

            <input
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm outline-none focus:border-yellow-400 md:w-80"
              placeholder="Search email, username, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[900px] border-separate border-spacing-y-3 text-left text-sm">
              <thead className="text-zinc-500">
                <tr>
                  <th className="px-4 py-2">User</th>
                  <th className="px-4 py-2">Role</th>
                  <th className="px-4 py-2">Credits</th>
                  <th className="px-4 py-2">Created</th>
                  <th className="px-4 py-2 text-right">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredProfiles.map((profile) => (
                  <tr key={profile.id} className="bg-zinc-900">
                    <td className="rounded-l-2xl px-4 py-4">
                      <p className="font-bold text-white">
                        {profile.username || "No username"}
                      </p>
                      <p className="mt-1 text-xs text-zinc-500">
                        {profile.email || "No email"}
                      </p>
                      <p className="mt-1 text-[11px] text-zinc-600">
                        {profile.id}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          profile.role === "admin"
                            ? "bg-yellow-400/10 text-yellow-300"
                            : "bg-zinc-800 text-zinc-300"
                        }`}
                      >
                        {profile.role || "user"}
                      </span>
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-2xl font-black text-yellow-300">
                        {Number(profile.credits ?? 0).toFixed(2)}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-zinc-400">
                      {profile.created_at
                        ? new Date(profile.created_at).toLocaleDateString()
                        : "N/A"}
                    </td>

                    <td className="rounded-r-2xl px-4 py-4">
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => updateCredits(profile, "add")}
                          className="rounded-xl bg-green-400 px-3 py-2 text-xs font-bold text-black hover:bg-green-300"
                        >
                          Add
                        </button>

                        <button
                          type="button"
                          onClick={() => updateCredits(profile, "subtract")}
                          className="rounded-xl bg-red-400 px-3 py-2 text-xs font-bold text-black hover:bg-red-300"
                        >
                          Subtract
                        </button>

                        <button
                          type="button"
                          onClick={() => updateCredits(profile, "set")}
                          className="rounded-xl bg-zinc-700 px-3 py-2 text-xs font-bold text-white hover:bg-zinc-600"
                        >
                          Set
                        </button>

                        {profile.role === "admin" ? (
                          <button
                            type="button"
                            onClick={() => makeUser(profile)}
                            className="rounded-xl border border-zinc-700 px-3 py-2 text-xs font-bold text-zinc-200 hover:bg-zinc-800"
                          >
                            Make User
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => makeAdmin(profile)}
                            className="rounded-xl border border-yellow-400/40 px-3 py-2 text-xs font-bold text-yellow-300 hover:bg-yellow-400/10"
                          >
                            Make Admin
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

                {!loading && filteredProfiles.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-center text-zinc-400"
                    >
                      No users found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </main>
  );
}