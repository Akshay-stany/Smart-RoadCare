import { useComplaints } from "@/hooks/useComplaints";
import MapView from "@/components/MapView";
import { Loader2, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function MapPage() {
  const { data: complaints, isLoading } = useComplaints();

  const total = complaints?.length || 0;
  const pending = complaints?.filter((c) => c.status === "pending").length || 0;
  const inProgress = complaints?.filter((c) => c.status === "in_progress").length || 0;
  const resolved = complaints?.filter((c) => c.status === "resolved").length || 0;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary" />
              Live Issue Map
            </h1>
            <p className="text-sm text-muted-foreground">
              Real-time road issues across the region • Updates automatically
            </p>
          </div>
          {!isLoading && (
            <div className="flex gap-3 text-xs font-medium">
              <span className="rounded-full bg-muted px-3 py-1">{total} Total</span>
              <span className="rounded-full bg-destructive/10 text-destructive px-3 py-1">{pending} Pending</span>
              <span className="rounded-full bg-accent/20 text-accent-foreground px-3 py-1">{inProgress} In Progress</span>
              <span className="rounded-full bg-success/20 text-success px-3 py-1">{resolved} Resolved</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 px-4 pb-4">
        {isLoading ? (
          <div className="h-full space-y-3">
            <div className="flex gap-3">
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
              <Skeleton className="h-7 w-24 rounded-full" />
            </div>
            <div className="h-[85%] rounded-xl border bg-card flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          </div>
        ) : (
          <MapView complaints={complaints || []} className="h-full w-full rounded-xl border shadow-sm" />
        )}
      </div>
    </div>
  );
}
