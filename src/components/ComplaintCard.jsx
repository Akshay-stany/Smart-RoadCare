import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { MapPin, AlertTriangle } from "lucide-react";
import { memo } from "react";
const statusColors = {
    pending: "bg-status-pending text-destructive-foreground",
    in_progress: "bg-status-in-progress text-warning-foreground",
    resolved: "bg-status-resolved text-success-foreground",
};
const priorityColors = {
    low: "border-muted-foreground text-muted-foreground",
    medium: "border-status-in-progress text-status-in-progress",
    high: "border-status-pending text-status-pending",
};
const ComplaintCard = memo(function ComplaintCard({ complaint }) {
    return (<div className="group rounded-xl border bg-card shadow-sm transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-lg overflow-hidden">
      {complaint.image_url && (<div className="h-40 overflow-hidden">
          <img src={complaint.image_url} alt={complaint.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"/>
        </div>)}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-card-foreground leading-tight">{complaint.title}</h3>
          {complaint.is_urgent && <AlertTriangle className="h-4 w-4 shrink-0 text-status-pending"/>}
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{complaint.description}</p>
        <div className="flex flex-wrap gap-2">
          <Badge className={statusColors[complaint.status]}>
            {complaint.status.replace("_", " ")}
          </Badge>
          <Badge variant="outline" className={priorityColors[complaint.priority]}>
            {complaint.priority}
          </Badge>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3"/>
            {complaint.address || `${complaint.latitude.toFixed(4)}, ${complaint.longitude.toFixed(4)}`}
          </span>
          <span>{format(new Date(complaint.created_at), "MMM d, yyyy")}</span>
        </div>
        <p className="text-xs font-mono text-muted-foreground">ID: {complaint.complaint_id}</p>
      </div>
    </div>);
});
export default ComplaintCard;
