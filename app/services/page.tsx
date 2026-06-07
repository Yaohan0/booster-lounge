"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

const serviceTabs = [
  "Rank Boost",
  "Trophy Boost",
  "Prestige Icon",
  "Brawlers Rank",
  "Coaching",
  "Custom Request",
];

const allRanks = [
  "Bronze I",
  "Bronze II",
  "Bronze III",
  "Silver I",
  "Silver II",
  "Silver III",
  "Gold I",
  "Gold II",
  "Gold III",
  "Diamond",
  "Mythic I",
  "Mythic II",
  "Mythic III",
  "Legendary I",
  "Legendary II",
  "Legendary III",
  "Masters I",
  "Masters II",
  "Masters III",
];

const targetRanks = [
  "Mythic I",
  "Mythic II",
  "Mythic III",
  "Legendary I",
  "Legendary II",
  "Legendary III",
  "Masters I",
  "Masters II",
  "Masters III",
];

const prestigeOptions = ["Prestige 1", "Prestige 2", "Prestige 3"];

export default function ServicesPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [serviceType, setServiceType] = useState("Rank Boost");
  const [orderMode, setOrderMode] = useState<"Boost" | "Carry">("Boost");

  const [currentRank, setCurrentRank] = useState("Bronze I");
  const [targetRank, setTargetRank] = useState("Mythic I");

  const [currentTrophies, setCurrentTrophies] = useState("");
  const [targetTrophies, setTargetTrophies] = useState("");
  const [totalTrophies, setTotalTrophies] = useState("");

  const [brawler, setBrawler] = useState("");
  const [brawlerTrophies, setBrawlerTrophies] = useState("");
  const [prestigeTarget, setPrestigeTarget] = useState("Prestige 1");

  const [tag, setTag] = useState("");
  const [notes, setNotes] = useState("");

  const [express, setExpress] = useState(false);
  const [loading, setLoading] = useState(false);

  function resetFieldsForTab(tab: string) {
    setServiceType(tab);
    setOrderMode("Boost");
    setExpress(false);
    setNotes("");
    setTag("");

    if (tab === "Rank Boost") {
      setCurrentRank("Bronze I");
      setTargetRank("Mythic I");
    }

    if (tab === "Trophy Boost") {
      setCurrentTrophies("");
      setTargetTrophies("");
      setTotalTrophies("");
      setBrawler("");
    }

    if (tab === "Prestige Icon") {
      setPrestigeTarget("Prestige 1");
      setBrawler("");
      setBrawlerTrophies("");
    }

    if (tab === "Brawlers Rank") {
      setCurrentRank("Bronze I");
      setTargetRank("Mythic I");
      setBrawler("");
    }

    if (tab === "Coaching") {
      setBrawler("");
    }

    if (tab === "Custom Request") {
      setNotes("");
    }
  }

  function getCurrentValue() {
    if (serviceType === "Rank Boost") return currentRank;
    if (serviceType === "Trophy Boost") return currentTrophies || "N/A";
    if (serviceType === "Prestige Icon") return brawler || "N/A";
    if (serviceType === "Brawlers Rank") {
      return `${brawler || "Brawler"} - ${currentRank}`;
    }
    if (serviceType === "Coaching") return brawler || "Gameplay Review";
    return "Custom";
  }

  function getTargetValue() {
    if (serviceType === "Rank Boost") return targetRank;
    if (serviceType === "Trophy Boost") return targetTrophies || "N/A";
    if (serviceType === "Prestige Icon") return prestigeTarget;
    if (serviceType === "Brawlers Rank") return targetRank;
    return "Admin Review";
  }

  function buildRequestNotes() {
    const lines = [
      notes,
      "",
      "Order Details:",
      `Service: ${serviceType}`,
      `Type: ${orderMode}`,
      `Express: ${express ? "Yes" : "No"}`,
      `Tag: ${tag || "Not provided"}`,
    ];

    if (serviceType === "Rank Boost") {
      lines.push(`Current Rank: ${currentRank}`);
      lines.push(`Target Rank: ${targetRank}`);
    }

    if (serviceType === "Trophy Boost") {
      lines.push(`Current Trophies: ${currentTrophies || "Not provided"}`);
      lines.push(`Target Trophies: ${targetTrophies || "Not provided"}`);
      lines.push(`Total Trophies: ${totalTrophies || "Not provided"}`);
      lines.push(`Brawler: ${brawler || "Not provided"}`);
    }

    if (serviceType === "Prestige Icon") {
      lines.push(`Prestige Target: ${prestigeTarget}`);
      lines.push(`Brawler: ${brawler || "Not provided"}`);
      lines.push(`Brawler Trophies: ${brawlerTrophies || "Not provided"}`);
    }

    if (serviceType === "Brawlers Rank") {
      lines.push(`Brawler: ${brawler || "Not provided"}`);
      lines.push(`Current Rank: ${currentRank}`);
      lines.push(`Target Rank: ${targetRank}`);
    }

    if (serviceType === "Coaching") {
      lines.push(`Brawler: ${brawler || "Not provided"}`);
    }

    return lines.join("\n");
  }

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("order_requests").insert({
      user_id: user.id,
      service_type: serviceType,
      current_rank: getCurrentValue(),
      target_rank: getTargetValue(),
      notes: buildRequestNotes(),
      status: "pending",
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Request submitted. Admin will review it soon.");
    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#08080b] text-white">
      <nav className="border-b border-zinc-900 bg-[#0b0b10]/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <Link href="/" className="text-2xl font-bold text-yellow-400">
            Booster Lounge
          </Link>

          <div className="hidden items-center gap-6 text-sm text-zinc-300 md:flex">
            <Link href="/services" className="text-yellow-300">
              Services
            </Link>

            <Link href="/accounts" className="hover:text-white">
              Accounts
            </Link>

            <Link href="/pins" className="hover:text-white">
              Pins
            </Link>

            <Link href="/dashboard" className="hover:text-white">
              Dashboard
            </Link>
          </div>

          <Link
            href="/dashboard"
            className="rounded-xl bg-yellow-400 px-4 py-2 text-sm font-bold text-black hover:bg-yellow-300"
          >
            My Dashboard
          </Link>
        </div>
      </nav>

      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(250,204,21,0.16),_transparent_35%),radial-gradient(circle_at_left,_rgba(59,130,246,0.10),_transparent_30%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-14">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-yellow-300">
                Brawl Stars Services
              </p>

              <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight md:text-6xl">
                Build your request and let admin review it.
              </h1>

              <p className="mt-5 max-w-2xl text-zinc-400">
                Choose your service, boost type, target details, and tag. Your
                request will be reviewed before becoming an active order.
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 p-5">
              <p className="text-sm text-zinc-400">Dashboard-managed</p>
              <p className="mt-2 text-3xl font-bold text-yellow-400">Safe</p>
              <p className="mt-1 text-sm text-zinc-500">
                No passwords or 2FA codes
              </p>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            {serviceTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => resetFieldsForTab(tab)}
                className={`rounded-full border px-5 py-2 text-sm font-semibold ${
                  serviceType === tab
                    ? "border-yellow-400 bg-white text-black"
                    : "border-zinc-700 bg-zinc-950 text-zinc-300 hover:bg-zinc-900"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <form
            onSubmit={submitRequest}
            className="mt-8 grid gap-8 lg:grid-cols-[1fr_420px]"
          >
            <div className="grid gap-6">
              <ServiceForm
                serviceType={serviceType}
                currentRank={currentRank}
                setCurrentRank={setCurrentRank}
                targetRank={targetRank}
                setTargetRank={setTargetRank}
                currentTrophies={currentTrophies}
                setCurrentTrophies={setCurrentTrophies}
                targetTrophies={targetTrophies}
                setTargetTrophies={setTargetTrophies}
                totalTrophies={totalTrophies}
                setTotalTrophies={setTotalTrophies}
                brawler={brawler}
                setBrawler={setBrawler}
                brawlerTrophies={brawlerTrophies}
                setBrawlerTrophies={setBrawlerTrophies}
                prestigeTarget={prestigeTarget}
                setPrestigeTarget={setPrestigeTarget}
              />

              <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
                <h2 className="text-xl font-bold">Request Notes</h2>
                <p className="mt-1 text-sm text-zinc-400">
                  Add any useful details. Do not include passwords, 2FA codes,
                  or recovery information.
                </p>

                <textarea
                  className="mt-4 min-h-36 w-full rounded-xl bg-zinc-800 p-4 outline-none focus:ring-2 focus:ring-yellow-400"
                  placeholder="Example: preferred timing, special instructions, brawler preference, or questions..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <TrustPanel />
            </div>

            <aside className="h-fit rounded-3xl border border-yellow-400/70 bg-zinc-950 p-6 shadow-2xl shadow-yellow-400/10">
              <div className="rounded-2xl bg-gradient-to-br from-blue-400 to-yellow-200 p-5 text-black">
                <p className="text-sm font-bold">CUSTOMIZE ORDER</p>
                <h2 className="mt-2 text-2xl font-black">{serviceType}</h2>
              </div>

              <div className="mt-5 rounded-2xl border border-zinc-800 bg-[#09090d] p-4">
                <div className="grid grid-cols-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-1">
                  <button
                    type="button"
                    onClick={() => setOrderMode("Boost")}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                      orderMode === "Boost"
                        ? "bg-yellow-400 text-black"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Boost
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrderMode("Carry")}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold ${
                      orderMode === "Carry"
                        ? "bg-yellow-400 text-black"
                        : "text-zinc-400 hover:text-white"
                    }`}
                  >
                    Carry
                  </button>
                </div>

                <div className="mt-6 space-y-5">
                  <ToggleRow
                    label="Express"
                    enabled={express}
                    setEnabled={setExpress}
                  />

                  {serviceType === "Rank Boost" && (
                    <SelectField
                      label="Rank Boost Selection"
                      value={targetRank}
                      onChange={setTargetRank}
                      options={targetRanks}
                    />
                  )}

                  {serviceType === "Trophy Boost" && (
                    <>
                      <TextField
                        label="Total Trophies"
                        value={totalTrophies}
                        onChange={setTotalTrophies}
                        placeholder="e.g. 45000"
                      />
                      <TextField
                        label="Brawler"
                        value={brawler}
                        onChange={setBrawler}
                        placeholder="e.g. Shelly"
                      />
                    </>
                  )}

                  {serviceType === "Prestige Icon" && (
                    <>
                      <SelectField
                        label="Prestige"
                        value={prestigeTarget}
                        onChange={setPrestigeTarget}
                        options={prestigeOptions}
                      />
                      <TextField
                        label="Brawler"
                        value={brawler}
                        onChange={setBrawler}
                        placeholder="e.g. Edgar"
                      />
                      <TextField
                        label="Brawler Trophies"
                        value={brawlerTrophies}
                        onChange={setBrawlerTrophies}
                        placeholder="e.g. 850"
                      />
                    </>
                  )}

                  {serviceType === "Brawlers Rank" && (
                    <>
                      <TextField
                        label="Brawler"
                        value={brawler}
                        onChange={setBrawler}
                        placeholder="e.g. Piper"
                      />
                      <SelectField
                        label="Target Rank"
                        value={targetRank}
                        onChange={setTargetRank}
                        options={targetRanks}
                      />
                    </>
                  )}

                  {serviceType === "Coaching" && (
                    <TextField
                      label="Brawler"
                      value={brawler}
                      onChange={setBrawler}
                      placeholder="e.g. Piper"
                    />
                  )}

                  <TextField
                    label="Tag"
                    value={tag}
                    onChange={setTag}
                    placeholder="#"
                  />
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
                <p className="text-sm text-zinc-400">Request Summary</p>

                <div className="mt-4 space-y-3 text-sm">
                  <SummaryRow label="Service" value={serviceType} />
                  <SummaryRow label="Type" value={orderMode} />
                  <SummaryRow label="Current" value={getCurrentValue()} />
                  <SummaryRow label="Target" value={getTargetValue()} />
                  <SummaryRow label="Express" value={express ? "Yes" : "No"} />
                  <SummaryRow label="Tag" value={tag || "#"} />
                </div>

                <div className="mt-5 rounded-xl bg-yellow-400/10 p-4 text-sm text-yellow-200">
                  Admin will review your request and provide confirmation.
                </div>
              </div>

              <button
                disabled={loading}
                className="mt-5 w-full rounded-xl bg-yellow-400 p-4 font-bold text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Submitting..." : "Submit request"}
              </button>

              <p className="mt-4 text-center text-xs text-zinc-500">
                Do not share passwords, email access, 2FA codes, or recovery
                information.
              </p>
            </aside>
          </form>
        </div>
      </section>
    </main>
  );
}

