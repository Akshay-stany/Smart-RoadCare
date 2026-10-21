import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { useAuth, DEMO_ACCOUNTS } from "@/hooks/useAuth";

const HEARTBEAT_KEY = "roadcare_presence_heartbeats";
const HEARTBEAT_INTERVAL_MS = 15000;
const ONLINE_THRESHOLD_MS = 45000; // Users not seen in 45s are considered Offline

export const INITIAL_REGISTERED_USERS = [
  {
    id: DEMO_ACCOUNTS.admin.id,
    name: DEMO_ACCOUNTS.admin.fullName,
    email: DEMO_ACCOUNTS.admin.email,
    role: "admin",
    created_at: "2026-10-10T09:00:00.000Z",
    status: "active",
  },
  {
    id: DEMO_ACCOUNTS.officer.id,
    name: DEMO_ACCOUNTS.officer.fullName,
    email: DEMO_ACCOUNTS.officer.email,
    role: "officer",
    created_at: "2026-10-12T10:30:00.000Z",
    status: "active",
  },
  {
    id: "officer-02-uuid",
    name: "Suresh Gowda (Pothole Patch Squad)",
    email: "suresh.gowda@roadcare.gov",
    role: "officer",
    created_at: "2026-10-14T11:00:00.000Z",
    status: "active",
  },
  {
    id: DEMO_ACCOUNTS.citizen.id,
    name: DEMO_ACCOUNTS.citizen.fullName,
    email: DEMO_ACCOUNTS.citizen.email,
    role: "citizen",
    created_at: "2026-10-15T08:15:00.000Z",
    status: "active",
  },
  {
    id: "citizen-02-uuid",
    name: "Priya Patel",
    email: "priya.patel@bengaluru.org",
    role: "citizen",
    created_at: "2026-10-18T14:20:00.000Z",
    status: "active",
  },
  {
    id: "citizen-03-uuid",
    name: "Arjun Mehta",
    email: "arjun.m@roadcare.org",
    role: "citizen",
    created_at: "2026-10-19T16:45:00.000Z",
    status: "active",
  },
];

