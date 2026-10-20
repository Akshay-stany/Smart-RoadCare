import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmptyState({
  icon: Icon = FileQuestion,
  title = "No data found",
  description = "There are no records to display at this time.",
  actionLabel,
  onAction,
  className = "",
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-white rounded-xl border border-dashed border-slate-200 ${className}`}>
      <div className="w-12 h-12 mb-3.5 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-slate-800">{title}</h3>
      <p className="mt-1 text-sm text-slate-500 max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          size="sm"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
