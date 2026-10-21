import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNotifications } from "@/hooks/useNotifications";
import { Bell, Check, CheckCheck } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function NotificationBell() {
  const { user } = useAuth();
  const { notifications = [], unreadCount = 0, markAsRead, markAllAsRead } = useNotifications(user?.id);
  const [prevCount, setPrevCount] = useState(unreadCount);

  // Show toast when new notification arrives in real time
  useEffect(() => {
    if (!notifications?.length) return;
    const currentUnread = notifications.filter((n) => !n.is_read).length;
    if (currentUnread > prevCount && prevCount >= 0) {
      const latest = notifications.find((n) => !n.is_read);
      if (latest) {
        toast.info(latest.message, { duration: 6000 });
      }
    }
    setPrevCount(currentUnread);
  }, [notifications, prevCount]);

  if (!user) return null;

  const handleMarkOne = (e, notifId) => {
    e.stopPropagation();
    if (markAsRead) markAsRead(notifId);
  };

  const handleMarkAll = () => {
    if (markAllAsRead) markAllAsRead(user.id);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative p-2 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors focus:outline-none"
          aria-label="View notifications"
        >
          <Bell className="h-5 w-5 text-slate-700" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[10px] font-extrabold text-white shadow-2xs animate-pulse">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 sm:w-96 p-0 rounded-2xl shadow-xl border border-slate-200/90" align="end">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 bg-slate-50/70 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-slate-900">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                {unreadCount} Unread
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
              onClick={handleMarkAll}
            >
              <CheckCheck className="mr-1 h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[320px]">
          {!notifications?.length ? (
            <div className="py-10 text-center text-xs text-slate-400">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
              No notifications yet.
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`flex items-start gap-3 border-b border-slate-100 px-4 py-3 last:border-0 transition-colors ${
                  n.is_read ? "opacity-60 bg-white" : "bg-emerald-50/20"
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                    !n.is_read ? "bg-emerald-500 ring-2 ring-emerald-200" : "bg-slate-300"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-snug ${!n.is_read ? "font-bold text-slate-900" : "text-slate-600"}`}>
                    {n.message}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {formatDistanceToNow(new Date(n.created_at || Date.now()), { addSuffix: true })}
                  </p>
                </div>
                {!n.is_read && (
                  <button
                    onClick={(e) => handleMarkOne(e, n.id)}
                    className="shrink-0 rounded-md p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                    title="Mark as read"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
