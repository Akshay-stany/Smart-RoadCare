import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight, Check } from "lucide-react";

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendDirection = "up",
  iconBg = "bg-emerald-50 text-emerald-600",
  className = "",
  onClick,
  active = false,
}) {
  const isUp = trendDirection === "up";
  const isClickable = Boolean(onClick);

  return (
    <Card
      onClick={onClick}
      className={`relative bg-white border rounded-2xl transition-all duration-200 overflow-hidden ${
        isClickable ? "cursor-pointer hover:shadow-md hover:-translate-y-0.5 select-none" : ""
      } ${
        active
          ? "border-emerald-500 ring-2 ring-emerald-500/40 shadow-md bg-emerald-50/15"
          : "border-slate-200/90 shadow-2xs hover:border-slate-300"
      } ${className}`}
    >
      {active && (
        <div className="absolute top-0 right-0 bg-emerald-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-bl-lg flex items-center gap-1 shadow-2xs">
          <Check className="w-3 h-3" />
          Active
        </div>
      )}
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {title}
            </p>
            <p className="text-2xl lg:text-3xl font-extrabold tracking-tight text-slate-900">
              {value}
            </p>
          </div>
          {Icon && (
            <div className={`p-2.5 rounded-xl ${iconBg} flex items-center justify-center shrink-0 shadow-2xs`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>

        {trend && (
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <span
              className={`inline-flex items-center font-bold ${
                isUp ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {isUp ? (
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
              )}
              {trend}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
