import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from "@/hooks/useNotifications";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
export default function NotificationBell() {
    const { user } = useAuth();
    const { data: notifications } = useNotifications(user?.id);
    const markRead = useMarkNotificationRead();
    const markAllRead = useMarkAllNotificationsRead();
    const [prevCount, setPrevCount] = useState(0);
    const unreadCount = notifications?.filter((n) => !n.is_read).length ?? 0;
    // Show toast when new notification arrives
    useEffect(() => {
        if (!notifications?.length)
            return;
        const currentUnread = notifications.filter((n) => !n.is_read).length;
        if (currentUnread > prevCount && prevCount >= 0) {
            const latest = notifications.find((n) => !n.is_read);
            if (latest) {
                toast.info(latest.message, { duration: 5000 });
            }
        }
        setPrevCount(currentUnread);
    }, [notifications]);
    if (!user)
        return null;
    return (<Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
          <Bell className="h-5 w-5 text-foreground"/>
          {unreadCount > 0 && (<span className="absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>)}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="font-semibold text-sm text-foreground">Notifications</h3>
          {unreadCount > 0 && (<Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => markAllRead.mutate(user.id)}>
              <CheckCheck className="mr-1 h-3 w-3"/>
              Mark all read
            </Button>)}
        </div>
        <ScrollArea className="max-h-[300px]">
          {!notifications?.length ? (<p className="text-center text-sm text-muted-foreground py-8">No notifications yet</p>) : (notifications.map((n) => (<div key={n.id} className={`flex items-start gap-3 border-b px-4 py-3 last:border-0 transition-colors ${n.is_read ? "opacity-60" : "bg-primary/5"}`}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground leading-snug">{n.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDistanceToNow(new Date(n.created_at), { addSuffix: true })}
                  </p>
                </div>
                {!n.is_read && (<button onClick={() => markRead.mutate(n.id)} className="shrink-0 rounded p-1 hover:bg-secondary" title="Mark as read">
                    <Check className="h-3.5 w-3.5 text-muted-foreground"/>
                  </button>)}
              </div>)))}
        </ScrollArea>
      </PopoverContent>
    </Popover>);
}
