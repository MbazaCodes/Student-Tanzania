import { cn } from "@/lib/utils";

interface ApprovalStatusBadgeProps {
  status:
    | "Pending"
    | "Approved"
    | "Rejected"
    | "Changes Requested";
}

const styles = {
  Pending:
    "bg-amber-100 text-amber-800 border-amber-300",

  Approved:
    "bg-emerald-100 text-emerald-800 border-emerald-300",

  Rejected:
    "bg-red-100 text-red-800 border-red-300",

  "Changes Requested":
    "bg-blue-100 text-blue-800 border-blue-300",
};

export default function ApprovalStatusBadge({
  status,
}: ApprovalStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
        styles[status]
      )}
    >
      {status}
    </span>
  );
}
