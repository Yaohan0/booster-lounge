"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import StatusBadge from "@/components/StatusBadge";

type Profile = {
  id: string;
  email: string | null;
  role: string | null;
  credits: number | null;
};

type Order = {
  id: string;
  user_id: string;
  service_type: string;
  current_rank: string | null;
  target_rank: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
  user_seen_update: boolean | null;
};

type Message = {
  id: string;
  order_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

export default function AdminPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [serviceType, setServiceType] = useState("Coaching Session");
  const [currentRank, setCurrentRank] = useState("");
  const [targetRank, setTargetRank] = useState("");
  const [notes, setNotes] = useState("");

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInputs, setChatInputs] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState("");

  const [userSearch, setUserSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    async function loadAdminData() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setCurrentUserId(user.id);

      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (currentProfile?.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      setAllowed(true);
      await refreshAdminData();
      setLoading(false);
    }

    loadAdminData();
  }, [router, supabase]);

  function formatDate(date: string | null) {
    if (!date) return "N/A";

    return new Intl.DateTimeFormat("en-SG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  }

  async function refreshAdminData() {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, role, credits")
      .order("created_at", { ascending: false });

    if (profileError) {
      alert(profileError.message);
      return;
    }

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (orderError) {
      alert(orderError.message);
      return;
    }

    const { data: messageData, error: messageError } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (messageError) {
      alert(messageError.message);
      return;
    }

    if (profileData) setProfiles(profileData);
    if (orderData) setOrders(orderData);
    if (messageData) setMessages(messageData);
  }

  async function assignOrder(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedUserId) {
      alert("Select a user first.");
      return;
    }

    const { error } = await supabase.from("orders").insert({
      user_id: selectedUserId,
      service_type: serviceType,
      current_rank: currentRank,
      target_rank: targetRank,
      notes,
      status: "pending",
      user_seen_update: false,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setSelectedUserId("");
    setServiceType("Coaching Session");
    setCurrentRank("");
    setTargetRank("");
    setNotes("");

    await refreshAdminData();
  }

  async function updateStatus(orderId: string, status: string) {
    const { error } = await supabase
      .from("orders")
      .update({
        status,
        user_seen_update: false,
      })
      .eq("id", orderId);

    if (error) {
      alert(error.message);
      return;
    }

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              status,
              updated_at: new Date().toISOString(),
              user_seen_update: false,
            }
          : order
      )
    );
  }

  async function updateCredits(userId: string, credits: number) {
    const { error } = await supabase
      .from("profiles")
      .update({ credits })
      .eq("id", userId);

    if (error) {
      alert(error.message);
      return;
    }

    setProfiles((prev) =>
      prev.map((profile) =>
        profile.id === userId ? { ...profile, credits } : profile
      )
    );
  }

  async function sendAdminMessage(orderId: string) {
    const text = chatInputs[orderId]?.trim();

    if (!text) return;

    const { error } = await supabase.from("messages").insert({
      order_id: orderId,
      sender_id: currentUserId,
      message: text,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setChatInputs((prev) => ({
      ...prev,
      [orderId]: "",
    }));

    const { data: messageData, error: messageError } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: true });

    if (messageError) {
      alert(messageError.message);
      return;
    }

    if (messageData) {
      setMessages(messageData);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const filteredProfiles = profiles.filter((profile) =>
    profile.email?.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredOrders = orders.filter((order) => {
    const user = profiles.find((profile) => profile.id === order.user_id);
    const search = orderSearch.toLowerCase();

    const matchesSearch =
      user?.email?.toLowerCase().includes(search) ||
      order.service_type.toLowerCase().includes(search) ||
      order.current_rank?.toLowerCase().includes(search) ||
      order.target_rank?.toLowerCase().includes(search) ||
      order.notes?.toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading || !allowed) {
    return (
      <PageShell title="Admin Panel" subtitle="Checking admin access.">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 text-zinc-400">
          Checking admin access...
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Admin Panel"
      subtitle="Assign orders, update progress, manage credits, and reply to chats."
      rightAction={
        <button
          onClick={logout}
          className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
        >
          Logout
        </button>
      }
    >
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
          <p className="text-sm text-zinc-400">Total Users</p>
          <h2 className="mt-2 text-4xl font-bold">{profiles.length}</h2>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
          <p className="text-sm text-zinc-400">Total Orders</p>
          <h2 className="mt-2 text-4xl font-bold">{orders.length}</h2>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
          <p className="text-sm text-zinc-400">Filtered Orders</p>
          <h2 className="mt-2 text-4xl font-bold">{filteredOrders.length}</h2>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
          <p className="text-sm text-zinc-400">Open Orders</p>
          <h2 className="mt-2 text-4xl font-bold text-yellow-400">
            {
              orders.filter(
                (order) =>
                  order.status !== "completed" && order.status !== "cancelled"
              ).length
            }
          </h2>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
        <h2 className="text-xl font-bold">Assign New Order</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Create a new order and assign it to a normal user.
        </p>

        <form onSubmit={assignOrder} className="mt-5 grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <select
              className="rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
            >
              <option value="">Select user</option>
              {profiles
                .filter((profile) => profile.role !== "admin")
                .map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.email}
                  </option>
                ))}
            </select>

            <select
              className="rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
            >
              <option>Coaching Session</option>
              <option>Rank Improvement Guidance</option>
              <option>Gameplay Review</option>
              <option>Team Strategy Help</option>
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Current rank"
              value={currentRank}
              onChange={(e) => setCurrentRank(e.target.value)}
            />

            <input
              className="rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Target rank"
              value={targetRank}
              onChange={(e) => setTargetRank(e.target.value)}
            />
          </div>

          <textarea
            className="min-h-24 rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
            placeholder="Admin notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <button className="rounded-xl bg-yellow-400 p-3 font-bold text-black hover:bg-yellow-300">
            Assign Order
          </button>
        </form>
      </div>

      <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
        <h2 className="text-xl font-bold">Users & Credits</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Search users and update credit balances.
        </p>

        <input
          className="mt-5 w-full rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder="Search user by email..."
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
        />

        <div className="mt-5 grid gap-4">
          {filteredProfiles.length === 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5 text-sm text-zinc-400">
              No users found.
            </div>
          )}

          {filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">{profile.email}</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Role: {profile.role}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    className="w-36 rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
                    type="number"
                    min="0"
                    step="0.01"
                    value={profile.credits ?? 0}
                    onChange={(e) =>
                      updateCredits(profile.id, Number(e.target.value))
                    }
                  />

                  <span className="text-sm text-zinc-400">credits</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
        <h2 className="text-xl font-bold">All Orders</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Search, filter, update order status, and reply to users.
        </p>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <input
            className="rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
            placeholder="Search orders by user, service, rank, or notes..."
            value={orderSearch}
            onChange={(e) => setOrderSearch(e.target.value)}
          />

          <select
            className="rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <div className="mt-5 grid gap-5">
          {filteredOrders.length === 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 text-zinc-400">
              No matching orders found.
            </div>
          )}

          {filteredOrders.map((order) => {
            const user = profiles.find((p) => p.id === order.user_id);
            const orderMessages = messages.filter(
              (message) => message.order_id === order.id
            );

            return (
              <div
                key={order.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5"
              >
                <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-bold">{order.service_type}</p>
                      <StatusBadge status={order.status} />
                    </div>

                    <p className="mt-2 text-sm text-zinc-400">
                      User: {user?.email || order.user_id}
                    </p>

                    <p className="text-sm text-zinc-400">
                      {order.current_rank || "N/A"} →{" "}
                      {order.target_rank || "N/A"}
                    </p>

                    <p className="mt-3 text-sm text-zinc-300">
                      Notes: {order.notes || "None"}
                    </p>

                    <div className="mt-4 grid gap-3 text-sm text-zinc-400 md:grid-cols-2">
                      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                        <p className="text-xs text-zinc-500">Created</p>
                        <p className="mt-1">{formatDate(order.created_at)}</p>
                      </div>

                      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
                        <p className="text-xs text-zinc-500">Last Updated</p>
                        <p className="mt-1">{formatDate(order.updated_at)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                    <p className="text-xs text-zinc-500">Current Status</p>
                    <div className="mt-2">
                      <StatusBadge status={order.status} />
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {[
                    "pending",
                    "accepted",
                    "rejected",
                    "in_progress",
                    "completed",
                    "cancelled",
                  ].map((status) => (
                    <button
                      key={status}
                      onClick={() => updateStatus(order.id, status)}
                      className={`rounded-xl px-3 py-2 text-sm ${
                        order.status === status
                          ? "bg-yellow-400 font-bold text-black"
                          : "bg-zinc-800 text-white hover:bg-zinc-700"
                      }`}
                    >
                      {status.replace("_", " ")}
                    </button>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold">Order Chat</h4>
                    <p className="text-xs text-zinc-500">
                      {orderMessages.length} message
                      {orderMessages.length === 1 ? "" : "s"}
                    </p>
                  </div>

                  <div className="mt-4 max-h-64 space-y-3 overflow-y-auto rounded-xl bg-zinc-950 p-3">
                    {orderMessages.length === 0 && (
                      <p className="text-sm text-zinc-500">No messages yet.</p>
                    )}

                    {orderMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`max-w-[85%] rounded-xl p-3 text-sm ${
                          message.sender_id === currentUserId
                            ? "ml-auto bg-yellow-400 text-black"
                            : "mr-auto bg-zinc-800 text-white"
                        }`}
                      >
                        {message.message}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <input
                      className="flex-1 rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                      placeholder="Reply to user..."
                      value={chatInputs[order.id] ?? ""}
                      onChange={(e) =>
                        setChatInputs((prev) => ({
                          ...prev,
                          [order.id]: e.target.value,
                        }))
                      }
                    />

                    <button
                      onClick={() => sendAdminMessage(order.id)}
                      className="rounded-xl bg-yellow-400 px-5 py-2 text-sm font-bold text-black hover:bg-yellow-300"
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}