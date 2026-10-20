import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { useEffect } from "react";

export function useNotifications(userId) {
    const queryClient = useQueryClient();
    const query = useQuery({
        queryKey: ["notifications", userId],
        queryFn: async () => {
            if (!userId)
                return [];
            try {
                const { data, error } = await supabase
                    .from("notifications")
                    .select("*")
                    .eq("user_id", userId)
                    .order("created_at", { ascending: false })
                    .limit(50);
                if (!error && data)
                    return data;
            } catch {
                // fall back to empty or local
            }
            return [];
        },
        enabled: !!userId,
    });

    // Real-time subscription for new notifications
    useEffect(() => {
        if (!userId)
            return;

        const handleLocalNotify = () => {
            queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
        };

        window.addEventListener("roadcare-notification-changed", handleLocalNotify);

        let channel = null;
        if (isSupabaseConfigured()) {
            try {
                const uniqueId = Math.random().toString(36).slice(2, 9);
                const channelName = `notifications-${userId}-${uniqueId}-${Date.now()}`;
                channel = supabase
                    .channel(channelName)
                    .on("postgres_changes", {
                        event: "INSERT",
                        schema: "public",
                        table: "notifications",
                        filter: `user_id=eq.${userId}`,
                    }, () => {
                        handleLocalNotify();
                    })
                    .subscribe();
            } catch (err) {
                console.warn("Notifications realtime subscription skipped:", err?.message || err);
            }
        }

        return () => {
            window.removeEventListener("roadcare-notification-changed", handleLocalNotify);
            if (channel) {
                try {
                    supabase.removeChannel(channel);
                } catch {
                    // ignore cleanup errors
                }
            }
        };
    }, [userId, queryClient]);
    return query;
}
export function useMarkNotificationRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id) => {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("id", id);
            if (error)
                throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    });
}
export function useMarkAllNotificationsRead() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (userId) => {
            const { error } = await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("user_id", userId)
                .eq("is_read", false);
            if (error)
                throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    });
}
