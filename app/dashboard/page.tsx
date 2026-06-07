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
  credits: number | null;
};

type Message = {
  id: string;
  order_id: string;
  sender_id: string;
  message: string;
  created_at: string;
};

export default function DashboardPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<OrderRequest[]>([]);
  const [email, setEmail] = useState("");
  const [credits, setCredits] = useState(0);

  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInputs, setChatInputs] = useState<Record<string, string>>({});
  const [currentUserId, setCurrentUserId] = useState("");

  const [loading, setLoading] = useState(true);

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
        .select("email, credits")
        .eq("id", user.id)
        .single();

      if (!profileError && profile) {
        const userProfile = profile as Profile;
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

      if (requestData) {
        setRequests(requestData);
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

      if (orderData) {
        setOrders(orderData);
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

      if (messageData) {
        setMessages(messageData);
      }

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

    if (messageData) {
      setMessages(messageData);
    }
  }

  const activeOrders = orders.filter((order) => order.status !== "completed");
  const completedOrders = orders.filter((order) => order.status === "completed");

  const unreadOrderCount = orders.filter(
    (order) => order.user_seen_update === false
  ).length;

  const pendingRequestCount = requests.filter(
    (request) => request.status === "pending"
  ).length;

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
      subtitle="Track your submitted requests, active orders, completed boost history, credits, and admin messages."
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
      {unreadOrderCount > 0 && (
        <div className="mb-6 rounded-2xl border border-yellow-400/40 bg-yellow-400/10 p-5">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-yellow-400 text-xl text-black">
              🔔
            </div>

            <div>
              <h2 className="font-bold text-yellow-300">
                Unread Order Update
              </h2>
              <p className="text-sm text-zinc-300">
                You have {unreadOrderCount} unread order update
                {unreadOrderCount === 1 ? "" : "s"}.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-5">
        <StatCard label="Account" value={email || "N/A"} small />
        <StatCard label="Credits" value={`$${credits.toFixed(2)}`} highlight />
        <StatCard label="Requests" value={requests.length} />
        <StatCard label="Active Orders" value={activeOrders.length} />
        <StatCard label="Completed" value={completedOrders.length} />
      </div>

      <section className="mt-10">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end">
          <div>
            <h2 className="text-2xl font-bold">Your Requests</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Requests submitted from the services page. Admin will review them.
            </p>
          </div>

          <p className="text-sm text-zinc-500">
            Pending requests: {pendingRequestCount}
          </p>
        </div>

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
            <div
              key={request.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6"
            >
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-bold">
                      {request.service_type}
                    </h3>
                    <StatusBadge status={request.status} />
                  </div>

                  <p className="mt-2 text-sm text-zinc-400">
                    {request.current_rank || "N/A"} →{" "}
                    {request.target_rank || "N/A"}
                  </p>
                </div>
              </div>

              <div className="mt-5 grid gap-3 text-sm text-zinc-400 md:grid-cols-2">
                <DateBox label="Submitted" value={formatDate(request.created_at)} />
                <DateBox label="Last Updated" value={formatDate(request.updated_at)} />
              </div>

              {request.status === "pending" && (
                <InfoBox tone="yellow">
                  Your request is pending admin review.
                </InfoBox>
              )}

              {request.status === "accepted" && (
                <InfoBox tone="green">
                  Your request has been accepted. Admin may assign an order soon.
                </InfoBox>
              )}

              {request.status === "rejected" && (
                <InfoBox tone="red">
                  Your request was rejected.
                  {request.admin_notes
                    ? ` Admin note: ${request.admin_notes}`
                    : ""}
                </InfoBox>
              )}

              {request.status === "converted_to_order" && (
                <InfoBox tone="blue">
                  This request has been converted into an active order.
                </InfoBox>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div>
          <h2 className="text-2xl font-bold">Active Orders</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Orders currently being reviewed, accepted, or in progress.
          </p>
        </div>

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
            />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <div>
          <h2 className="text-2xl font-bold">Completed Boost History</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Completed orders remain visible here even after admin removes them
            from the active admin list.
          </p>
        </div>

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
            />
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function StatCard({
  label,
  value,
  highlight = false,
  small = false,
}: {
  label: string;
  value: string | number;
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
    </div>
  );
}

function DateBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-3">
      <p className="text-xs text-zinc-500">{label}</p>
      <p className="mt-1">{value}</p>
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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center text-zinc-400">
      {text}
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

        {order.user_seen_update === false && (
          <button
            onClick={() => markOrderUpdateRead(order.id)}
            className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
          >
            Mark as read
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-3 text-sm text-zinc-400 md:grid-cols-3">
        <DateBox label="Created" value={formatDate(order.created_at)} />
        <DateBox label="Last Updated" value={formatDate(order.updated_at)} />
        <DateBox label="Completed" value={formatDate(order.completed_at)} />
      </div>

      {order.status === "accepted" && (
        <InfoBox tone="green">
          Your order has been accepted. The admin will update the progress soon.
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

      {showChat && (
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