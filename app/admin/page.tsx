"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import StatusBadge from "@/components/StatusBadge";

type Profile = {
  id: string;
  email: string | null;
  username: string | null;
  role: string | null;
  credits: number | null;
  created_at?: string;
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

type Message = {
  id: string;
  order_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

type AdminTab = "overview" | "requests" | "orders" | "users";

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
  const [requests, setRequests] = useState<OrderRequest[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const [activeTab, setActiveTab] = useState<AdminTab>("overview");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [selectedUserId, setSelectedUserId] = useState("");
  const [serviceType, setServiceType] = useState("Rank Boost");
  const [currentRank, setCurrentRank] = useState("");
  const [targetRank, setTargetRank] = useState("");
  const [notes, setNotes] = useState("");

  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [chatInputs, setChatInputs] = useState<Record<string, string>>({});
  const [creditInputs, setCreditInputs] = useState<Record<string, string>>({});
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
      await refreshAdminData();
      setLoading(false);
    }

    loadAdminData();
  }, [router, supabase]);

  async function refreshAdminData() {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, username, role, credits, created_at")
      .order("created_at", { ascending: false });

    if (profileError) {
      alert(profileError.message);
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

    setProfiles((profileData ?? []) as Profile[]);
    setRequests((requestData ?? []) as OrderRequest[]);
    setOrders((orderData ?? []) as Order[]);
    setMessages((messageData ?? []) as Message[]);

    const nextCreditInputs: Record<string, string> = {};
    const nextUsernameInputs: Record<string, string> = {};

    (profileData ?? []).forEach((profile) => {
      nextCreditInputs[profile.id] = String(profile.credits ?? 0);
      nextUsernameInputs[profile.id] = profile.username ?? "";
    });

    setCreditInputs(nextCreditInputs);
    setUsernameInputs(nextUsernameInputs);
  }

  function formatDate(date: string | null) {
    if (!date) return "N/A";

    return new Intl.DateTimeFormat("en-SG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  }

  function getUser(userId: string) {
    return profiles.find((profile) => profile.id === userId);
  }

  function getUserLabel(userId: string) {
    const profile = getUser(userId);

    if (!profile) return userId;

    return `${profile.username || "No username"} • ${
      profile.email || "No email"
    }`;
  }

  function matchesSearch(text: string) {
    return text.toLowerCase().includes(search.toLowerCase());
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  async function createManualOrder(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedUserId) {
      alert("Select a user first.");
      return;
    }

    if (!serviceType.trim()) {
      alert("Service type is required.");
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
    setServiceType("Rank Boost");
    setCurrentRank("");
    setTargetRank("");
    setNotes("");

    await refreshAdminData();
  }

  async function convertRequestToOrder(request: OrderRequest) {
    const { error: orderError } = await supabase.from("orders").insert({
      user_id: request.user_id,
      service_type: request.service_type,
      current_rank: request.current_rank,
      target_rank: request.target_rank,
      notes: request.notes,
      status: "accepted",
      user_seen_update: false,
      admin_archived: false,
    });

    if (orderError) {
      alert(orderError.message);
      return;
    }

    const { error: requestError } = await supabase
      .from("order_requests")
      .update({
        status: "converted_to_order",
        admin_notes:
          adminNotes[request.id]?.trim() ||
          "Request accepted and converted to order.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", request.id);

    if (requestError) {
      alert(requestError.message);
      return;
    }

    await refreshAdminData();
  }

  async function rejectRequest(requestId: string) {
    const { error } = await supabase
      .from("order_requests")
      .update({
        status: "rejected",
        admin_notes:
          adminNotes[requestId]?.trim() || "Request rejected by admin.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", requestId);

    if (error) {
      alert(error.message);
      return;
    }

    await refreshAdminData();
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

    await refreshAdminData();
  }

  async function updateOrderStatus(order: Order, status: string) {
    const updateData: Partial<Order> = {
      status,
      updated_at: new Date().toISOString(),
      user_seen_update: false,
    };

    if (status === "completed") {
      updateData.completed_at = new Date().toISOString();
      updateData.admin_archived = true;
    }

    const { error } = await supabase
      .from("orders")
      .update(updateData)
      .eq("id", order.id);

    if (error) {
      alert(error.message);
      return;
    }

    await refreshAdminData();
  }

  async function saveOrder(order: Order) {
    const { error } = await supabase
      .from("orders")
      .update({
        service_type: order.service_type,
        current_rank: order.current_rank,
        target_rank: order.target_rank,
        notes: order.notes,
        updated_at: new Date().toISOString(),
        user_seen_update: false,
      })
      .eq("id", order.id);

    if (error) {
      alert(error.message);
      return;
    }

    await refreshAdminData();
  }

  async function deleteOrder(orderId: string) {
    const confirmed = confirm(
      "Delete this order permanently? Completed order history will be removed too."
    );

    if (!confirmed) return;

    const { error: messageError } = await supabase
      .from("messages")
      .delete()
      .eq("order_id", orderId);

    if (messageError) {
      alert(messageError.message);
      return;
    }

    const { error } = await supabase.from("orders").delete().eq("id", orderId);

    if (error) {
      alert(error.message);
      return;
    }

    await refreshAdminData();
  }

  async function archiveOrder(orderId: string) {
    const { error } = await supabase
      .from("orders")
      .update({ admin_archived: true })
      .eq("id", orderId);

    if (error) {
      alert(error.message);
      return;
    }

    await refreshAdminData();
  }

  async function updateCredits(userId: string) {
    const credits = Number(creditInputs[userId] ?? 0);

    const { error } = await supabase
      .from("profiles")
      .update({ credits })
      .eq("id", userId);

    if (error) {
      alert(error.message);
      return;
    }

    await refreshAdminData();
  }

  async function updateUsername(userId: string) {
    const username = usernameInputs[userId]?.trim() || null;

    const { error } = await supabase
      .from("profiles")
      .update({ username })
      .eq("id", userId);

    if (error) {
      alert(error.message);
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

    await refreshAdminData();
  }

  const pendingRequests = requests.filter(
    (request) => request.status === "pending"
  );

  const processedRequests = requests.filter(
    (request) => request.status !== "pending"
  );

  const visibleOrders = orders.filter((order) => !order.admin_archived);
  const completedOrders = orders.filter((order) => order.status === "completed");

  const filteredRequests = pendingRequests.filter((request) => {
    const user = getUserLabel(request.user_id);

    return matchesSearch(
      `${user} ${request.service_type} ${request.current_rank} ${request.target_rank} ${request.notes}`
    );
  });

  const filteredOrders = visibleOrders.filter((order) => {
    const user = getUserLabel(order.user_id);
    const statusMatch = statusFilter === "all" || order.status === statusFilter;

    return (
      statusMatch &&
      matchesSearch(
        `${user} ${order.service_type} ${order.current_rank} ${order.target_rank} ${order.notes} ${order.status}`
      )
    );
  });

  const filteredProfiles = profiles.filter((profile) =>
    matchesSearch(`${profile.username} ${profile.email} ${profile.role}`)
  );

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
      subtitle="Review requests, create orders, manage users, update credits, and chat with customers."
      rightAction={
        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-xl border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-200 hover:bg-zinc-900"
          >
            User Dashboard
          </Link>

          <button
            onClick={logout}
            className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
          >
            Logout
          </button>
        </div>
      }
    >
      <section className="grid gap-4 md:grid-cols-5">
        <StatCard label="Users" value={profiles.length} />
        <StatCard label="Pending Requests" value={pendingRequests.length} />
        <StatCard label="Active Orders" value={visibleOrders.length} />
        <StatCard label="Completed" value={completedOrders.length} />
        <StatCard label="Processed Requests" value={processedRequests.length} />
      </section>

      <section className="mt-8 flex flex-wrap gap-2">
        <TabButton
          label="Overview"
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
        />
        <TabButton
          label={`Requests (${pendingRequests.length})`}
          active={activeTab === "requests"}
          onClick={() => setActiveTab("requests")}
        />
        <TabButton
          label={`Orders (${visibleOrders.length})`}
          active={activeTab === "orders"}
          onClick={() => setActiveTab("orders")}
        />
        <TabButton
          label={`Users (${profiles.length})`}
          active={activeTab === "users"}
          onClick={() => setActiveTab("users")}
        />
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2">
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
              {status.replace("_", " ")}
            </option>
          ))}
        </select>
      </section>

      {activeTab === "overview" && (
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <Panel title="Create / Assign Manual Order">
            <ManualOrderForm
              profiles={profiles}
              selectedUserId={selectedUserId}
              setSelectedUserId={setSelectedUserId}
              serviceType={serviceType}
              setServiceType={setServiceType}
              currentRank={currentRank}
              setCurrentRank={setCurrentRank}
              targetRank={targetRank}
              setTargetRank={setTargetRank}
              notes={notes}
              setNotes={setNotes}
              createManualOrder={createManualOrder}
            />
          </Panel>

          <Panel title="Incoming Requests">
            <div className="mt-5 grid gap-4">
              {pendingRequests.slice(0, 3).map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  userLabel={getUserLabel(request.user_id)}
                  adminNote={adminNotes[request.id] ?? ""}
                  setAdminNote={(value) =>
                    setAdminNotes((prev) => ({
                      ...prev,
                      [request.id]: value,
                    }))
                  }
                  formatDate={formatDate}
                  onConvert={() => convertRequestToOrder(request)}
                  onReject={() => rejectRequest(request.id)}
                  onDelete={() => deleteRequest(request.id)}
                />
              ))}

              {pendingRequests.length === 0 && (
                <EmptyState text="No pending requests." />
              )}

              {pendingRequests.length > 3 && (
                <button
                  onClick={() => setActiveTab("requests")}
                  className="rounded-xl bg-zinc-800 px-4 py-3 text-sm font-semibold hover:bg-zinc-700"
                >
                  View all requests
                </button>
              )}
            </div>
          </Panel>
        </section>
      )}

      {activeTab === "requests" && (
        <section className="mt-8">
          <SectionHeader
            title="Pending Requests"
            subtitle="Accepting converts the request into an order. Rejected or converted requests leave this list."
          />

          <div className="mt-6 grid gap-5">
            {filteredRequests.length === 0 && (
              <EmptyState text="No matching pending requests." />
            )}

            {filteredRequests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                userLabel={getUserLabel(request.user_id)}
                adminNote={adminNotes[request.id] ?? ""}
                setAdminNote={(value) =>
                  setAdminNotes((prev) => ({
                    ...prev,
                    [request.id]: value,
                  }))
                }
                formatDate={formatDate}
                onConvert={() => convertRequestToOrder(request)}
                onReject={() => rejectRequest(request.id)}
                onDelete={() => deleteRequest(request.id)}
              />
            ))}
          </div>

          <SectionHeader
            title="Processed Requests"
            subtitle="Rejected and converted requests are kept here for reference."
            className="mt-10"
          />

          <div className="mt-6 grid gap-5">
            {processedRequests.length === 0 && (
              <EmptyState text="No processed requests yet." />
            )}

            {processedRequests.map((request) => (
              <ProcessedRequestCard
                key={request.id}
                request={request}
                userLabel={getUserLabel(request.user_id)}
                formatDate={formatDate}
                onDelete={() => deleteRequest(request.id)}
              />
            ))}
          </div>
        </section>
      )}

      {activeTab === "orders" && (
        <section className="mt-8">
          <SectionHeader
            title="Orders"
            subtitle="Edit, update status, archive, delete, and chat with users."
          />

          <div className="mt-6 grid gap-5">
            {filteredOrders.length === 0 && (
              <EmptyState text="No matching active admin orders." />
            )}

            {filteredOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                setOrders={setOrders}
                userLabel={getUserLabel(order.user_id)}
                messages={messages}
                currentUserId={currentUserId}
                chatInput={chatInputs[order.id] ?? ""}
                setChatInput={(value) =>
                  setChatInputs((prev) => ({ ...prev, [order.id]: value }))
                }
                sendMessage={() => sendAdminMessage(order.id)}
                updateStatus={(status) => updateOrderStatus(order, status)}
                saveOrder={saveOrder}
                deleteOrder={() => deleteOrder(order.id)}
                archiveOrder={() => archiveOrder(order.id)}
                formatDate={formatDate}
              />
            ))}
          </div>
        </section>
      )}

      {activeTab === "users" && (
        <section className="mt-8">
          <SectionHeader
            title="Users"
            subtitle="Update usernames and credits. Use usernames to track customers more easily."
          />

          <div className="mt-6 grid gap-5">
            {filteredProfiles.map((profile) => (
              <UserCard
                key={profile.id}
                profile={profile}
                orders={orders.filter((order) => order.user_id === profile.id)}
                usernameValue={usernameInputs[profile.id] ?? ""}
                setUsernameValue={(value) =>
                  setUsernameInputs((prev) => ({
                    ...prev,
                    [profile.id]: value,
                  }))
                }
                creditValue={creditInputs[profile.id] ?? "0"}
                setCreditValue={(value) =>
                  setCreditInputs((prev) => ({
                    ...prev,
                    [profile.id]: value,
                  }))
                }
                updateUsername={() => updateUsername(profile.id)}
                updateCredits={() => updateCredits(profile.id)}
              />
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}

function ManualOrderForm({
  profiles,
  selectedUserId,
  setSelectedUserId,
  serviceType,
  setServiceType,
  currentRank,
  setCurrentRank,
  targetRank,
  setTargetRank,
  notes,
  setNotes,
  createManualOrder,
}: {
  profiles: Profile[];
  selectedUserId: string;
  setSelectedUserId: (value: string) => void;
  serviceType: string;
  setServiceType: (value: string) => void;
  currentRank: string;
  setCurrentRank: (value: string) => void;
  targetRank: string;
  setTargetRank: (value: string) => void;
  notes: string;
  setNotes: (value: string) => void;
  createManualOrder: (e: React.FormEvent) => Promise<void>;
}) {
  return (
    <form onSubmit={createManualOrder} className="mt-5 grid gap-4">
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

      <button className="rounded-xl bg-yellow-400 p-3 font-bold text-black hover:bg-yellow-300">
        Assign Order
      </button>
    </form>
  );
}

function RequestCard({
  request,
  userLabel,
  adminNote,
  setAdminNote,
  formatDate,
  onConvert,
  onReject,
  onDelete,
}: {
  request: OrderRequest;
  userLabel: string;
  adminNote: string;
  setAdminNote: (value: string) => void;
  formatDate: (date: string | null) => string;
  onConvert: () => void;
  onReject: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-bold">{request.service_type}</h3>
            <StatusBadge status={request.status} />
          </div>

          <p className="mt-2 text-sm text-zinc-400">User: {userLabel}</p>
          <p className="mt-1 text-sm text-zinc-400">
            {request.current_rank || "N/A"} → {request.target_rank || "N/A"}
          </p>
          <p className="mt-1 text-xs text-zinc-500">
            Submitted: {formatDate(request.created_at)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={onConvert}
            className="rounded-xl bg-green-500 px-4 py-2 text-sm font-bold text-black hover:bg-green-400"
          >
            Accept → Order
          </button>

          <button
            onClick={onReject}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-400"
          >
            Reject
          </button>

          <button
            onClick={onDelete}
            className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
        <h4 className="font-semibold">Request Details</h4>
        <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-400">
          {request.notes || "No notes."}
        </p>
      </div>

      <textarea
        className="mt-4 min-h-20 w-full rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
        placeholder="Admin note for user..."
        value={adminNote}
        onChange={(e) => setAdminNote(e.target.value)}
      />
    </div>
  );
}

function ProcessedRequestCard({
  request,
  userLabel,
  formatDate,
  onDelete,
}: {
  request: OrderRequest;
  userLabel: string;
  formatDate: (date: string | null) => string;
  onDelete: () => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="font-bold">{request.service_type}</h3>
            <StatusBadge status={request.status} />
          </div>

          <p className="mt-2 text-sm text-zinc-400">User: {userLabel}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Updated: {formatDate(request.updated_at || request.created_at)}
          </p>

          {request.admin_notes && (
            <p className="mt-3 text-sm text-zinc-300">
              Admin note: {request.admin_notes}
            </p>
          )}
        </div>

        <button
          onClick={onDelete}
          className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

function OrderCard({
  order,
  setOrders,
  userLabel,
  messages,
  currentUserId,
  chatInput,
  setChatInput,
  sendMessage,
  updateStatus,
  saveOrder,
  deleteOrder,
  archiveOrder,
  formatDate,
}: {
  order: Order;
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  userLabel: string;
  messages: Message[];
  currentUserId: string;
  chatInput: string;
  setChatInput: (value: string) => void;
  sendMessage: () => void;
  updateStatus: (status: string) => void;
  saveOrder: (order: Order) => void;
  deleteOrder: () => void;
  archiveOrder: () => void;
  formatDate: (date: string | null) => string;
}) {
  const orderMessages = messages.filter(
    (message) => message.order_id === order.id
  );

  function updateLocalField(key: keyof Order, value: string | null) {
    setOrders((prev) =>
      prev.map((item) =>
        item.id === order.id
          ? {
              ...item,
              [key]: value,
            }
          : item
      )
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
      <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-bold">{order.service_type}</h3>
            <StatusBadge status={order.status} />
          </div>

          <p className="mt-2 text-sm text-zinc-400">User: {userLabel}</p>
          <p className="mt-1 text-xs text-zinc-500">
            Created: {formatDate(order.created_at)} • Updated:{" "}
            {formatDate(order.updated_at)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => saveOrder(order)}
            className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
          >
            Save
          </button>

          <button
            onClick={archiveOrder}
            className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
          >
            Archive
          </button>

          <button
            onClick={deleteOrder}
            className="rounded-xl bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-400"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <input
          className="rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
          value={order.service_type}
          onChange={(e) => updateLocalField("service_type", e.target.value)}
          placeholder="Service type"
        />

        <input
          className="rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
          value={order.current_rank ?? ""}
          onChange={(e) => updateLocalField("current_rank", e.target.value)}
          placeholder="Current"
        />

        <input
          className="rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
          value={order.target_rank ?? ""}
          onChange={(e) => updateLocalField("target_rank", e.target.value)}
          placeholder="Target"
        />
      </div>

      <textarea
        className="mt-4 min-h-24 w-full rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
        value={order.notes ?? ""}
        onChange={(e) => updateLocalField("notes", e.target.value)}
        placeholder="Order notes"
      />

      <div className="mt-4 flex flex-wrap gap-2">
        {orderStatuses.map((status) => (
          <button
            key={status}
            onClick={() => updateStatus(status)}
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

      <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Chat</h4>
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
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
          />

          <button
            onClick={sendMessage}
            className="rounded-xl bg-yellow-400 px-5 py-2 text-sm font-bold text-black hover:bg-yellow-300"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function UserCard({
  profile,
  orders,
  usernameValue,
  setUsernameValue,
  creditValue,
  setCreditValue,
  updateUsername,
  updateCredits,
}: {
  profile: Profile;
  orders: Order[];
  usernameValue: string;
  setUsernameValue: (value: string) => void;
  creditValue: string;
  setCreditValue: (value: string) => void;
  updateUsername: () => void;
  updateCredits: () => void;
}) {
  const completedCount = orders.filter(
    (order) => order.status === "completed"
  ).length;

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div>
          <p className="text-lg font-bold">{profile.email}</p>
          <p className="mt-1 text-sm text-zinc-400">Role: {profile.role}</p>
          <p className="mt-1 text-sm text-zinc-400">
            Orders: {orders.length} • Completed: {completedCount}
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div className="flex gap-2">
            <input
              className="rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
              value={usernameValue}
              onChange={(e) => setUsernameValue(e.target.value)}
              placeholder="Username"
            />

            <button
              onClick={updateUsername}
              className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
            >
              Save
            </button>
          </div>

          <div className="flex gap-2">
            <input
              className="rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
              type="number"
              min="0"
              step="0.01"
              value={creditValue}
              onChange={(e) => setCreditValue(e.target.value)}
              placeholder="Credits"
            />

            <button
              onClick={updateCredits}
              className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
            >
              Update
            </button>
          </div>
        </div>
      </div>

      {orders.length > 0 && (
        <div className="mt-5 rounded-xl border border-zinc-800 bg-zinc-950/80 p-4">
          <p className="font-semibold">Order History</p>

          <div className="mt-3 grid gap-2">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex flex-col justify-between gap-2 rounded-xl bg-zinc-900 p-3 text-sm md:flex-row md:items-center"
              >
                <span>
                  {order.service_type}: {order.current_rank || "N/A"} →{" "}
                  {order.target_rank || "N/A"}
                </span>
                <StatusBadge status={order.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
      <p className="text-sm text-zinc-400">{label}</p>
      <h2 className="mt-2 text-3xl font-bold text-yellow-400">{value}</h2>
    </div>
  );
}

function TabButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-2 text-sm font-semibold ${
        active
          ? "bg-yellow-400 text-black"
          : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
      }`}
    >
      {label}
    </button>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
      <h2 className="text-xl font-bold">{title}</h2>
      {children}
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  className = "",
}: {
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <h2 className="text-2xl font-bold">{title}</h2>
      <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center text-zinc-400">
      {text}
    </div>
  );
}