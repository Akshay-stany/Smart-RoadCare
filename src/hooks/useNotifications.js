import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { useEffect, useCallback } from "react";
import { DEMO_ACCOUNTS } from "@/hooks/useAuth";

const LOCAL_NOTIFS_KEY = "roadcare_notifications_v2";

export const INITIAL_NOTIFICATIONS = [
  {
    id: "notif-init-1",
    user_id: DEMO_ACCOUNTS.citizen.id,
    complaint_id: "a90b4391-4567-4221-a1d2-b677a29e1024",
    complaint_code: "RC-1024",
    title: "Hazardous Pothole on Indiranagar 100ft Road",
    location: "Indiranagar 100ft Rd, Bengaluru",
    message: 'Complaint #RC-1024: "Hazardous Pothole on Indiranagar 100ft Road" status updated to IN PROGRESS. Assigned to Ravi Kumar.',
    is_read: false,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "notif-init-2",
    user_id: DEMO_ACCOUNTS.admin.id,
    complaint_id: "a90b4391-4567-4221-a1d2-b677a29e1024",
    complaint_code: "RC-1024",
    title: "Hazardous Pothole on Indiranagar 100ft Road",
    location: "Indiranagar 100ft Rd, Bengaluru",
    message: 'New Complaint #RC-1024: "Hazardous Pothole on Indiranagar 100ft Road" at Indiranagar 100ft Rd submitted at 08:30 AM.',
    is_read: false,
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "notif-init-3",
    user_id: DEMO_ACCOUNTS.citizen.id,
    complaint_id: "a90b4391-4567-4221-a1d2-b677a29e1022",
    complaint_code: "RC-1022",
    title: "Blocked Storm Drainage Hazard",
    location: "HSR Layout Sector 1, Bengaluru",
    message: 'Complaint #RC-1022: "Blocked Storm Drainage Hazard" has been marked as RESOLVED by public works.',
    is_read: true,
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

export function getLocalNotifications() {
  if (typeof window === "undefined" || !window.localStorage) {
    return INITIAL_NOTIFICATIONS;
  }
  try {
    const raw = window.localStorage.getItem(LOCAL_NOTIFS_KEY);
    if (!raw) {
      window.localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

export function saveLocalNotifications(list) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(LOCAL_NOTIFS_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent("roadcare-notification-changed", { detail: list }));
  } catch (err) {
    console.error("Failed to persist notifications:", err);
  }
}

/**
 * Creates and dispatches a notification to Supabase and the synchronized store.
 * Prevents exact duplicate notifications within a 10-second window.
 */
export async function createNotification({
  userId,
  complaintId,
  complaintCode,
  title,
  location,
  message,
}) {
  const all = getLocalNotifications();

  // Deduplicate exact same message for same user within last 15 seconds
  const isDuplicate = all.some(
    (n) =>
      n.user_id === userId &&
      n.message === message &&
      Date.now() - new Date(n.created_at).getTime() < 15000
  );
  if (isDuplicate) return null;

  const newNotif = {
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    user_id: userId,
    complaint_id: complaintId || null,
    complaint_code: complaintCode || null,
    title: title || "",
    location: location || "",
    message,
    is_read: false,
    created_at: new Date().toISOString(),
  };

  // Try Supabase insert if cloud configured
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .insert({
          user_id: userId,
          complaint_id: complaintId && complaintId.length === 36 ? complaintId : null,
          message,
          is_read: false,
        })
        .select()
        .single();
      if (!error && data) {
        newNotif.id = data.id;
      }
    } catch (err) {
      console.warn("Supabase notification insert fallback to local:", err);
    }
  }

  const updated = [newNotif, ...all];
  saveLocalNotifications(updated);
  return newNotif;
}

/**
 * Broadcasts a notification to Admin when a Citizen submits a new complaint
 */
export async function notifyAdminsNewComplaint(complaint) {
  const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const compId = complaint.complaint_id || `RC-${complaint.id?.slice(0, 4) || "1025"}`;
  const locationStr = complaint.address || `${complaint.latitude?.toFixed(4)}, ${complaint.longitude?.toFixed(4)}`;
  const message = `New Complaint #${compId}: "${complaint.title}" at ${locationStr} submitted at ${timeStr}.`;

  // Notify default admin ID and any stored admin sessions
  const adminIds = [DEMO_ACCOUNTS.admin.id];
  try {
    const rawSession = window.localStorage?.getItem("roadcare_local_session");
    if (rawSession) {
      const sess = JSON.parse(rawSession);
      if (sess.role === "admin" && sess.user?.id && !adminIds.includes(sess.user.id)) {
        adminIds.push(sess.user.id);
      }
    }
  } catch {}

  for (const adminId of adminIds) {
    await createNotification({
      userId: adminId,
      complaintId: complaint.id,
      complaintCode: compId,
      title: complaint.title,
      location: locationStr,
      message,
    });
  }
}

/**
 * Broadcasts a notification to the Citizen when an Admin updates or resolves a complaint
 */
export async function notifyCitizenComplaintUpdated(complaint, newStatus, remarks) {
  if (!complaint?.user_id) return;
  const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const compId = complaint.complaint_id || `RC-${complaint.id?.slice(0, 4) || "1024"}`;
  const statusLabel = (newStatus || complaint.status || "updated").replace(/_/g, " ").toUpperCase();
  const remarkSuffix = remarks ? ` — Remark: "${remarks}"` : "";
  const message = `Complaint #${compId}: "${complaint.title}" status changed to ${statusLabel} at ${timeStr}${remarkSuffix}.`;

  await createNotification({
    userId: complaint.user_id,
    complaintId: complaint.id,
    complaintCode: compId,
    title: complaint.title,
    location: complaint.address || "Reported Location",
    message,
  });
}

export function useNotifications(passedUserId) {
  const queryClient = useQueryClient();

  // Resolve active userId from argument or local session
  let activeUserId = passedUserId;
  if (!activeUserId && typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem("roadcare_local_session");
      if (raw) {
        const sess = JSON.parse(raw);
        activeUserId = sess.user?.id;
      }
    } catch {}
  }

  const query = useQuery({
    queryKey: ["notifications", activeUserId],
    queryFn: async () => {
      // 1. Try Supabase cloud query if configured
      if (isSupabaseConfigured() && activeUserId) {
        try {
          const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .eq("user_id", activeUserId)
            .order("created_at", { ascending: false })
            .limit(50);
          if (!error && data && data.length > 0) {
            return data;
          }
        } catch {
          // fall back to local
        }
      }

      // 2. Synchronized local store
      const all = getLocalNotifications();
      if (activeUserId) {
        return all.filter((n) => n.user_id === activeUserId);
      }
      return all;
    },
    staleTime: 2000,
  });

  // Real-time synchronization
  useEffect(() => {
    const handleLocalNotify = () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    };

    const handleStorageChange = (e) => {
      if (e.key === LOCAL_NOTIFS_KEY) {
        handleLocalNotify();
      }
    };

    window.addEventListener("roadcare-notification-changed", handleLocalNotify);
    window.addEventListener("storage", handleStorageChange);

    let channel = null;
    if (isSupabaseConfigured() && activeUserId) {
      try {
        const uniqueId = Math.random().toString(36).slice(2, 9);
        const channelName = `notifs-rt-${activeUserId}-${uniqueId}`;
        channel = supabase
          .channel(channelName)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "notifications",
              filter: `user_id=eq.${activeUserId}`,
            },
            () => {
              handleLocalNotify();
            }
          )
          .subscribe();
      } catch (err) {
        console.warn("Notifications realtime subscription skipped:", err?.message || err);
      }
    }

    return () => {
      window.removeEventListener("roadcare-notification-changed", handleLocalNotify);
      window.removeEventListener("storage", handleStorageChange);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, [activeUserId, queryClient]);

  const markAsRead = useCallback(
    async (id) => {
      // Cloud update
      if (isSupabaseConfigured()) {
        try {
          await supabase.from("notifications").update({ is_read: true }).eq("id", id);
        } catch {}
      }
      // Local update
      const all = getLocalNotifications();
      const next = all.map((n) => (n.id === id ? { ...n, is_read: true } : n));
      saveLocalNotifications(next);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    [queryClient]
  );

  const markAllAsRead = useCallback(
    async (userIdToMark) => {
      const targetUser = userIdToMark || activeUserId;
      if (isSupabaseConfigured() && targetUser) {
        try {
          await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", targetUser)
            .eq("is_read", false);
        } catch {}
      }
      const all = getLocalNotifications();
      const next = all.map((n) => {
        if (!targetUser || n.user_id === targetUser) {
          return { ...n, is_read: true };
        }
        return n;
      });
      saveLocalNotifications(next);
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    [activeUserId, queryClient]
  );

  const notifications = query.data || [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return {
    ...query,
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
  };
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      if (isSupabaseConfigured()) {
        try {
          await supabase.from("notifications").update({ is_read: true }).eq("id", id);
        } catch {}
      }
      const all = getLocalNotifications();
      const next = all.map((n) => (n.id === id ? { ...n, is_read: true } : n));
      saveLocalNotifications(next);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (userId) => {
      if (isSupabaseConfigured() && userId) {
        try {
          await supabase
            .from("notifications")
            .update({ is_read: true })
            .eq("user_id", userId)
            .eq("is_read", false);
        } catch {}
      }
      const all = getLocalNotifications();
      const next = all.map((n) => (n.user_id === userId ? { ...n, is_read: true } : n));
      saveLocalNotifications(next);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
