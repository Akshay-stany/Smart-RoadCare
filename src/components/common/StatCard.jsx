import { Card, CardContent } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

export default function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendDirection = "up",
  iconBg = "bg-emerald-50 text-emerald-600",
  className = "",
}) {
  const isUp = trendDirection === "up";

  return (
    <Card className={`bg-white border border-slate-200/80 shadow-sm rounded-xl transition-all hover:shadow-md ${className}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
              {title}
            </p>
            <p className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900">
              {value}
            </p>
          </div>
          {Icon && (
            <div className={`p-2.5 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
              <Icon className="w-5 h-5" />
            </div>
          )}
        </div>

        {trend && (
          <div className="mt-3 flex items-center gap-1.5 text-xs">
            <span
              className={`inline-flex items-center font-semibold ${
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
