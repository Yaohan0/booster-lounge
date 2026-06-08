"use client";

import AdminProductManager from "../../components/AdminProductManager";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
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
  completed_at: string | null;
  user_seen_update: boolean | null;
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
  admin_notes: string | null;
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

type OrderEditData = {
  service_type: string;
  current_rank: string;
  target_rank: string;
  notes: string;
  status: string;
};

export default function AdminPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<OrderRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  const [selectedUserId, setSelectedUserId] = useState("");
  const [serviceType, setServiceType] = useState("Rank Boost");
  const [currentRank, setCurrentRank] = useState("");
  const [targetRank, setTargetRank] = useState("");
  const [notes, setNotes] = useState("");

  const [chatInputs, setChatInputs] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState("");

  const [userSearch, setUserSearch] = useState("");
  const [requestSearch, setRequestSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProfileId, setSelectedProfileId] = useState("");

  const [usernameInputs, setUsernameInputs] = useState<Record<string, string>>(
    {}
  );

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

  function getUserLabel(userId: string) {
    const profile = profiles.find((item) => item.id === userId);

    if (!profile) return userId;

    return `${profile.username || "No username"} • ${
      profile.email || "No email"
    }`;
  }

  async function refreshAdminData() {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, username, role, credits")
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

    setProfiles((profileData ?? []) as Profile[]);
    setOrders((orderData ?? []) as Order[]);
    setRequests((requestData ?? []) as OrderRequest[]);
    setMessages((messageData ?? []) as Message[]);

    const nextInputs: Record<string, string> = {};
    (profileData ?? []).forEach((profile) => {
      nextInputs[profile.id] = profile.username || "";
    });
    setUsernameInputs(nextInputs);
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
      admin_archived: false,
      updated_at: new Date().toISOString(),
    });

    if (error) {
      alert(error.message);
      return;
    }

    setSelectedUserId("");
    setServiceType("Rank Boost");
    setCurrentRank("");
    setTargetRank("");
    setNotes("");

    await refreshAdminData();
  }

  async function updateStatus(orderId: string, status: string) {
    const updateData: Partial<Order> = {
      status,
      updated_at: new Date().toISOString(),
      user_seen_update: false,
    };

    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId);

    if (error) {
      alert(error.message);
      return;
    }

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, ...updateData } : order
      )
    );
  }

  async function updateOrderDetails(orderId: string, data: OrderEditData) {
    const payload: Partial<Order> = {
      service_type: data.service_type,
      current_rank: data.current_rank,
      target_rank: data.target_rank,
      notes: data.notes,
      status: data.status,
      updated_at: new Date().toISOString(),
      user_seen_update: false,
    };

    if (data.status === "completed") {
      payload.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("orders")
      .update(payload)
      .eq("id", orderId);

    if (error) {
      alert(error.message);
      return;
    }

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, ...payload } : order
      )
    );
  }

  async function deleteOrder(order: Order) {
    const confirmed = confirm(
      `Delete this ${order.status} order permanently? This cannot be undone.`
    );

    if (!confirmed) return;

    const { error } = await supabase.from("orders").delete().eq("id", order.id);

    if (error) {
      alert(error.message);
      return;
    }

    setOrders((prev) => prev.filter((item) => item.id !== order.id));
  }

  async function archiveCompletedOrder(orderId: string) {
    const confirmed = confirm(
      "Remove this completed order from the active admin list? The user will still see it in completed history."
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

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId
          ? {
              ...order,
              admin_archived: true,
              updated_at: new Date().toISOString(),
            }
          : order
      )
    );
  }

  async function restoreArchivedOrder(orderId: string) {
    const { error } = await supabase
      .from("orders")
      .update({
        admin_archived: false,
        updated_at: new Date().toISOString(),
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
              admin_archived: false,
              updated_at: new Date().toISOString(),
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

  async function updateUsername(userId: string) {
    const username = usernameInputs[userId]?.trim();

    if (!username) {
      alert("Username cannot be empty.");
      return;
    }

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

  async function deleteRequest(requestId: string) {
    const { error } = await supabase
      .from("order_requests")
      .delete()
      .eq("id", requestId);

    if (error) {
      alert(error.message);
      return false;
    }

    setRequests((prev) => prev.filter((request) => request.id !== requestId));
    return true;
  }

  async function rejectRequest(request: OrderRequest) {
    const confirmed = confirm(
      "Reject this request and remove it from Incoming Requests?"
    );

    if (!confirmed) return;

    await deleteRequest(request.id);
  }

  async function acceptRequestAndCreateOrder(request: OrderRequest) {
    const { error: orderError } = await supabase.from("orders").insert({
      user_id: request.user_id,
      service_type: request.service_type,
      current_rank: request.current_rank,
      target_rank: request.target_rank,
      notes: request.notes,
      status: "accepted",
      user_seen_update: false,
      admin_archived: false,
      updated_at: new Date().toISOString(),
    });

    if (orderError) {
      alert(orderError.message);
      return;
    }

    await deleteRequest(request.id);
    await refreshAdminData();
  }

  async function convertRequestToOrder(request: OrderRequest) {
    const { error: orderError } = await supabase.from("orders").insert({
      user_id: request.user_id,
      service_type: request.service_type,
      current_rank: request.current_rank,
      target_rank: request.target_rank,
      notes: request.notes,
      status: "pending",
      user_seen_update: false,
      admin_archived: false,
      updated_at: new Date().toISOString(),
    });

    if (orderError) {
      alert(orderError.message);
      return;
    }

    await deleteRequest(request.id);
    await refreshAdminData();
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

    setMessages((messageData ?? []) as Message[]);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  const filteredProfiles = profiles.filter((profile) => {
    const search = userSearch.toLowerCase();

    return (
      profile.email?.toLowerCase().includes(search) ||
      profile.username?.toLowerCase().includes(search) ||
      profile.role?.toLowerCase().includes(search)
    );
  });

  const filteredRequests = requests
    .filter((request) => request.status === "pending")
    .filter((request) => {
      const search = requestSearch.toLowerCase();
      const user = profiles.find((profile) => profile.id === request.user_id);
      const userLabel = getUserLabel(request.user_id).toLowerCase();

      return (
        userLabel.includes(search) ||
        user?.email?.toLowerCase().includes(search) ||
        user?.username?.toLowerCase().includes(search) ||
        request.service_type.toLowerCase().includes(search) ||
        request.current_rank?.toLowerCase().includes(search) ||
        request.target_rank?.toLowerCase().includes(search) ||
        request.notes?.toLowerCase().includes(search)
      );
    });

  const activeOrders = orders.filter((order) => order.admin_archived !== true);

  const filteredOrders = activeOrders.filter((order) => {
    const search = orderSearch.toLowerCase();
    const userLabel = getUserLabel(order.user_id).toLowerCase();

    const matchesSearch =
      userLabel.includes(search) ||
      order.service_type.toLowerCase().includes(search) ||
      order.current_rank?.toLowerCase().includes(search) ||
      order.target_rank?.toLowerCase().includes(search) ||
      order.notes?.toLowerCase().includes(search) ||
      order.status.toLowerCase().includes(search);

    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const completedOrders = orders.filter((order) => order.status === "completed");
  const archivedOrders = orders.filter((order) => order.admin_archived === true);
  const rejectedOrders = orders.filter((order) => order.status === "rejected");

  const selectedProfile = profiles.find(
    (profile) => profile.id === selectedProfileId
  );

  const selectedProfileOrders = selectedProfileId
    ? orders.filter((order) => order.user_id === selectedProfileId)
    : [];

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
      subtitle="Manage requests, orders, users, credits, products, and account tracking."
      rightAction={
        <button
          onClick={logout}
          className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
        >
          Logout
        </button>
      }
    >
      <div className="grid gap-4 md:grid-cols-6">
        <StatCard label="Users" value={profiles.length} />
        <StatCard label="Active Orders" value={activeOrders.length} />
        <StatCard label="Pending Requests" value={filteredRequests.length} />
        <StatCard label="Completed" value={completedOrders.length} />
        <StatCard label="Rejected" value={rejectedOrders.length} danger />
        <StatCard label="Archived" value={archivedOrders.length} highlight />
      </div>

      <Panel
        title="Assign New Order"
        subtitle="Create a new active order and assign it to a tracked user."
      >
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
                    {profile.username || "No username"} • {profile.email}
                  </option>
                ))}
            </select>

            <select
              className="rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
            >
              <option>Rank Boost</option>
              <option>Trophy Boost</option>
              <option>Prestige Icon</option>
              <option>Coaching</option>
              <option>Account Purchase</option>
              <option>Exclusive Pins</option>
              <option>Special Offer</option>
              <option>Custom Request</option>
            </select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <input
              className="rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Current rank / current value"
              value={currentRank}
              onChange={(e) => setCurrentRank(e.target.value)}
            />

            <input
              className="rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Target rank / target value"
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
      </Panel>

      <Panel
        title="Incoming Requests"
        subtitle="Accept creates an order and removes the request from this list."
      >
        <input
          className="mt-5 w-full rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder="Search requests by username, email, service, rank, or notes..."
          value={requestSearch}
          onChange={(e) => setRequestSearch(e.target.value)}
        />

        <div className="mt-5 grid gap-5">
          {filteredRequests.length === 0 && (
            <EmptyState text="No pending incoming requests found." />
          )}

          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5"
            >
              <div className="flex flex-col justify-between gap-5 md:flex-row">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-lg font-bold">{request.service_type}</p>
                    <StatusBadge status={request.status} />
                  </div>

                  <p className="mt-2 text-sm text-zinc-400">
                    User: {getUserLabel(request.user_id)}
                  </p>

                  <p className="text-sm text-zinc-400">
                    {request.current_rank || "N/A"} →{" "}
                    {request.target_rank || "N/A"}
                  </p>

                  <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-300">
                    Notes: {request.notes || "None"}
                  </p>

                  <DateGrid
                    createdAt={request.created_at}
                    updatedAt={request.updated_at}
                    completedAt={null}
                    formatDate={formatDate}
                  />
                </div>

                <StatusCard label="Request Status" status={request.status} />
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                <button
                  onClick={() => acceptRequestAndCreateOrder(request)}
                  className="rounded-xl bg-green-400 px-3 py-2 text-sm font-bold text-black hover:bg-green-300"
                >
                  Accept + Create Order
                </button>

                <button
                  onClick={() => rejectRequest(request)}
                  className="rounded-xl bg-red-500 px-3 py-2 text-sm font-bold text-white hover:bg-red-400"
                >
                  Reject + Remove
                </button>

                <button
                  onClick={() => convertRequestToOrder(request)}
                  className="rounded-xl bg-yellow-400 px-3 py-2 text-sm font-bold text-black hover:bg-yellow-300"
                >
                  Convert to Pending Order
                </button>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <AdminProductManager />

      <Panel
        title="Users & Credits"
        subtitle="Search users, edit usernames, update credits, and view each user's order history."
      >
        <input
          className="mt-5 w-full rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder="Search user by username, email, or role..."
          value={userSearch}
          onChange={(e) => setUserSearch(e.target.value)}
        />

        <div className="mt-5 grid gap-4">
          {filteredProfiles.length === 0 && (
            <EmptyState text="No users found." />
          )}

          {filteredProfiles.map((profile) => (
            <div
              key={profile.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">
                    {profile.username || "No username"}
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    {profile.email}
                  </p>
                  <p className="mt-1 text-sm text-zinc-500">
                    Role: {profile.role}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <input
                    className="w-40 rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
                    placeholder="Username"
                    value={usernameInputs[profile.id] ?? ""}
                    onChange={(e) =>
                      setUsernameInputs((prev) => ({
                        ...prev,
                        [profile.id]: e.target.value,
                      }))
                    }
                  />

                  <button
                    onClick={() => updateUsername(profile.id)}
                    className="rounded-xl bg-zinc-800 px-4 py-3 text-sm font-semibold hover:bg-zinc-700"
                  >
                    Save Name
                  </button>

                  <input
                    className="w-32 rounded-xl bg-zinc-800 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
                    type="number"
                    min="0"
                    step="0.01"
                    value={profile.credits ?? 0}
                    onChange={(e) =>
                      updateCredits(profile.id, Number(e.target.value))
                    }
                  />

                  <span className="text-sm text-zinc-400">credits</span>

                  <button
                    onClick={() => setSelectedProfileId(profile.id)}
                    className="rounded-xl bg-yellow-400 px-4 py-3 text-sm font-bold text-black hover:bg-yellow-300"
                  >
                    View History
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {selectedProfile && (
        <Panel
          title={`Profile History: ${
            selectedProfile.username || selectedProfile.email
          }`}
          subtitle="Admin view of this user's active, completed, rejected, and archived orders."
        >
          <button
            onClick={() => setSelectedProfileId("")}
            className="mt-4 rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
          >
            Close Profile History
          </button>

          <div className="mt-5 grid gap-5">
            {selectedProfileOrders.length === 0 && (
              <EmptyState text="This user has no orders yet." />
            )}

            {selectedProfileOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                userLabel={getUserLabel(order.user_id)}
                messages={messages}
                currentUserId={currentUserId}
                chatInputs={chatInputs}
                setChatInputs={setChatInputs}
                sendAdminMessage={sendAdminMessage}
                updateStatus={updateStatus}
                updateOrderDetails={updateOrderDetails}
                deleteOrder={deleteOrder}
                archiveCompletedOrder={archiveCompletedOrder}
                restoreArchivedOrder={restoreArchivedOrder}
                formatDate={formatDate}
                showArchiveControls
              />
            ))}
          </div>
        </Panel>
      )}

      <Panel
        title="Active Orders"
        subtitle="Search, filter, edit, delete, update status, chat, and archive completed orders."
      >
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <input
            className="rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
            placeholder="Search orders by username, email, service, rank, notes, or status..."
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
            <EmptyState text="No matching active orders found." />
          )}

          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              userLabel={getUserLabel(order.user_id)}
              messages={messages}
              currentUserId={currentUserId}
              chatInputs={chatInputs}
              setChatInputs={setChatInputs}
              sendAdminMessage={sendAdminMessage}
              updateStatus={updateStatus}
              updateOrderDetails={updateOrderDetails}
              deleteOrder={deleteOrder}
              archiveCompletedOrder={archiveCompletedOrder}
              restoreArchivedOrder={restoreArchivedOrder}
              formatDate={formatDate}
              showArchiveControls
            />
          ))}
        </div>
      </Panel>
    </PageShell>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
  danger = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  danger?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
      <p className="text-sm text-zinc-400">{label}</p>
      <h2
        className={`mt-2 text-4xl font-bold ${
          danger
            ? "text-red-400"
            : highlight
            ? "text-yellow-400"
            : "text-white"
        }`}
      >
        {value}
      </h2>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
      {children}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-6 text-zinc-400">
      {text}
    </div>
  );
}

