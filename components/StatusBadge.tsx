type StatusBadgeProps = {
  status: string;
};

const statusStyles: Record<string, string> = {
  pending: "border-yellow-400/40 bg-yellow-400/10 text-yellow-300",
  accepted: "border-green-400/40 bg-green-400/10 text-green-300",
  rejected: "border-red-400/40 bg-red-400/10 text-red-300",
  in_progress: "border-blue-400/40 bg-blue-400/10 text-blue-300",
  completed: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  cancelled: "border-zinc-400/40 bg-zinc-400/10 text-zinc-300",
  converted_to_order: "border-purple-400/40 bg-purple-400/10 text-purple-300",
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const style =
    statusStyles[status] ?? "border-zinc-700 bg-zinc-800 text-zinc-300";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold capitalize ${style}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}