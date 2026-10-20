import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG = {
  pending: {
    label: "Pending",
    className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  },
  awaiting_verification: {
    label: "Awaiting Verification",
    className: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100",
  },
  verified: {
    label: "Verified",
    className: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100",
  },
  resolved: {
    label: "Resolved",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  },
  citizen_confirmed: {
    label: "Citizen Confirmed",
    className: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100",
  },
  closed: {
    label: "Closed",
    className: "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200",
  },
  rejected: {
    label: "Rejected",
    className: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
  },
  duplicate: {
    label: "Duplicate",
    className: "bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100",
  },
};

export default function StatusBadge({ status, className = "" }) {
  const normalized = String(status || "pending").toLowerCase().replace(/-/g, "_");
  const config = STATUS_CONFIG[normalized] || {
    label: status || "Unknown",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <Badge
      variant="outline"
      className={`font-medium px-2.5 py-0.5 rounded-full text-xs transition-colors shadow-none ${config.className} ${className}`}
    >
      {config.label}
    </Badge>
  );
}