function StatusCard({ label, status }: { label: string; status: string }) {
  return (
    <div className="h-fit rounded-xl border border-zinc-800 bg-zinc-900 p-4">
      <p className="text-xs text-zinc-500">{label}</p>
      <div className="mt-2">
        <StatusBadge status={status} />
      </div>
    </div>
  );
}

function DateGrid({
  createdAt,
  updatedAt,
  completedAt,
  formatDate,
}: {
  createdAt: string;
  updatedAt: string | null;
  completedAt: string | null;
  formatDate: (date: string | null) => string;
}) {
  return (
    <div className="mt-4 grid gap-3 text-sm text-zinc-400 md:grid-cols-3">
      <DateBox label="Created" value={formatDate(createdAt)} />
      <DateBox label="Last Updated" value={formatDate(updatedAt)} />
      <DateBox label="Completed" value={formatDate(completedAt)} />
    </div>
  );
}

function DateBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1">{value}</p>
    </div>
  );
}

function OrderCard({
  order,
  userLabel,
  messages,
  currentUserId,
  chatInputs,
  setChatInputs,
  sendAdminMessage,
  updateStatus,
  updateOrderDetails,
  deleteOrder,
  archiveCompletedOrder,
  restoreArchivedOrder,
  formatDate,
  showArchiveControls,
}: {
  order: Order;
  userLabel: string;
  messages: Message[];
  currentUserId: string;
  chatInputs: Record<string, string>;
  setChatInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  sendAdminMessage: (orderId: string) => Promise<void>;
  updateStatus: (orderId: string, status: string) => Promise<void>;
  updateOrderDetails: (orderId: string, data: OrderEditData) => Promise<void>;
  deleteOrder: (order: Order) => Promise<void>;
  archiveCompletedOrder: (orderId: string) => Promise<void>;
  restoreArchivedOrder: (orderId: string) => Promise<void>;
  formatDate: (date: string | null) => string;
  showArchiveControls?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<OrderEditData>({
    service_type: order.service_type,
    current_rank: order.current_rank ?? "",
    target_rank: order.target_rank ?? "",
    notes: order.notes ?? "",
    status: order.status,
  });

  const orderMessages = messages.filter(
    (message) => message.order_id === order.id
  );

  async function saveEdit() {
    await updateOrderDetails(order.id, editData);
    setEditing(false);
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div className="w-full">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-lg font-bold">{order.service_type}</p>
            <StatusBadge status={order.status} />

            {order.admin_archived && (
              <span className="rounded-full border border-zinc-600 bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                archived
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-zinc-400">User: {userLabel}</p>

          <p className="text-sm text-zinc-400">
            {order.current_rank || "N/A"} → {order.target_rank || "N/A"}
          </p>

          <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-300">
            Notes: {order.notes || "None"}
          </p>

          <DateGrid
            createdAt={order.created_at}
            updatedAt={order.updated_at}
            completedAt={order.completed_at}
            formatDate={formatDate}
          />
        </div>

        <StatusCard label="Current Status" status={order.status} />
      </div>

      {editing && (
        <div className="mt-5 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-5">
          <h4 className="font-bold text-yellow-300">Edit Order</h4>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <input
              className="rounded-xl bg-zinc-900 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Service type"
              value={editData.service_type}
              onChange={(e) =>
                setEditData((prev) => ({
                  ...prev,
                  service_type: e.target.value,
                }))
              }
            />

            <select
              className="rounded-xl bg-zinc-900 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              value={editData.status}
              onChange={(e) =>
                setEditData((prev) => ({
                  ...prev,
                  status: e.target.value,
                }))
              }
            >
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

            <input
              className="rounded-xl bg-zinc-900 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Current value"
              value={editData.current_rank}
              onChange={(e) =>
                setEditData((prev) => ({
                  ...prev,
                  current_rank: e.target.value,
                }))
              }
            />

            <input
              className="rounded-xl bg-zinc-900 p-3 outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Target value"
              value={editData.target_rank}
              onChange={(e) =>
                setEditData((prev) => ({
                  ...prev,
                  target_rank: e.target.value,
                }))
              }
            />

            <textarea
              className="min-h-24 rounded-xl bg-zinc-900 p-3 outline-none focus:ring-2 focus:ring-yellow-400 md:col-span-2"
              placeholder="Notes"
              value={editData.notes}
              onChange={(e) =>
                setEditData((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={saveEdit}
              className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
            >
              Save Order
            </button>

            <button
              onClick={() => setEditing(false)}
              className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

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

        <button
          onClick={() => setEditing((prev) => !prev)}
          className="rounded-xl bg-blue-500 px-3 py-2 text-sm font-bold text-white hover:bg-blue-400"
        >
          {editing ? "Close Edit" : "Edit Order"}
        </button>

        <button
          onClick={() => deleteOrder(order)}
          className="rounded-xl bg-red-700 px-3 py-2 text-sm font-bold text-white hover:bg-red-600"
        >
          Delete Order
        </button>

        {showArchiveControls &&
          order.status === "completed" &&
          !order.admin_archived && (
            <button
              onClick={() => archiveCompletedOrder(order.id)}
              className="rounded-xl bg-red-500 px-3 py-2 text-sm font-bold text-white hover:bg-red-400"
            >
              Remove from Active
            </button>
          )}

        {showArchiveControls && order.admin_archived && (
          <button
            onClick={() => restoreArchivedOrder(order.id)}
            className="rounded-xl bg-blue-500 px-3 py-2 text-sm font-bold text-white hover:bg-blue-400"
          >
            Restore to Active
          </button>
        )}
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
}