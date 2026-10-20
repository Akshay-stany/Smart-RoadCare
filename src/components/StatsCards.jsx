import { useState, useMemo, memo } from "react";
import { useComplaints } from "@/hooks/useComplaints";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Clock, CheckCircle2, FileText, Users } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
const StatsCards = memo(function StatsCards() {
    const { role } = useAuth();
    const isAdmin = role === "admin";
    const { data: complaints } = useComplaints();
    const [showBreakdown, setShowBreakdown] = useState(false);
    const { data: profiles } = useQuery({
        queryKey: ["profiles-all"],
        queryFn: async () => {
            const { data, error } = await supabase.from("profiles").select("user_id, full_name, email");
            if (error)
                throw error;
            return data;
        },
        enabled: isAdmin, // names/emails are only loaded for admins
        staleTime: 5 * 60_000,
        gcTime: 10 * 60_000,
    });
    const { total, pending, inProgress, resolved } = useMemo(() => {
        return {
            total: complaints?.length ?? 0,
            pending: complaints?.filter((c) => c.status === "pending").length ?? 0,
            inProgress: complaints?.filter((c) => c.status === "in_progress").length ?? 0,
            resolved: complaints?.filter((c) => c.status === "resolved").length ?? 0,
        };
    }, [complaints]);
    // Group complaints by user
    const userBreakdown = useMemo(() => {
        return complaints?.reduce((acc, c) => {
            if (!acc[c.user_id])
                acc[c.user_id] = { total: 0, pending: 0, in_progress: 0, resolved: 0 };
            acc[c.user_id].total++;
            acc[c.user_id][c.status]++;
            return acc;
        }, {});
    }, [complaints]);
    const getUserName = (userId) => {
        const p = profiles?.find((pr) => pr.user_id === userId);
        return p?.full_name || p?.email || userId.slice(0, 8);
    };
    const stats = [
        { label: "Total Reports", value: total, icon: FileText, color: "text-primary", clickable: isAdmin },
        { label: "Pending", value: pending, icon: AlertTriangle, color: "text-status-pending", clickable: false },
        { label: "In Progress", value: inProgress, icon: Clock, color: "text-status-in-progress", clickable: false },
        { label: "Resolved", value: resolved, icon: CheckCircle2, color: "text-status-resolved", clickable: false },
    ];
    return (<>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (<div key={s.label} onClick={s.clickable ? () => setShowBreakdown(true) : undefined} className={`rounded-xl border bg-card p-5 shadow-sm transition-all ${s.clickable ? "cursor-pointer hover:shadow-md hover:border-primary/40" : ""}`}>
            <div className="flex items-center gap-3">
              <div className={`rounded-lg bg-secondary p-2.5 ${s.color}`}>
                <s.icon className="h-5 w-5"/>
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </div>
            </div>
          </div>))}
      </div>

      <Dialog open={showBreakdown} onOpenChange={setShowBreakdown}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5"/> Reports by Users ({total} total)
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {userBreakdown && Object.entries(userBreakdown)
            .sort(([, a], [, b]) => b.total - a.total)
            .map(([userId, counts]) => (<div key={userId} className="rounded-lg border bg-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-card-foreground text-sm">{getUserName(userId)}</p>
                    <Badge variant="secondary">{counts.total} reports</Badge>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge className="bg-status-pending text-destructive-foreground text-xs">
                      {counts.pending} Pending
                    </Badge>
                    <Badge className="bg-status-in-progress text-warning-foreground text-xs">
                      {counts.in_progress} In Progress
                    </Badge>
                    <Badge className="bg-status-resolved text-success-foreground text-xs">
                      {counts.resolved} Resolved
                    </Badge>
                  </div>
                </div>))}
            {(!userBreakdown || Object.keys(userBreakdown).length === 0) && (<p className="text-center text-muted-foreground py-4">No reports yet</p>)}
          </div>
        </DialogContent>
      </Dialog>
    </>);
});
export default StatsCards;
