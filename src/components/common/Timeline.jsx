import { CheckCircle2, Clock, UserCheck, AlertCircle, RefreshCw } from "lucide-react";

export default function Timeline({ items = [], className = "" }) {
  if (!items || items.length === 0) {
    return (
      <div className="py-6 text-center text-sm text-slate-500">
        No status history recorded yet.
      </div>
    );
  }

  const getIcon = (type) => {
    switch (type) {
      case "submitted":
        return <Clock className="w-4 h-4 text-sky-600" />;
      case "verified":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case "assigned":
        return <UserCheck className="w-4 h-4 text-purple-600" />;
      case "in_progress":
        return <RefreshCw className="w-4 h-4 text-amber-600" />;
      case "resolved":
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-slate-500" />;
    }
  };

  const getBadgeBg = (type) => {
    switch (type) {
      case "submitted":
        return "bg-sky-100 ring-sky-200";
      case "verified":
      case "resolved":
        return "bg-emerald-100 ring-emerald-200";
      case "assigned":
        return "bg-purple-100 ring-purple-200";
      case "in_progress":
        return "bg-amber-100 ring-amber-200";
      default:
        return "bg-slate-100 ring-slate-200";
    }
  };

  return (
    <div className={`relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-200 ${className}`}>
      {items.map((item, idx) => (
        <div key={item.id || idx} className="relative flex items-start gap-3.5 group">
          {/* Timeline node icon */}
          <div
            className={`absolute -left-[30px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white ${getBadgeBg(
              item.type
            )}`}
          >
            {getIcon(item.type)}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                {item.date}
              </span>
              <p className="text-sm font-medium text-slate-900">{item.title}</p>
            </div>
            {item.description && (
              <p className="text-xs text-slate-500">{item.description}</p>
            )}
            {item.actor && (
              <p className="text-xs text-slate-400">By: {item.actor}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
