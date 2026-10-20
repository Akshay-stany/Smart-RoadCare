import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
export function useNotifications(userId) {
    const queryClient = useQueryClient();
    const query = useQuery({
        queryKey: ["notifications", userId],
        queryFn: async () => {
            if (!userId)
                return [];
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", userId)
                .order("created_at", { ascending: false })
                .limit(50);
            if (error)
                throw error;
            return data;
        },
        enabled: !!userId,
    });
    // Real-time subscription for new notifications
    useEffect(() => {
        if (!userId)
            return;
        const channelName = `notifications-${userId}-${Date.now()}`;
        const channel = supabase
            .channel(channelName)
            .on("postgres_changes", {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
        }, () => {
            queryClient.invalidateQueries({ queryKey: ["notifications", userId] });
        })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
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