type ServiceFormProps = {
  serviceType: string;
  currentRank: string;
  setCurrentRank: (value: string) => void;
  targetRank: string;
  setTargetRank: (value: string) => void;
  currentTrophies: string;
  setCurrentTrophies: (value: string) => void;
  targetTrophies: string;
  setTargetTrophies: (value: string) => void;
  totalTrophies: string;
  setTotalTrophies: (value: string) => void;
  brawler: string;
  setBrawler: (value: string) => void;
  brawlerTrophies: string;
  setBrawlerTrophies: (value: string) => void;
  prestigeTarget: string;
  setPrestigeTarget: (value: string) => void;
};

function ServiceForm(props: ServiceFormProps) {
  if (props.serviceType === "Rank Boost") {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <RankCard
          title="Current Rank"
          value={props.currentRank}
          options={allRanks}
          onChange={props.setCurrentRank}
          icon="★"
          color="bg-yellow-400 text-black"
        />

        <RankCard
          title="Desired Rank"
          value={props.targetRank}
          options={targetRanks}
          onChange={props.setTargetRank}
          icon="♛"
          color="bg-blue-500 text-white"
        />
      </div>
    );
  }

  if (props.serviceType === "Trophy Boost") {
    return (
      <FormPanel title="Trophy Boost">
        <div className="grid gap-4 md:grid-cols-2">
          <TextInput
            label="Current trophy count"
            value={props.currentTrophies}
            onChange={props.setCurrentTrophies}
            placeholder="e.g. 0"
          />

          <TextInput
            label="Desired trophy count"
            value={props.targetTrophies}
            onChange={props.setTargetTrophies}
            placeholder="e.g. 100"
          />

          <TextInput
            label="Total trophies"
            value={props.totalTrophies}
            onChange={props.setTotalTrophies}
            placeholder="e.g. 45000"
          />

          <TextInput
            label="Brawler"
            value={props.brawler}
            onChange={props.setBrawler}
            placeholder="e.g. Colt"
          />
        </div>
      </FormPanel>
    );
  }

  if (props.serviceType === "Prestige Icon") {
    return (
      <FormPanel title="Prestige Icon">
        <div className="grid gap-4 md:grid-cols-3">
          <SelectInput
            label="Prestige"
            value={props.prestigeTarget}
            onChange={props.setPrestigeTarget}
            options={prestigeOptions}
          />

          <TextInput
            label="Brawler"
            value={props.brawler}
            onChange={props.setBrawler}
            placeholder="e.g. Edgar"
          />

          <TextInput
            label="Brawler trophies"
            value={props.brawlerTrophies}
            onChange={props.setBrawlerTrophies}
            placeholder="e.g. 850"
          />
        </div>
      </FormPanel>
    );
  }

  if (props.serviceType === "Brawlers Rank") {
    return (
      <FormPanel title="Brawlers Rank">
        <div className="grid gap-4 md:grid-cols-3">
          <TextInput
            label="Brawler"
            value={props.brawler}
            onChange={props.setBrawler}
            placeholder="e.g. Piper"
          />

          <SelectInput
            label="Current rank"
            value={props.currentRank}
            onChange={props.setCurrentRank}
            options={allRanks}
          />

          <SelectInput
            label="Desired rank"
            value={props.targetRank}
            onChange={props.setTargetRank}
            options={targetRanks}
          />
        </div>
      </FormPanel>
    );
  }

  if (props.serviceType === "Coaching") {
    return (
      <FormPanel title="Coaching">
        <p className="mb-5 max-w-3xl text-zinc-300">
          Request gameplay feedback, coaching advice, or strategy review. Add
          your details in the notes section below.
        </p>

        <TextInput
          label="Brawler"
          value={props.brawler}
          onChange={props.setBrawler}
          placeholder="e.g. Piper, Edgar, Shelly"
        />
      </FormPanel>
    );
  }

  return (
    <FormPanel title="Custom Request">
      <p className="mb-5 max-w-3xl text-zinc-300">
        Have something in mind that does not match the standard categories? Add
        your request details below and admin will review it.
      </p>
    </FormPanel>
  );
}