function getStoredHeartbeats() {
  if (typeof window === "undefined" || !window.localStorage) return {};
  try {
    const raw = window.localStorage.getItem(HEARTBEAT_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveHeartbeat(userId, meta) {
  if (typeof window === "undefined" || !window.localStorage || !userId) return;
  try {
    const all = getStoredHeartbeats();
    all[userId] = {
      timestamp: Date.now(),
      ...meta,
    };
    window.localStorage.setItem(HEARTBEAT_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent("roadcare-presence-sync", { detail: all }));
  } catch (err) {
    console.error("Failed to save presence heartbeat:", err);
  }
}

function clearHeartbeat(userId) {
  if (typeof window === "undefined" || !window.localStorage || !userId) return;
  try {
    const all = getStoredHeartbeats();
    delete all[userId];
    window.localStorage.setItem(HEARTBEAT_KEY, JSON.stringify(all));
    window.dispatchEvent(new CustomEvent("roadcare-presence-sync", { detail: all }));
  } catch {}
}

export function useUsersAndPresence() {
  const { user, role, profile } = useAuth();
  const queryClient = useQueryClient();
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());

  // 1. Fetch Registered Users from Supabase (or fallback combined with demo)
  const usersQuery = useQuery({
    queryKey: ["admin", "registered-users"],
    queryFn: async () => {
      let remoteUsers = [];
      if (isSupabaseConfigured()) {
        try {
          const [profilesRes, rolesRes] = await Promise.all([
            supabase.from("profiles").select("*").order("created_at", { ascending: false }),
            supabase.from("user_roles").select("*"),
          ]);

          if (profilesRes.data && profilesRes.data.length > 0) {
            const roleMap = {};
            (rolesRes.data || []).forEach((r) => {
              roleMap[r.user_id] = r.role;
            });

            remoteUsers = profilesRes.data.map((p) => ({
              id: p.user_id || p.id,
              name: p.full_name || p.email?.split("@")[0] || "Citizen",
              email: p.email,
              role: roleMap[p.user_id] || "citizen",
              created_at: p.created_at,
              status: "active",
            }));
          }
        } catch (err) {
          console.warn("Could not query Supabase profiles, using local list:", err);
        }
      }

      // Merge remote users with initial users (ensuring no duplicates by email/id)
      const mergedMap = new Map();
      INITIAL_REGISTERED_USERS.forEach((u) => mergedMap.set(u.id, u));
      remoteUsers.forEach((u) => mergedMap.set(u.id, u));

      // If current logged-in user is not in the list, add them
      if (user?.id && !mergedMap.has(user.id)) {
        mergedMap.set(user.id, {
          id: user.id,
          name: profile?.full_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
          email: user.email,
          role: role || "citizen",
          created_at: user.created_at || new Date().toISOString(),
          status: "active",
        });
      }

      return Array.from(mergedMap.values());
    },
    staleTime: 10000,
  });

  // 2. Online Presence Tracking (Heartbeat + Realtime Presence)
  const computeActiveOnline = useCallback(() => {
    const heartbeats = getStoredHeartbeats();
    const now = Date.now();
    const activeIds = new Set();

    Object.entries(heartbeats).forEach(([uId, data]) => {
      if (now - (data.timestamp || 0) < ONLINE_THRESHOLD_MS) {
        activeIds.add(uId);
      }
    });

    // Current user is always online if logged in
    if (user?.id) {
      activeIds.add(user.id);
    }

    setOnlineUserIds(activeIds);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    // Send immediate heartbeat on mount
    saveHeartbeat(user.id, {
      email: user.email,
      name: profile?.full_name || user.user_metadata?.full_name,
      role: role || "citizen",
    });
    computeActiveOnline();

    // Heartbeat timer
    const interval = setInterval(() => {
      saveHeartbeat(user.id, {
        email: user.email,
        name: profile?.full_name || user.user_metadata?.full_name,
        role: role || "citizen",
      });
      computeActiveOnline();
    }, HEARTBEAT_INTERVAL_MS);

    // Cross-tab and window presence sync
    const handleSync = () => computeActiveOnline();
    window.addEventListener("roadcare-presence-sync", handleSync);
    window.addEventListener("storage", (e) => {
      if (e.key === HEARTBEAT_KEY) handleSync();
    });

    // Cleanup on tab close / reload
    const handleUnload = () => {
      clearHeartbeat(user.id);
    };
    window.addEventListener("beforeunload", handleUnload);

    // 3. Supabase Realtime Presence Channel (defense-in-depth when configured)
    let channel = null;
    if (isSupabaseConfigured()) {
      try {
        channel = supabase.channel("roadcare-presence", {
          config: {
            presence: { key: user.id },
          },
        });

        channel
          .on("presence", { event: "sync" }, () => {
            const state = channel.presenceState();
            const rtIds = new Set();
            Object.keys(state).forEach((key) => rtIds.add(key));
            setOnlineUserIds((prev) => new Set([...prev, ...rtIds]));
          })
          .subscribe(async (status) => {
            if (status === "SUBSCRIBED") {
              await channel.track({
                userId: user.id,
                email: user.email,
                role: role,
                onlineAt: new Date().toISOString(),
              });
            }
          });
      } catch (err) {
        console.warn("Supabase Realtime Presence skipped:", err);
      }
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener("roadcare-presence-sync", handleSync);
      window.removeEventListener("beforeunload", handleUnload);
      if (channel) {
        try {
          supabase.removeChannel(channel);
        } catch {}
      }
    };
  }, [user?.id, user?.email, user?.user_metadata?.full_name, role, profile?.full_name, computeActiveOnline]);

  const allUsers = usersQuery.data || [];

  // Enrich users with accurate live status
  const enrichedUsers = allUsers.map((u) => {
    const isOnline = onlineUserIds.has(u.id);
    return {
      ...u,
      isOnline,
      statusLabel: isOnline ? "Online" : "Offline",
    };
  });

  const totalRegistered = enrichedUsers.length;
  const activeOnline = enrichedUsers.filter((u) => u.isOnline).length;
  const citizenCount = enrichedUsers.filter((u) => u.role === "citizen").length;
  const officerCount = enrichedUsers.filter((u) => u.role === "officer").length;
  const adminCount = enrichedUsers.filter((u) => u.role === "admin").length;

  return {
    users: enrichedUsers,
    isLoading: usersQuery.isLoading,
    refetch: usersQuery.refetch,
    totalRegistered,
    activeOnline,
    citizenCount,
    officerCount,
    adminCount,
  };
}
