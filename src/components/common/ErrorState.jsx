import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorState({
  title = "Something went wrong",
  message = "Unable to complete request. Please try again.",
  onRetry,
  className = "",
}) {
  return (
    <div className={`flex flex-col items-center justify-center p-8 text-center bg-rose-50/50 rounded-xl border border-rose-200/80 ${className}`}>
      <div className="w-12 h-12 mb-3.5 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
        <AlertTriangle className="w-6 h-6" />
      </div>
      <h3 className="text-base font-semibold text-rose-900">{title}</h3>
      <p className="mt-1 text-sm text-rose-700 max-w-sm">{message}</p>
      {onRetry && (
        <Button
          onClick={onRetry}
          variant="outline"
          className="mt-4 border-rose-300 text-rose-800 hover:bg-rose-100"
          size="sm"
        >
          Try Again
        </Button>
      )}
    </div>
  );
}
