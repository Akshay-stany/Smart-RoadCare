import { Badge } from "@/components/ui/badge";

const PRIORITY_CONFIG = {
  critical: {
    label: "Critical",
    className: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 font-semibold",
  },
  high: {
    label: "High",
    className: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100",
  },
  medium: {
    label: "Medium",
    className: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100",
  },
  low: {
    label: "Low",
    className: "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100",
  },
};

export default function PriorityBadge({ priority, className = "" }) {
  const normalized = String(priority || "medium").toLowerCase();
  const config = PRIORITY_CONFIG[normalized] || {
    label: priority || "Normal",
    className: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <Badge
      variant="outline"
      className={`font-medium px-2.5 py-0.5 rounded-full text-xs shadow-none ${config.className} ${className}`}
    >
      {config.label}
    </Badge>
  );
}