function RankCard({
  title,
  value,
  options,
  onChange,
  icon,
  color,
}: {
  title: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  icon: string;
  color: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
      <div className="mb-6 flex items-center gap-4">
        <div
          className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${color}`}
        >
          {icon}
        </div>

        <div>
          <p className="text-sm text-zinc-400">{title}</p>
          <h2 className="text-2xl font-bold">{value}</h2>
        </div>
      </div>

      <label className="text-sm font-semibold text-zinc-300">{title}</label>
      <select
        className="mt-2 w-full rounded-xl bg-zinc-800 p-4 outline-none focus:ring-2 focus:ring-yellow-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function FormPanel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
      <h2 className="text-3xl font-bold">{title}</h2>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-300">{label}</span>
      <input
        className="mt-2 w-full rounded-xl bg-zinc-800 p-4 outline-none focus:ring-2 focus:ring-yellow-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function SelectInput({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-zinc-300">{label}</span>
      <select
        className="mt-2 w-full rounded-xl bg-zinc-800 p-4 outline-none focus:ring-2 focus:ring-yellow-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}

type ToggleRowProps = {
  label: string;
  enabled: boolean;
  setEnabled: (value: boolean) => void;
};

function ToggleRow({ label, enabled, setEnabled }: ToggleRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm font-semibold text-zinc-200">{label}</span>

      <button
        type="button"
        onClick={() => setEnabled(!enabled)}
        className={`relative h-7 w-12 rounded-full transition ${
          enabled ? "bg-yellow-400" : "bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
            enabled ? "left-6" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-semibold text-zinc-200">{label}</span>
      <input
        className="rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div className="grid gap-2">
      <span className="text-sm font-semibold text-zinc-200">{label}</span>
      <select
        className="rounded-xl bg-zinc-800 p-3 text-sm outline-none focus:ring-2 focus:ring-yellow-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-zinc-500">{label}</span>
      <span className="text-right font-semibold text-zinc-200">{value}</span>
    </div>
  );
}

function TrustPanel() {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6">
      <h2 className="text-xl font-bold">Why trust Booster Lounge?</h2>
      <p className="mt-3 text-zinc-400">
        Your request is reviewed before becoming an active order. Users track
        everything through the dashboard, including status, credits, and admin
        chat.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl bg-zinc-900 p-4">
          <p className="font-semibold">No password sharing</p>
          <p className="mt-1 text-sm text-zinc-500">
            Never submit account credentials.
          </p>
        </div>

        <div className="rounded-2xl bg-zinc-900 p-4">
          <p className="font-semibold">Admin reviewed</p>
          <p className="mt-1 text-sm text-zinc-500">
            Requests are accepted or rejected manually.
          </p>
        </div>

        <div className="rounded-2xl bg-zinc-900 p-4">
          <p className="font-semibold">Live dashboard</p>
          <p className="mt-1 text-sm text-zinc-500">
            Track status, credits, and chat updates.
          </p>
        </div>
      </div>
    </div>
  );
}