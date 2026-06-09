"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabaseClient";
import StatusBadge from "@/components/StatusBadge";

type Profile = {
  id: string;
  email: string | null;
  username: string | null;
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
  progress_percent: number | null;
  started_at: string | null;
  completed_at: string | null;
  admin_archived: boolean | null;
};

type OrderRequest = {
  id: string;
  user_id: string;
  service_type: string;
  current_rank: string | null;
  target_rank: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
};

type Message = {
  id: string;
  order_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

type OrderUpdate = {
  id: string;
  order_id: string;
  created_by: string | null;
  message: string;
  progress_percent: number;
  created_at: string;
};

const orderStatuses = [
  "pending",
  "accepted",
  "rejected",
  "in_progress",
  "completed",
  "cancelled",
];

export default function AdminPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  const [currentUserId, setCurrentUserId] = useState("");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<OrderRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [orderUpdates, setOrderUpdates] = useState<OrderUpdate[]>([]);

  const [activeTab, setActiveTab] = useState<
    "overview" | "requests" | "orders" | "users"
  >("overview");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedUserId, setSelectedUserId] = useState("");
  const [serviceType, setServiceType] = useState("Rank Boost");
  const [currentRank, setCurrentRank] = useState("");
  const [targetRank, setTargetRank] = useState("");
  const [notes, setNotes] = useState("");

  const [chatInputs, setChatInputs] = useState<Record<string, string>>({});
  const [progressInputs, setProgressInputs] = useState<Record<string, string>>(
    {}
  );
  const [updateInputs, setUpdateInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    async function checkAdmin() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setCurrentUserId(user.id);

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || profile?.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      setAllowed(true);
      await refreshData();
      setLoading(false);
    }

    checkAdmin();
  }, [router, supabase]);

  async function refreshData() {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, username, role, credits")
      .order("email", { ascending: true });

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

    const { data: requestData, error: requestError } = await supabase
      .from("order_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (requestError) {
      alert(requestError.message);
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

    const { data: updateData, error: updateError } = await supabase
      .from("order_updates")
      .select("*")
      .order("created_at", { ascending: true });

    if (updateError) {
      alert(updateError.message);
      return;
    }

    setProfiles((profileData ?? []) as Profile[]);
    setOrders((orderData ?? []) as Order[]);
    setRequests((requestData ?? []) as OrderRequest[]);
    setMessages((messageData ?? []) as Message[]);
    setOrderUpdates((updateData ?? []) as OrderUpdate[]);
  }

  function getUser(userId: string) {
    return profiles.find((profile) => profile.id === userId);
  }

  function formatDate(date: string | null) {
    if (!date) return "N/A";

    return new Intl.DateTimeFormat("en-SG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  }

  function clampProgress(value: number) {
    if (Number.isNaN(value)) return 0;
    if (value < 0) return 0;
    if (value > 100) return 100;
    return value;
  }

  function statusFromProgress(progress: number) {
    if (progress >= 100) return "completed";
    if (progress > 0) return "in_progress";
    return "accepted";
  }

  function latestUpdateForOrder(orderId: string) {
    const logs = orderUpdates.filter((update) => update.order_id === orderId);
    return logs[logs.length - 1] ?? null;
  }

  async function assignOrder(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedUserId) {
      alert("Select a user first.");
      return;
    }

    if (!serviceType.trim()) {
      alert("Service type is required.");
      return;
    }

    const { data: insertedOrder, error } = await supabase
      .from("orders")
      .insert({
        user_id: selectedUserId,
        service_type: serviceType.trim(),
        current_rank: currentRank.trim() || null,
        target_rank: targetRank.trim() || null,
        notes: notes.trim() || null,
        status: "accepted",
        progress_percent: 0,
        user_seen_update: false,
        started_at: null,
        completed_at: null,
        admin_archived: false,
      })
      .select()
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    if (insertedOrder) {
      await supabase.from("order_updates").insert({
        order_id: insertedOrder.id,
        created_by: currentUserId,
        message: "Order assigned by admin. Waiting to start.",
        progress_percent: 0,
      });
    }

    setSelectedUserId("");
    setServiceType("Rank Boost");
    setCurrentRank("");
    setTargetRank("");
    setNotes("");

    await refreshData();
    setActiveTab("orders");
  }

  async function acceptRequest(request: OrderRequest) {
    const { data: insertedOrder, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: request.user_id,
        service_type: request.service_type,
        current_rank: request.current_rank,
        target_rank: request.target_rank,
        notes: request.notes,
        status: "accepted",
        progress_percent: 0,
        user_seen_update: false,
        started_at: null,
        completed_at: null,
        admin_archived: false,
      })
      .select()
      .single();

    if (orderError) {
      alert(orderError.message);
      return;
    }

    if (insertedOrder) {
      const { error: updateError } = await supabase.from("order_updates").insert({
        order_id: insertedOrder.id,
        created_by: currentUserId,
        message: "Request accepted and converted to an active order.",
        progress_percent: 0,
      });

      if (updateError) {
        alert(updateError.message);
        return;
      }
    }

    const { error: requestError } = await supabase
      .from("order_requests")
      .update({
        status: "converted_to_order",
        updated_at: new Date().toISOString(),
      })
      .eq("id", request.id);

    if (requestError) {
      alert(requestError.message);
      return;
    }

    await refreshData();
    setActiveTab("orders");
  }

  async function rejectRequest(requestId: string) {
    const reason = prompt("Reason for rejection?");

    const { error } = await supabase
      .from("order_requests")
      .update({
        status: "rejected",
        notes: reason ? `Rejected reason: ${reason}` : undefined,
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      alert(error.message);
      return;
    }

    await refreshData();
  }

  async function deleteRequest(requestId: string) {
    const confirmed = confirm("Delete this request permanently?");

    if (!confirmed) return;

    const { error } = await supabase
      .from("order_requests")
      .delete()
      .eq("id", requestId);

    if (error) {
      alert(error.message);
      return;
    }

    await refreshData();
  }

  async function updateStatus(order: Order, status: string) {
    const nextProgress =
      status === "completed"
        ? 100
        : status === "pending" || status === "accepted"
        ? 0
        : order.progress_percent ?? 0;

    const { error } = await supabase
      .from("orders")
      .update({
        status,
        progress_percent: nextProgress,
        user_seen_update: false,
        updated_at: new Date().toISOString(),
        started_at:
          status === "in_progress" && !order.started_at
            ? new Date().toISOString()
            : order.started_at,
        completed_at:
          status === "completed" ? new Date().toISOString() : order.completed_at,
      })
      .eq("id", order.id);

    if (error) {
      alert(error.message);
      return;
    }

    await supabase.from("order_updates").insert({
      order_id: order.id,
      created_by: currentUserId,
      message: `Status updated to ${status.replaceAll("_", " ")}.`,
      progress_percent: nextProgress,
    });

    await refreshData();
  }

  async function addProgressUpdate(order: Order) {
    const rawProgress =
      progressInputs[order.id] ?? String(order.progress_percent ?? 0);
    const message = updateInputs[order.id]?.trim();

    if (!message) {
      alert("Write an update log message first.");
      return;
    }

    const progress = clampProgress(Number(rawProgress));
    const nextStatus = statusFromProgress(progress);

    const { error: orderError } = await supabase
      .from("orders")
      .update({
        progress_percent: progress,
        status: nextStatus,
        user_seen_update: false,
        updated_at: new Date().toISOString(),
        started_at:
          progress > 0 && !order.started_at
            ? new Date().toISOString()
            : order.started_at,
        completed_at: progress >= 100 ? new Date().toISOString() : null,
      })
      .eq("id", order.id);

    if (orderError) {
      alert(orderError.message);
      return;
    }

    const { error: updateError } = await supabase.from("order_updates").insert({
      order_id: order.id,
      created_by: currentUserId,
      message,
      progress_percent: progress,
    });

    if (updateError) {
      alert(updateError.message);
      return;
    }

    setProgressInputs((prev) => ({
      ...prev,
      [order.id]: String(progress),
    }));

    setUpdateInputs((prev) => ({
      ...prev,
      [order.id]: "",
    }));

    await refreshData();
  }

  async function completeOrder(order: Order) {
    const { error: orderError } = await supabase
      .from("orders")
      .update({
        status: "completed",
        progress_percent: 100,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_seen_update: false,
      })
      .eq("id", order.id);

    if (orderError) {
      alert(orderError.message);
      return;
    }

    const { error: updateError } = await supabase.from("order_updates").insert({
      order_id: order.id,
      created_by: currentUserId,
      message: "Order completed.",
      progress_percent: 100,
    });

    if (updateError) {
      alert(updateError.message);
      return;
    }

    await refreshData();
  }

  async function archiveOrder(orderId: string) {
    const confirmed = confirm(
      "Archive this order from the admin active list? The user can still see it in history."
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("orders")
      .update({
        admin_archived: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId);

    if (error) {
      alert(error.message);
      return;
    }

    await refreshData();
  }

  async function deleteOrder(orderId: string) {
    const confirmed = confirm(
      "Delete this order permanently? This also deletes its logs and chat."
    );

    if (!confirmed) return;

    const { error } = await supabase.from("orders").delete().eq("id", orderId);

    if (error) {
      alert(error.message);
      return;
    }

    await refreshData();
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

  async function updateUsername(userId: string, username: string) {
    const { error } = await supabase
      .from("profiles")
      .update({ username })
      .eq("id", userId);

    if (error) {
      alert(error.message);
      return;
    }

    setProfiles((prev) =>
      prev.map((profile) =>
        profile.id === userId ? { ...profile, username } : profile
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

    await refreshData();
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const pendingRequests = requests.filter(
    (request) => request.status === "pending"
  );

  const activeOrders = orders.filter(
    (order) =>
      order.status !== "completed" &&
      order.status !== "cancelled" &&
      !order.admin_archived
  );

  const completedOrders = orders.filter(
    (order) => order.status === "completed" && !order.admin_archived
  );

  const filteredOrders = orders.filter((order) => {
    const user = getUser(order.user_id);
    const text = [
      order.service_type,
      order.current_rank,
      order.target_rank,
      order.notes,
      order.status,
      user?.email,
      user?.username,
    ]
      .join(" ")
      .toLowerCase();

    const matchesSearch = text.includes(search.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus && !order.admin_archived;
  });

  const normalUsers = profiles.filter((profile) => profile.role !== "admin");

  if (loading || !allowed) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          Checking admin access...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#27272a,_#09090b_55%)] px-6 py-8 text-white">
      <section className="mx-auto max-w-7xl">
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

            <Link href="/admin/products" className="text-zinc-300 hover:text-white">
              Product Manager
            </Link>

            <Link href="/admin" className="text-yellow-300 hover:text-white">
              Orders Admin
            </Link>
          </div>
        </nav>

        <header className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">Admin Panel</h1>
            <p className="mt-2 text-zinc-400">
              Review requests, create orders, update progress, manage users, and
              chat with customers.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-bold hover:bg-zinc-900"
            >
              User Dashboard
            </Link>

            <button
              onClick={logout}
              className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-bold hover:bg-zinc-700"
            >
              Logout
            </button>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-5">
          <StatCard label="Users" value={normalUsers.length} />
          <StatCard label="Pending Requests" value={pendingRequests.length} />
          <StatCard label="Active Orders" value={activeOrders.length} />
          <StatCard label="Completed" value={completedOrders.length} />
          <StatCard
            label="Processed Requests"
            value={requests.filter((request) => request.status !== "pending").length}
          />
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <TabButton
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </TabButton>

          <TabButton
            active={activeTab === "requests"}
            onClick={() => setActiveTab("requests")}
          >
            Requests ({pendingRequests.length})
          </TabButton>

          <TabButton
            active={activeTab === "orders"}
            onClick={() => setActiveTab("orders")}
          >
            Orders ({activeOrders.length})
          </TabButton>

          <TabButton
            active={activeTab === "users"}
            onClick={() => setActiveTab("users")}
          >
            Users ({normalUsers.length})
          </TabButton>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <input
            className="rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
            placeholder="Search user, email, service, notes, status..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All order statuses</option>
            {orderStatuses.map((status) => (
              <option key={status} value={status}>
                {status.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </div>

        {(activeTab === "overview" || activeTab === "requests") && (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
              <h2 className="text-xl font-bold">Create / Assign Manual Order</h2>

              <form onSubmit={assignOrder} className="mt-5 grid gap-4">
                <select
                  className="rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                >
                  <option value="">Select user</option>
                  {normalUsers.map((profile) => (
                    <option key={profile.id} value={profile.id}>
                      {profile.username || profile.email || profile.id}
                    </option>
                  ))}
                </select>

                <input
                  className="rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Service type"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    className="rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Current"
                    value={currentRank}
                    onChange={(e) => setCurrentRank(e.target.value)}
                  />

                  <input
                    className="rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Target"
                    value={targetRank}
                    onChange={(e) => setTargetRank(e.target.value)}
                  />
                </div>

                <textarea
                  className="min-h-28 rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Order notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />

                <button className="rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black hover:bg-yellow-300">
                  Assign Order
                </button>
              </form>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
              <h2 className="text-xl font-bold">Incoming Requests</h2>

              <div className="mt-5 grid gap-4">
                {pendingRequests.length === 0 && (
                  <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 text-center text-zinc-400">
                    No pending requests.
                  </div>
                )}

                {pendingRequests.map((request) => {
                  const user = getUser(request.user_id);

                  return (
                    <div
                      key={request.id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="font-bold">{request.service_type}</h3>
                        <StatusBadge status={request.status} />
                      </div>

                      <p className="mt-2 text-sm text-zinc-400">
                        User: {user?.username || user?.email || request.user_id}
                      </p>

                      <p className="mt-1 text-sm text-zinc-400">
                        {request.current_rank || "N/A"} →{" "}
                        {request.target_rank || "N/A"}
                      </p>

                      <p className="mt-3 whitespace-pre-wrap rounded-xl bg-zinc-900 p-3 text-sm text-zinc-300">
                        {request.notes || "No notes."}
                      </p>

                      <p className="mt-3 text-xs text-zinc-500">
                        Submitted: {formatDate(request.created_at)}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => acceptRequest(request)}
                          className="rounded-xl bg-green-500 px-4 py-2 text-sm font-bold text-black hover:bg-green-400"
                        >
                          Accept + Convert
                        </button>

                        <button
                          onClick={() => rejectRequest(request.id)}
                          className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500"
                        >
                          Reject
                        </button>

                        <button
                          onClick={() => deleteRequest(request.id)}
                          className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-bold hover:bg-zinc-700"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {(activeTab === "overview" || activeTab === "orders") && (
          <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
            <h2 className="text-xl font-bold">Orders & Progress</h2>

            <div className="mt-5 grid gap-5">
              {filteredOrders.length === 0 && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 text-center text-zinc-400">
                  No matching orders.
                </div>
              )}

              {filteredOrders.map((order) => {
                const user = getUser(order.user_id);
                const progress = order.progress_percent ?? 0;
                const orderMessages = messages.filter(
                  (message) => message.order_id === order.id
                );
                const logs = orderUpdates.filter(
                  (update) => update.order_id === order.id
                );
                const latestUpdate = latestUpdateForOrder(order.id);

                return (
                  <div
                    key={order.id}
                    className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5"
                  >
                    <div className="flex flex-col justify-between gap-5 lg:flex-row">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-lg font-bold">
                            {order.service_type}
                          </h3>
                          <StatusBadge status={order.status} />
                        </div>

                        <p className="mt-2 text-sm text-zinc-400">
                          User: {user?.username || user?.email || order.user_id}
                        </p>

                        <p className="mt-1 text-sm text-zinc-400">
                          {order.current_rank || "N/A"} →{" "}
                          {order.target_rank || "N/A"}
                        </p>

                        <p className="mt-3 whitespace-pre-wrap rounded-xl bg-zinc-900 p-3 text-sm text-zinc-300">
                          {order.notes || "No notes."}
                        </p>
                      </div>

                      <div className="min-w-[260px] rounded-2xl border border-zinc-800 bg-zinc-900 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-zinc-400">Progress</p>
                          <p className="text-xl font-bold text-yellow-300">
                            {progress}%
                          </p>
                        </div>

                        <ProgressBar value={progress} />

                        <p className="mt-3 text-xs text-zinc-500">
                          Latest: {latestUpdate?.message || "No updates yet."}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      {orderStatuses.map((status) => (
                        <button
                          key={status}
                          onClick={() => updateStatus(order, status)}
                          className={`rounded-xl px-3 py-2 text-sm font-semibold ${
                            order.status === status
                              ? "bg-yellow-400 text-black"
                              : "bg-zinc-800 text-white hover:bg-zinc-700"
                          }`}
                        >
                          {status.replaceAll("_", " ")}
                        </button>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-5 lg:grid-cols-2">
                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
                        <h4 className="font-bold">Add Progress Update</h4>

                        <label className="mt-4 grid gap-2">
                          <span className="text-sm text-zinc-400">
                            Progress percentage
                          </span>
                          <input
                            className="rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
                            type="number"
                            min="0"
                            max="100"
                            value={
                              progressInputs[order.id] ??
                              String(order.progress_percent ?? 0)
                            }
                            onChange={(e) =>
                              setProgressInputs((prev) => ({
                                ...prev,
                                [order.id]: e.target.value,
                              }))
                            }
                          />
                        </label>

                        <textarea
                          className="mt-4 min-h-24 w-full rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
                          placeholder="Example: Reached Mythic II. Continuing next session."
                          value={updateInputs[order.id] ?? ""}
                          onChange={(e) =>
                            setUpdateInputs((prev) => ({
                              ...prev,
                              [order.id]: e.target.value,
                            }))
                          }
                        />

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            onClick={() => addProgressUpdate(order)}
                            className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
                          >
                            Add Update Log
                          </button>

                          <button
                            onClick={() => completeOrder(order)}
                            className="rounded-xl bg-green-500 px-4 py-2 text-sm font-bold text-black hover:bg-green-400"
                          >
                            Complete 100%
                          </button>

                          {order.status === "completed" && (
                            <button
                              onClick={() => archiveOrder(order.id)}
                              className="rounded-xl bg-zinc-800 px-4 py-2 text-sm font-bold hover:bg-zinc-700"
                            >
                              Archive
                            </button>
                          )}

                          {(order.status === "rejected" ||
                            order.status === "cancelled") && (
                            <button
                              onClick={() => deleteOrder(order.id)}
                              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
                        <h4 className="font-bold">Update Timeline</h4>

                        <div className="mt-4 max-h-72 space-y-3 overflow-y-auto">
                          {logs.length === 0 && (
                            <p className="text-sm text-zinc-500">
                              No update logs yet.
                            </p>
                          )}

                          {logs.map((log) => (
                            <div
                              key={log.id}
                              className="rounded-xl border border-zinc-800 bg-zinc-950 p-3"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-bold text-yellow-300">
                                  {log.progress_percent}%
                                </p>
                                <p className="text-xs text-zinc-500">
                                  {formatDate(log.created_at)}
                                </p>
                              </div>

                              <p className="mt-2 text-sm text-zinc-300">
                                {log.message}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold">Order Chat</h4>
                        <p className="text-xs text-zinc-500">
                          {orderMessages.length} message
                          {orderMessages.length === 1 ? "" : "s"}
                        </p>
                      </div>

                      <div className="mt-4 max-h-64 space-y-3 overflow-y-auto rounded-xl bg-zinc-950 p-3">
                        {orderMessages.length === 0 && (
                          <p className="text-sm text-zinc-500">
                            No messages yet.
                          </p>
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
                            <p>{message.message}</p>
                            <p className="mt-1 text-[11px] opacity-70">
                              {formatDate(message.created_at)}
                            </p>
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
          </section>
        )}

        {activeTab === "users" && (
          <section className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
            <h2 className="text-xl font-bold">Users & Credits</h2>

            <div className="mt-5 grid gap-4">
              {normalUsers.map((profile) => (
                <div
                  key={profile.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5"
                >
                  <div className="grid gap-4 md:grid-cols-4">
                    <div>
                      <p className="text-xs text-zinc-500">Email</p>
                      <p className="mt-1 font-semibold">
                        {profile.email || "No email"}
                      </p>
                    </div>

                    <label>
                      <p className="text-xs text-zinc-500">Username</p>
                      <input
                        className="mt-1 w-full rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
                        value={profile.username ?? ""}
                        onChange={(e) =>
                          updateUsername(profile.id, e.target.value)
                        }
                      />
                    </label>

                    <label>
                      <p className="text-xs text-zinc-500">Credits</p>
                      <input
                        className="mt-1 w-full rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
                        type="number"
                        min="0"
                        step="0.01"
                        value={profile.credits ?? 0}
                        onChange={(e) =>
                          updateCredits(profile.id, Number(e.target.value))
                        }
                      />
                    </label>

                    <div>
                      <p className="text-xs text-zinc-500">Orders</p>
                      <p className="mt-3 text-2xl font-bold text-yellow-300">
                        {
                          orders.filter((order) => order.user_id === profile.id)
                            .length
                        }
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
      <p className="text-sm text-zinc-400">{label}</p>
      <h2 className="mt-2 text-4xl font-bold text-yellow-400">{value}</h2>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-bold ${
        active
          ? "bg-yellow-400 text-black"
          : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
      }`}
    >
      {children}
    </button>
  );
}

function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <div className="mt-3 h-4 overflow-hidden rounded-full bg-zinc-800">
      <div
        className="h-full rounded-full bg-yellow-400 transition-all"
        style={{ width: `${safeValue}%` }}
      />
    </div>
  );
}