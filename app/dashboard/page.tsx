"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import StatusBadge from "@/components/StatusBadge";

type Order = {
  id: string;
  service_type: string;
  current_rank: string | null;
  target_rank: string | null;
  status: string;
  created_at: string;
  updated_at: string | null;
  completed_at: string | null;
  user_seen_update: boolean | null;
  admin_archived: boolean | null;
  notes?: string | null;
};

type OrderRequest = {
  id: string;
  service_type: string;
  current_rank: string | null;
  target_rank: string | null;
  notes: string | null;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string | null;
};

type Profile = {
  email: string | null;
  username: string | null;
  credits: number | null;
};

type Message = {
  id: string;
  order_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

type DashboardTab = "overview" | "orders" | "requests" | "history";

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<OrderRequest[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [usernameDraft, setUsernameDraft] = useState("");
  const [credits, setCredits] = useState(0);
  const [profileMessage, setProfileMessage] = useState("");
  const [resetMessage, setResetMessage] = useState("");

  const [chatInputs, setChatInputs] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState("");

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [expandedRequestId, setExpandedRequestId] = useState<string | null>(
    null
  );

  const [chatWidgetOpen, setChatWidgetOpen] = useState(false);
  const [selectedChatOrderId, setSelectedChatOrderId] = useState<string | null>(
    null
  );

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      setEmail(user.email ?? "");
      setCurrentUserId(user.id);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("email, username, credits")
        .eq("id", user.id)
        .single();

      if (!profileError && profile) {
        const userProfile = profile as Profile;
        setUsername(userProfile.username ?? "");
        setUsernameDraft(userProfile.username ?? "");
        setCredits(Number(userProfile.credits ?? 0));
      }

      const { data: requestData, error: requestError } = await supabase
        .from("order_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (requestError) {
        console.error(requestError.message);
        setLoading(false);
        return;
      }

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (orderError) {
        console.error(orderError.message);
        setLoading(false);
        return;
      }

      const { data: messageData, error: messageError } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (messageError) {
        console.error(messageError.message);
        setLoading(false);
        return;
      }

      setRequests((requestData ?? []) as OrderRequest[]);
      setOrders((orderData ?? []) as Order[]);
      setMessages((messageData ?? []) as Message[]);
      setLoading(false);
    }

    loadData();
  }, [router, supabase]);

  function formatDate(date: string | null) {
    if (!date) return "N/A";

    return new Intl.DateTimeFormat("en-SG", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date));
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/");
  }

  async function updateOwnUsername() {
    const cleanUsername = usernameDraft.trim();

    if (!cleanUsername) {
      alert("Username cannot be empty.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({ username: cleanUsername })
      .eq("id", currentUserId);

    if (error) {
      alert(error.message);
      return;
    }

    setUsername(cleanUsername);
    setProfileMessage("Username updated.");
  }

  async function sendPasswordResetEmail() {
    if (!email) {
      alert("No email found for this account.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      alert(error.message);
      return;
    }

    setResetMessage("Password reset email sent. Check your inbox.");
  }

  async function markOrderUpdateRead(orderId: string) {
    const { error } = await supabase
      .from("orders")
      .update({ user_seen_update: true })
      .eq("id", orderId);

    if (error) {
      alert(error.message);
      return;
    }

    setOrders((prev) =>
      prev.map((order) =>
        order.id === orderId ? { ...order, user_seen_update: true } : order
      )
    );
  }

  async function markAllRead() {
    const unreadIds = orders
      .filter((order) => order.user_seen_update === false)
      .map((order) => order.id);

    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("orders")
      .update({ user_seen_update: true })
      .in("id", unreadIds);

    if (error) {
      alert(error.message);
      return;
    }

    setOrders((prev) =>
      prev.map((order) =>
        unreadIds.includes(order.id)
          ? { ...order, user_seen_update: true }
          : order
      )
    );
  }

  async function sendMessage(orderId: string) {
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

  const activeOrders = orders.filter((order) => order.status !== "completed");
  const completedOrders = orders.filter((order) => order.status === "completed");
  const unreadOrders = orders.filter(
    (order) => order.user_seen_update === false
  );
  const pendingRequests = requests.filter(
    (request) => request.status === "pending"
  );

  const latestOrders = [...orders]
    .sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at).getTime();
      const dateB = new Date(b.updated_at || b.created_at).getTime();
      return dateB - dateA;
    })
    .slice(0, 3);

  const latestRequests = [...requests]
    .sort((a, b) => {
      const dateA = new Date(a.updated_at || a.created_at).getTime();
      const dateB = new Date(b.updated_at || b.created_at).getTime();
      return dateB - dateA;
    })
    .slice(0, 3);

  if (loading) {
    return (
      <PageShell
        title="Dashboard"
        subtitle="Loading your requests, orders, credits, and messages."
      >
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 text-zinc-400">
          Loading dashboard...
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell
      title="Dashboard"
      subtitle="Track your requests, orders, credits, completed history, and admin chat."
      rightAction={
        <div className="flex flex-wrap gap-3">
          <Link
            href="/services"
            className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
          >
            New Request
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
      <section className="grid gap-4 md:grid-cols-4">
        <QuickLinkCard
          title="Services"
          description="Rank boost, trophy boost, coaching, and custom requests."
          href="/services"
        />

        <QuickLinkCard
          title="Accounts"
          description="Browse account listings and submit purchase requests."
          href="/accounts"
        />

        <QuickLinkCard
          title="Pins"
          description="Browse exclusive pin listings."
          href="/pins"
        />

        <QuickLinkCard
          title="Offers"
          description="View limited bundles and special deals."
          href="/offers"
        />
      </section>

      {unreadOrders.length > 0 && (
        <div className="mt-8 rounded-2xl border border-yellow-400/40 bg-yellow-400/10 p-5">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-yellow-400 text-xl text-black">
                🔔
              </div>

              <div>
                <h2 className="font-bold text-yellow-300">
                  Unread Order Updates
                </h2>
                <p className="text-sm text-zinc-300">
                  You have {unreadOrders.length} unread update
                  {unreadOrders.length === 1 ? "" : "s"}.
                </p>
              </div>
            </div>

            <button
              onClick={markAllRead}
              className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
            >
              Mark all as read
            </button>
          </div>
        </div>
      )}

      <section className="mt-8 grid gap-4 md:grid-cols-5">
        <StatCard
          label="User"
          value={username || email || "N/A"}
          subValue={username ? email : undefined}
          small
        />

        <StatCard label="Credits" value={`$${credits.toFixed(2)}`} highlight />
        <StatCard label="Requests" value={requests.length} />
        <StatCard label="Active Orders" value={activeOrders.length} />
        <StatCard label="Completed" value={completedOrders.length} />
      </section>

      <section className="mt-8">
        <div className="flex flex-wrap gap-2">
          <TabButton
            label="Overview"
            active={activeTab === "overview"}
            onClick={() => setActiveTab("overview")}
          />

          <TabButton
            label={`Active Orders (${activeOrders.length})`}
            active={activeTab === "orders"}
            onClick={() => setActiveTab("orders")}
          />

          <TabButton
            label={`Requests (${requests.length})`}
            active={activeTab === "requests"}
            onClick={() => setActiveTab("requests")}
          />

          <TabButton
            label={`History (${completedOrders.length})`}
            active={activeTab === "history"}
            onClick={() => setActiveTab("history")}
          />
        </div>
      </section>

      {activeTab === "overview" && (
        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <Panel
            title="Recent Orders"
            subtitle="Latest order activity from admin."
            rightAction={
              <button
                onClick={() => setActiveTab("orders")}
                className="text-sm font-semibold text-yellow-300 hover:text-yellow-200"
              >
                View all
              </button>
            }
          >
            <div className="mt-5 grid gap-4">
              {latestOrders.length === 0 && (
                <EmptyState text="No order activity yet." />
              )}

              {latestOrders.map((order) => (
                <CompactOrderCard
                  key={order.id}
                  order={order}
                  formatDate={formatDate}
                  onOpen={() => {
                    setActiveTab("orders");
                    setExpandedOrderId(order.id);
                  }}
                />
              ))}
            </div>
          </Panel>

          <Panel
            title="Recent Requests"
            subtitle="Latest requests submitted for admin review."
            rightAction={
              <button
                onClick={() => setActiveTab("requests")}
                className="text-sm font-semibold text-yellow-300 hover:text-yellow-200"
              >
                View all
              </button>
            }
          >
            <div className="mt-5 grid gap-4">
              {latestRequests.length === 0 && (
                <EmptyState text="No requests yet." />
              )}

              {latestRequests.map((request) => (
                <CompactRequestCard
                  key={request.id}
                  request={request}
                  formatDate={formatDate}
                  onOpen={() => {
                    setActiveTab("requests");
                    setExpandedRequestId(request.id);
                  }}
                />
              ))}
            </div>
          </Panel>

          <Panel
            title="What to do next"
            subtitle="Common actions for your account."
          >
            <div className="mt-5 grid gap-3">
              <ActionRow
                title="Submit a new boost request"
                description="Rank boost, trophy boost, prestige, coaching, or custom."
                href="/services"
              />

              <ActionRow
                title="Browse account listings"
                description="Request an account listing for admin review."
                href="/accounts"
              />

              <ActionRow
                title="Check special offers"
                description="Limited-time bundles and deals."
                href="/offers"
              />
            </div>
          </Panel>

          <Panel title="Profile" subtitle="Quick access to account details.">
            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
                <label className="text-sm font-semibold text-zinc-300">
                  Username
                </label>

                <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                  <input
                    className="flex-1 rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                    value={usernameDraft}
                    onChange={(e) => setUsernameDraft(e.target.value)}
                    placeholder="Enter username"
                  />

                  <button
                    onClick={updateOwnUsername}
                    className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
                  >
                    Save
                  </button>
                </div>

                {profileMessage && (
                  <p className="mt-2 text-sm text-green-300">
                    {profileMessage}
                  </p>
                )}
              </div>

              <InfoRow label="Email" value={email || "N/A"} />
              <InfoRow label="Credits" value={`$${credits.toFixed(2)}`} />
              <InfoRow label="Pending Requests" value={pendingRequests.length} />
              <InfoRow label="Unread Updates" value={unreadOrders.length} />

              <button
                onClick={sendPasswordResetEmail}
                className="rounded-xl border border-zinc-700 px-4 py-3 text-sm font-semibold text-zinc-200 hover:bg-zinc-900"
              >
                Send Password Reset Email
              </button>

              {resetMessage && (
                <p className="text-sm text-green-300">{resetMessage}</p>
              )}
            </div>
          </Panel>
        </section>
      )}

      {activeTab === "orders" && (
        <section className="mt-8">
          <SectionHeader
            title="Active Orders"
            subtitle="Orders currently pending, accepted, in progress, rejected, or cancelled."
          />

          <div className="mt-6 grid gap-5">
            {activeOrders.length === 0 && (
              <EmptyState text="No active orders assigned yet. Accepted requests may become orders later." />
            )}

            {activeOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                messages={messages}
                currentUserId={currentUserId}
                chatInputs={chatInputs}
                setChatInputs={setChatInputs}
                sendMessage={sendMessage}
                markOrderUpdateRead={markOrderUpdateRead}
                formatDate={formatDate}
                showChat
                expanded={expandedOrderId === order.id}
                onToggle={() =>
                  setExpandedOrderId((prev) =>
                    prev === order.id ? null : order.id
                  )
                }
              />
            ))}
          </div>
        </section>
      )}

      {activeTab === "requests" && (
        <section className="mt-8">
          <SectionHeader
            title="Your Requests"
            subtitle="Requests submitted from services, accounts, pins, and offers."
            rightAction={
              <Link
                href="/services"
                className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
              >
                Submit Request
              </Link>
            }
          />

          <div className="mt-6 grid gap-5">
            {requests.length === 0 && (
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center">
                <p className="text-zinc-400">
                  No requests yet. Submit one from the services page.
                </p>

                <Link
                  href="/services"
                  className="mt-5 inline-flex rounded-xl bg-yellow-400 px-5 py-3 font-bold text-black hover:bg-yellow-300"
                >
                  Browse Services
                </Link>
              </div>
            )}

            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                formatDate={formatDate}
                expanded={expandedRequestId === request.id}
                onToggle={() =>
                  setExpandedRequestId((prev) =>
                    prev === request.id ? null : request.id
                  )
                }
              />
            ))}
          </div>
        </section>
      )}

      {activeTab === "history" && (
        <section className="mt-8">
          <SectionHeader
            title="Completed Boost History"
            subtitle="Completed orders remain visible here as your order history."
          />

          <div className="mt-6 grid gap-5">
            {completedOrders.length === 0 && (
              <EmptyState text="No completed boosts yet." />
            )}

            {completedOrders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                messages={messages}
                currentUserId={currentUserId}
                chatInputs={chatInputs}
                setChatInputs={setChatInputs}
                sendMessage={sendMessage}
                markOrderUpdateRead={markOrderUpdateRead}
                formatDate={formatDate}
                showChat={false}
                expanded={expandedOrderId === order.id}
                onToggle={() =>
                  setExpandedOrderId((prev) =>
                    prev === order.id ? null : order.id
                  )
                }
              />
            ))}
          </div>
        </section>
      )}

      <FloatingSupportChat
        open={chatWidgetOpen}
        setOpen={setChatWidgetOpen}
        activeOrders={activeOrders}
        selectedOrderId={selectedChatOrderId}
        setSelectedOrderId={setSelectedChatOrderId}
        messages={messages}
        currentUserId={currentUserId}
        chatInputs={chatInputs}
        setChatInputs={setChatInputs}
        sendMessage={sendMessage}
      />
    </PageShell>
  );
}

function QuickLinkCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 transition hover:border-yellow-400/50 hover:bg-zinc-900"
    >
      <p className="font-bold text-yellow-300">{title}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
    </Link>
  );
}

function StatCard({
  label,
  value,
  subValue,
  highlight = false,
  small = false,
}: {
  label: string;
  value: string | number;
  subValue?: string;
  highlight?: boolean;
  small?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
      <p className="text-sm text-zinc-400">{label}</p>

      <h2
        className={`mt-2 truncate font-bold ${
          small ? "text-lg" : "text-4xl"
        } ${highlight ? "text-yellow-400" : "text-white"}`}
      >
        {value}
      </h2>

      {subValue && (
        <p className="mt-1 truncate text-xs text-zinc-500">{subValue}</p>
      )}
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
  subtitle,
  children,
  rightAction,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  rightAction?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>}
        </div>

        {rightAction}
      </div>

      {children}
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  rightAction,
}: {
  title: string;
  subtitle: string;
  rightAction?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
      </div>

      {rightAction}
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

function DateBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1 text-sm text-zinc-300">{value}</p>
    </div>
  );
}

function InfoBox({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "yellow" | "green" | "red" | "blue";
}) {
  const tones = {
    yellow: "border-yellow-400/30 bg-yellow-400/10 text-yellow-200",
    green: "border-green-400/30 bg-green-400/10 text-green-300",
    red: "border-red-400/30 bg-red-400/10 text-red-300",
    blue: "border-blue-400/30 bg-blue-400/10 text-blue-300",
  };

  return (
    <div className={`mt-5 rounded-xl border p-4 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-zinc-950/80 p-3">
      <span className="text-zinc-500">{label}</span>
      <span className="font-semibold text-zinc-200">{value}</span>
    </div>
  );
}

function ActionRow({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 hover:border-yellow-400/40"
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1 text-sm text-zinc-500">{description}</p>
    </Link>
  );
}

function CompactOrderCard({
  order,
  formatDate,
  onOpen,
}: {
  order: Order;
  formatDate: (date: string | null) => string;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-left hover:border-yellow-400/40"
    >
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-bold">{order.service_type}</p>
        <StatusBadge status={order.status} />

        {order.user_seen_update === false && (
          <span className="rounded-full bg-yellow-400 px-2 py-1 text-xs font-bold text-black">
            New
          </span>
        )}
      </div>

      <p className="mt-2 text-sm text-zinc-400">
        {order.current_rank || "N/A"} → {order.target_rank || "N/A"}
      </p>

      <p className="mt-2 text-xs text-zinc-500">
        Updated: {formatDate(order.updated_at || order.created_at)}
      </p>
    </button>
  );
}

function CompactRequestCard({
  request,
  formatDate,
  onOpen,
}: {
  request: OrderRequest;
  formatDate: (date: string | null) => string;
  onOpen: () => void;
}) {
  return (
    <button
      onClick={onOpen}
      className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4 text-left hover:border-yellow-400/40"
    >
      <div className="flex flex-wrap items-center gap-3">
        <p className="font-bold">{request.service_type}</p>
        <StatusBadge status={request.status} />
      </div>

      <p className="mt-2 text-sm text-zinc-400">
        {request.current_rank || "N/A"} → {request.target_rank || "N/A"}
      </p>

      <p className="mt-2 text-xs text-zinc-500">
        Updated: {formatDate(request.updated_at || request.created_at)}
      </p>
    </button>
  );
}

function RequestCard({
  request,
  formatDate,
  expanded,
  onToggle,
}: {
  request: OrderRequest;
  formatDate: (date: string | null) => string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-bold">{request.service_type}</h3>
            <StatusBadge status={request.status} />
          </div>

          <p className="mt-2 text-sm text-zinc-400">
            {request.current_rank || "N/A"} → {request.target_rank || "N/A"}
          </p>
        </div>

        <button
          onClick={onToggle}
          className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
        >
          {expanded ? "Hide Details" : "View Details"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 text-sm text-zinc-400 md:grid-cols-2">
        <DateBox label="Submitted" value={formatDate(request.created_at)} />
        <DateBox label="Last Updated" value={formatDate(request.updated_at)} />
      </div>

      {request.status === "pending" && (
        <InfoBox tone="yellow">Your request is pending admin review.</InfoBox>
      )}

      {request.status === "accepted" && (
        <InfoBox tone="green">
          Your request has been accepted. Admin may assign an order soon.
        </InfoBox>
      )}

      {request.status === "rejected" && (
        <InfoBox tone="red">
          Your request was rejected.
          {request.admin_notes ? ` Admin note: ${request.admin_notes}` : ""}
        </InfoBox>
      )}

      {request.status === "converted_to_order" && (
        <InfoBox tone="blue">
          This request has been converted into an active order.
        </InfoBox>
      )}

      {expanded && (
        <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
          <h4 className="font-semibold">Request Notes</h4>
          <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-400">
            {request.notes || "No notes."}
          </p>
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  messages,
  currentUserId,
  chatInputs,
  setChatInputs,
  sendMessage,
  markOrderUpdateRead,
  formatDate,
  showChat,
  expanded,
  onToggle,
}: {
  order: Order;
  messages: Message[];
  currentUserId: string;
  chatInputs: Record<string, string>;
  setChatInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  sendMessage: (orderId: string) => Promise<void>;
  markOrderUpdateRead: (orderId: string) => Promise<void>;
  formatDate: (date: string | null) => string;
  showChat: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  const orderMessages = messages.filter(
    (message) => message.order_id === order.id
  );

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-xl font-bold">{order.service_type}</h3>
            <StatusBadge status={order.status} />

            {order.user_seen_update === false && (
              <span className="rounded-full bg-yellow-400 px-3 py-1 text-xs font-bold text-black">
                New Update
              </span>
            )}

            {order.admin_archived && (
              <span className="rounded-full border border-zinc-600 bg-zinc-800 px-3 py-1 text-xs text-zinc-300">
                archived by admin
              </span>
            )}
          </div>

          <p className="mt-2 text-sm text-zinc-400">
            {order.current_rank || "N/A"} → {order.target_rank || "N/A"}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {order.user_seen_update === false && (
            <button
              onClick={() => markOrderUpdateRead(order.id)}
              className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
            >
              Mark as read
            </button>
          )}

          <button
            onClick={onToggle}
            className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
          >
            {expanded ? "Hide Details" : "View Details"}
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 text-sm text-zinc-400 md:grid-cols-3">
        <DateBox label="Created" value={formatDate(order.created_at)} />
        <DateBox label="Last Updated" value={formatDate(order.updated_at)} />
        <DateBox label="Completed" value={formatDate(order.completed_at)} />
      </div>

      {order.status === "accepted" && (
        <InfoBox tone="green">
          Your order has been accepted. The admin will update progress soon.
        </InfoBox>
      )}

      {order.status === "rejected" && (
        <InfoBox tone="red">
          Your order has been rejected. Contact support or wait for admin
          follow-up.
        </InfoBox>
      )}

      {order.status === "completed" && (
        <InfoBox tone="blue">
          This boost has been completed and is saved in your boost history.
        </InfoBox>
      )}

      {expanded && (
        <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-4">
          <h4 className="font-semibold">Order Details</h4>
          <p className="mt-3 whitespace-pre-wrap text-sm text-zinc-400">
            {order.notes || "No additional notes."}
          </p>
        </div>
      )}

      {showChat && expanded && (
        <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Chat with Admin</h4>
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
              placeholder="Type a message..."
              value={chatInputs[order.id] ?? ""}
              onChange={(e) =>
                setChatInputs((prev) => ({
                  ...prev,
                  [order.id]: e.target.value,
                }))
              }
            />

            <button
              onClick={() => sendMessage(order.id)}
              className="rounded-xl bg-yellow-400 px-5 py-2 text-sm font-bold text-black hover:bg-yellow-300"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FloatingSupportChat({
  open,
  setOpen,
  activeOrders,
  selectedOrderId,
  setSelectedOrderId,
  messages,
  currentUserId,
  chatInputs,
  setChatInputs,
  sendMessage,
}: {
  open: boolean;
  setOpen: (value: boolean) => void;
  activeOrders: Order[];
  selectedOrderId: string | null;
  setSelectedOrderId: (value: string | null) => void;
  messages: Message[];
  currentUserId: string;
  chatInputs: Record<string, string>;
  setChatInputs: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  sendMessage: (orderId: string) => Promise<void>;
}) {
  const selectedOrder =
    activeOrders.find((order) => order.id === selectedOrderId) ||
    activeOrders[0];

  const orderMessages = selectedOrder
    ? messages.filter((message) => message.order_id === selectedOrder.id)
    : [];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {open && (
        <div className="mb-4 w-[350px] overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
          <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-5 py-4">
            <div>
              <p className="font-bold">24/7 Support</p>
              <p className="text-xs text-zinc-400">Chat with admin</p>
            </div>

            <button
              onClick={() => setOpen(false)}
              className="rounded-lg bg-zinc-800 px-3 py-1 text-sm hover:bg-zinc-700"
            >
              ×
            </button>
          </div>

          <div className="p-4">
            {activeOrders.length === 0 && (
              <p className="text-sm text-zinc-400">
                No active orders available for chat yet.
              </p>
            )}

            {activeOrders.length > 0 && selectedOrder && (
              <>
                <select
                  className="w-full rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
                  value={selectedOrder.id}
                  onChange={(e) => setSelectedOrderId(e.target.value)}
                >
                  {activeOrders.map((order) => (
                    <option key={order.id} value={order.id}>
                      {order.service_type} — {order.status}
                    </option>
                  ))}
                </select>

                <div className="mt-4 max-h-72 space-y-3 overflow-y-auto rounded-2xl bg-zinc-900 p-3">
                  {orderMessages.length === 0 && (
                    <p className="text-sm text-zinc-500">No messages yet.</p>
                  )}

                  {orderMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[85%] rounded-2xl p-3 text-sm ${
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
                    placeholder="Type message..."
                    value={chatInputs[selectedOrder.id] ?? ""}
                    onChange={(e) =>
                      setChatInputs((prev) => ({
                        ...prev,
                        [selectedOrder.id]: e.target.value,
                      }))
                    }
                  />

                  <button
                    onClick={() => sendMessage(selectedOrder.id)}
                    className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
                  >
                    Send
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <button
        onClick={() => {
          if (!selectedOrderId && activeOrders.length > 0) {
            setSelectedOrderId(activeOrders[0].id);
          }

          setOpen(!open);
        }}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-yellow-400 text-2xl text-black shadow-2xl shadow-yellow-400/30 hover:bg-yellow-300"
      >
        🎧
      </button>
    </div>
  );
}