"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import PageShell from "@/components/PageShell";
import StatusBadge from "@/components/StatusBadge";

type Order = {
  id: string;
  service_type: string;
  current_rank: string | null;
  target_rank: string | null;
  status: string;
  created_at: string;
  user_seen_update: boolean | null;
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

  const unreadOrderCount = orders.filter(
    (order) => order.user_seen_update === false
  ).length;

  if (loading) {
    return (
      <PageShell
        title="Dashboard"
        subtitle="Loading your orders, credits, and messages."
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
      subtitle="Track your assigned orders, credits, and admin messages."
      rightAction={
        <button
          onClick={logout}
          className="rounded-xl bg-zinc-800 px-4 py-2 text-sm hover:bg-zinc-700"
        >
          Logout
        </button>
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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
          <p className="text-sm text-zinc-400">Account</p>
          <h2 className="mt-2 truncate text-lg font-semibold">{email}</h2>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
          <p className="text-sm text-zinc-400">Available Credits</p>
          <h2 className="mt-2 text-4xl font-bold text-yellow-400">
            ${credits.toFixed(2)}
          </h2>
        </div>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6">
          <p className="text-sm text-zinc-400">Assigned Orders</p>
          <h2 className="mt-2 text-4xl font-bold">{orders.length}</h2>
        </div>
      </div>

      <div className="mt-10 flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Orders</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Orders assigned by the admin will appear here.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5">
        {orders.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-8 text-center">
            <p className="text-zinc-400">
              No orders assigned yet. Your orders will appear here after an
              admin assigns them.
            </p>
          </div>
        )}

        {orders.map((order) => {
          const orderMessages = messages.filter(
            (message) => message.order_id === order.id
          );

          return (
            <div
              key={order.id}
              className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6"
            >
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
                  </div>

                  <p className="mt-2 text-sm text-zinc-400">
                    {order.current_rank || "N/A"} →{" "}
                    {order.target_rank || "N/A"}
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

              {order.status === "accepted" && (
                <div className="mt-5 rounded-xl border border-green-400/30 bg-green-400/10 p-4 text-sm text-green-300">
                  Your order has been accepted. The admin will update the
                  progress soon.
                </div>
              )}

              {order.status === "rejected" && (
                <div className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-300">
                  Your order has been rejected. Contact support or wait for
                  admin follow-up.
                </div>
              )}

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
            </div>
          );
        })}
      </div>
    </PageShell>
  );
}