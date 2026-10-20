import { Link } from "react-router-dom";
import AppShell from "@/components/layout/AppShell";
import PageHeader from "@/components/common/PageHeader";
import EmptyState from "@/components/common/EmptyState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, CheckCheck, Clock, ArrowRight } from "lucide-react";

export default function NotificationsPage() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();

  const demoNotifications = [
    {
      id: "notif-1",
      message: 'Your reported issue "Pothole on 100ft Road" status changed to in progress',
      is_read: false,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      complaint_id: "RC-1024",
    },
    {
      id: "notif-2",
      message: 'Your reported issue "Damaged Road Surface" has been verified by municipal authority',
      is_read: true,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      complaint_id: "RC-1021",
    },
    {
      id: "notif-3",
      message: 'Complaint #RC-1022 marked as resolved. Please review and confirm resolution.',
      is_read: true,
      created_at: new Date(Date.now() - 172800000).toISOString(),
      complaint_id: "RC-1022",
    },
  ];

  const items = notifications && notifications.length > 0 ? notifications : demoNotifications;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AppShell>
      <PageHeader
        title="Notification Center"
        description="Real-time updates regarding your complaint status changes and dispatch actions."
        badge={
          unreadCount > 0 && (
            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
              {unreadCount} Unread
            </Badge>
          )
        }
        actions={
          items.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs border-slate-200 text-slate-700 font-semibold"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Mark All as Read
            </Button>
          )
        }
      />

      <div className="max-w-4xl space-y-3">
        {items.length === 0 ? (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description="You are all caught up! You'll receive real-time alerts when your issue status updates."
          />
        ) : (
          items.map((n) => (
            <Card
              key={n.id}
              onClick={() => markAsRead(n.id)}
              className={`border transition-all cursor-pointer rounded-xl ${
                !n.is_read
                  ? "bg-emerald-50/20 border-emerald-200/80 shadow-2xs"
                  : "bg-white border-slate-200/80 hover:bg-slate-50/70"
              }`}
            >
              <CardContent className="p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <div
                    className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${
                      !n.is_read ? "bg-emerald-500 ring-4 ring-emerald-100" : "bg-slate-300"
                    }`}
                  />
                  <div className="space-y-1 min-w-0">
                    <p className={`text-sm ${!n.is_read ? "font-bold text-slate-900" : "font-normal text-slate-700"}`}>
                      {n.message}
                    </p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(n.created_at)}
                    </p>
                  </div>
                </div>

                {n.complaint_id && (
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 font-semibold text-xs"
                  >
                    <Link to={`/complaints/${n.complaint_id}`}>
                      View Case
                      <ArrowRight className="w-3.5 h-3.5 ml-1" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </AppShell>
  );
}
