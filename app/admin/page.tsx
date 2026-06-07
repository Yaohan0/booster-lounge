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
  const [serviceType, setServiceType] = useState("Coaching Session");
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

    if (profileData) setProfiles(profileData);
    if (orderData) setOrders(orderData);
    if (requestData) setRequests(requestData);
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
      admin_archived: false,
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
        order.id === orderId
          ? {
              ...order,
              ...updateData,
            }
          : order
      )
    );
  }

  async function archiveCompletedOrder(orderId: string) {
    const confirmed = confirm(
      "Remove this completed order from the active admin list? The user will still see it in their completed history."
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

  async function deleteRejectedOrder(orderId: string) {
    const confirmed = confirm(
      "Delete this rejected order permanently? This cannot be undone."
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", orderId)
      .eq("status", "rejected");

    if (error) {
      alert(error.message);
      return;
    }

    setOrders((prev) => prev.filter((order) => order.id !== orderId));
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

  async function updateRequestStatus(requestId: string, status: string) {
    const { error } = await supabase
      .from("order_requests")
      .update({ status })
      .eq("id", requestId);

    if (error) {
      alert(error.message);
      return;
    }

    setRequests((prev) =>
      prev.map((request) =>
        request.id === requestId
          ? {
              ...request,
              status,
              updated_at: new Date().toISOString(),
            }
          : request
      )
    );
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
    });

    if (orderError) {
      alert(orderError.message);
      return;
    }

    const { error: requestError } = await supabase
      .from("order_requests")
      .update({ status: "converted_to_order" })
      .eq("id", request.id);

    if (requestError) {
      alert(requestError.message);
      return;
    }

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

  const filteredRequests = requests.filter((request) => {
    const user = profiles.find((profile) => profile.id === request.user_id);
    const search = requestSearch.toLowerCase();

    return (
      user?.email?.toLowerCase().includes(search) ||
      request.service_type.toLowerCase().includes(search) ||
      request.current_rank?.toLowerCase().includes(search) ||
      request.target_rank?.toLowerCase().includes(search) ||
      request.notes?.toLowerCase().includes(search) ||
      request.status.toLowerCase().includes(search)
    );
  });

  const activeOrders = orders.filter((order) => order.admin_archived !== true);

  const filteredOrders = activeOrders.filter((order) => {
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
      subtitle="Assign orders, review requests, manage credits, delete rejected orders, and view completed boost history."
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
        <StatCard label="Requests" value={requests.length} />
        <StatCard label="Completed" value={completedOrders.length} />
        <StatCard label="Rejected" value={rejectedOrders.length} danger />
        <StatCard label="Archived" value={archivedOrders.length} highlight />
      </div>

      <Panel
        title="Assign New Order"
        subtitle="Create a new active order and assign it to a normal user."
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
              <option>Rank Boost</option>
              <option>Trophy Boost</option>
              <option>Prestige Icon</option>
              <option>Brawlers Rank</option>
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
        subtitle="Review service requests submitted from the services page."
      >
        <input
          className="mt-5 w-full rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder="Search requests by user, service, rank, notes, or status..."
          value={requestSearch}
          onChange={(e) => setRequestSearch(e.target.value)}
        />

        <div className="mt-5 grid gap-5">
          {filteredRequests.length === 0 && (
            <EmptyState text="No incoming requests found." />
          )}

          {filteredRequests.map((request) => {
            const user = profiles.find(
              (profile) => profile.id === request.user_id
            );

            return (
              <div
                key={request.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5"
              >
                <div className="flex flex-col justify-between gap-5 md:flex-row">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-lg font-bold">
                        {request.service_type}
                      </p>
                      <StatusBadge status={request.status} />
                    </div>

                    <p className="mt-2 text-sm text-zinc-400">
                      User: {user?.email || request.user_id}
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
                  <RequestButton
                    label="pending"
                    active={request.status === "pending"}
                    onClick={() => updateRequestStatus(request.id, "pending")}
                  />

                  <RequestButton
                    label="accept"
                    active={request.status === "accepted"}
                    onClick={() => updateRequestStatus(request.id, "accepted")}
                    variant="green"
                  />

                  <RequestButton
                    label="reject"
                    active={request.status === "rejected"}
                    onClick={() => updateRequestStatus(request.id, "rejected")}
                    variant="red"
                  />

                  <button
                    onClick={() => convertRequestToOrder(request)}
                    disabled={request.status === "converted_to_order"}
                    className="rounded-xl bg-yellow-400 px-3 py-2 text-sm font-bold text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Convert to Order
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel
        title="Users & Credits"
        subtitle="Search users, update credits, and view each user's boost history."
      >
        <input
          className="mt-5 w-full rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
          placeholder="Search user by email..."
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
                  <p className="font-semibold">{profile.email}</p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Role: {profile.role}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
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

                  <button
                    onClick={() => setSelectedProfileId(profile.id)}
                    className="rounded-xl bg-zinc-800 px-4 py-3 text-sm font-semibold hover:bg-zinc-700"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Panel>

      {selectedProfile && (
        <Panel
          title={`Profile History: ${selectedProfile.email}`}
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
                userEmail={selectedProfile.email || order.user_id}
                messages={messages}
                currentUserId={currentUserId}
                chatInputs={chatInputs}
                setChatInputs={setChatInputs}
                sendAdminMessage={sendAdminMessage}
                updateStatus={updateStatus}
                archiveCompletedOrder={archiveCompletedOrder}
                restoreArchivedOrder={restoreArchivedOrder}
                deleteRejectedOrder={deleteRejectedOrder}
                formatDate={formatDate}
                showArchiveControls
              />
            ))}
          </div>
        </Panel>
      )}

      <Panel
        title="Active Orders"
        subtitle="Search, filter, update status, chat, archive completed orders, and delete rejected orders."
      >
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
            <EmptyState text="No matching active orders found." />
          )}

          {filteredOrders.map((order) => {
            const user = profiles.find((p) => p.id === order.user_id);

            return (
              <OrderCard
                key={order.id}
                order={order}
                userEmail={user?.email || order.user_id}
                messages={messages}
                currentUserId={currentUserId}
                chatInputs={chatInputs}
                setChatInputs={setChatInputs}
                sendAdminMessage={sendAdminMessage}
                updateStatus={updateStatus}
                archiveCompletedOrder={archiveCompletedOrder}
                restoreArchivedOrder={restoreArchivedOrder}
                deleteRejectedOrder={deleteRejectedOrder}
                formatDate={formatDate}
                showArchiveControls
              />
            );
          })}
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

function RequestButton({
  label,
  active,
  onClick,
  variant = "yellow",
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  variant?: "yellow" | "green" | "red";
}) {
  const activeClasses = {
    yellow: "bg-yellow-400 text-black",
    green: "bg-green-400 text-black",
    red: "bg-red-400 text-black",
  };

  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm ${
        active
          ? `${activeClasses[variant]} font-bold`
          : "bg-zinc-800 text-white hover:bg-zinc-700"
      }`}
    >
      {label}
    </button>
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
      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
        <p className="text-xs text-zinc-500">Created</p>
        <p className="mt-1">{formatDate(createdAt)}</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
        <p className="text-xs text-zinc-500">Last Updated</p>
        <p className="mt-1">{formatDate(updatedAt)}</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-3">
        <p className="text-xs text-zinc-500">Completed</p>
        <p className="mt-1">{formatDate(completedAt)}</p>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  userEmail,
  messages,
  currentUserId,
  chatInputs,
  setChatInputs,
  sendAdminMessage,
  updateStatus,
  archiveCompletedOrder,
  restoreArchivedOrder,
  deleteRejectedOrder,
  formatDate,
  showArchiveControls,
}: {
  order: Order;
  userEmail: string;
  messages: Message[];
  currentUserId: string;
  chatInputs: Record<string, string>;
  setChatInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  sendAdminMessage: (orderId: string) => Promise<void>;
  updateStatus: (orderId: string, status: string) => Promise<void>;
  archiveCompletedOrder: (orderId: string) => Promise<void>;
  restoreArchivedOrder: (orderId: string) => Promise<void>;
  deleteRejectedOrder: (orderId: string) => Promise<void>;
  formatDate: (date: string | null) => string;
  showArchiveControls?: boolean;
}) {
  const orderMessages = messages.filter(
    (message) => message.order_id === order.id
  );

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-lg font-bold">{order.service_type}</p>
            <StatusBadge status={order.status} />

            {order.admin_archived && (
              <span className="rounded-full border border-zinc-600 bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                archived
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-zinc-400">User: {userEmail}</p>

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

        {showArchiveControls && order.status === "rejected" && (
          <button
            onClick={() => deleteRejectedOrder(order.id)}
            className="rounded-xl bg-red-700 px-3 py-2 text-sm font-bold text-white hover:bg-red-600"
          >
            Delete Rejected
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