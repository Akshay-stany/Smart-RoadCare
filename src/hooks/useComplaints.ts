import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Complaint = Tables<"complaints">;

function sortByNewest(items: Complaint[]) {
  return [...items].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });
}

function applyRealtimeChange(
  current: Complaint[] | undefined,
  payload: RealtimePostgresChangesPayload<Complaint>,
  scopedUserId?: string,
) {
  const list = current ?? [];
  const event = payload.eventType;
  const nextComplaint = payload.new as Complaint;
  const oldComplaint = payload.old as Complaint;

  if (event === "DELETE") {
    return list.filter((item) => item.id !== oldComplaint.id);
  }

  const belongsToScope = !scopedUserId || nextComplaint.user_id === scopedUserId;
  const withoutCurrent = list.filter((item) => item.id !== nextComplaint.id);

  if (!belongsToScope) {
    return withoutCurrent;
  }

  return sortByNewest([nextComplaint, ...withoutCurrent]);
}

function useComplaintsQuery(userId: string | undefined, enabled: boolean) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["complaints", userId],
    enabled,
    queryFn: async () => {
      let q = supabase.from("complaints").select("*").order("created_at", { ascending: false });
      if (userId) q = q.eq("user_id", userId);
      const { data, error } = await q;
      if (error) throw error;
      return data as Complaint[];
    },
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });

  // Real-time subscription
  useEffect(() => {
    const channelName = `complaints-changes-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const channel = supabase.channel(channelName);
    channel.on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, (payload) => {
      const existingQueries = queryClient.getQueriesData<Complaint[]>({ queryKey: ["complaints"] });

      existingQueries.forEach(([queryKey, currentData]) => {
        const scopedUserId = typeof queryKey?.[1] === "string" ? (queryKey[1] as string) : undefined;
        const nextData = applyRealtimeChange(currentData, payload as RealtimePostgresChangesPayload<Complaint>, scopedUserId);
        queryClient.setQueryData(queryKey, nextData);
      });
    });
    channel.subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}

/** All complaints (public map / admin views). Row visibility is enforced by RLS, not by this hook. */
export function useComplaints(userId?: string) {
  return useComplaintsQuery(userId, true);
}

/**
 * The signed-in user's own complaints. Stays disabled until a user id exists, so a logged-out
 * or still-loading session can never fall through to an unfiltered "all complaints" query.
 */
export function useMyComplaints(userId: string | undefined) {
  return useComplaintsQuery(userId, Boolean(userId));
}

export function useComplaintById(complaintId?: string) {
  return useQuery({
    queryKey: ["complaint-by-id", complaintId],
    queryFn: async () => {
      const normalized = complaintId?.trim().toUpperCase();
      if (!normalized) return null;

      const { data, error } = await supabase
        .from("complaints")
        .select("*")
        .eq("complaint_id", normalized)
        .maybeSingle();

      if (error) throw error;
      return (data as Complaint | null) ?? null;
    },
    enabled: Boolean(complaintId?.trim()),
    staleTime: 60_000,
    gcTime: 10 * 60_000,
  });
}

export function useCreateComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (complaint: Omit<TablesInsert<"complaints">, "complaint_id">) => {
      const { data, error } = await supabase
        .from("complaints")
        .insert({ ...complaint, complaint_id: "temp" } as TablesInsert<"complaints">)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["complaints"] }),
  });
}

export function useUpdateComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"complaints"> & { id: string }) => {
      const { data, error } = await supabase
        .from("complaints")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["complaints"] }),
  });
}

export function useDeleteComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("complaints").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["complaints"] }),
  });
}

// Keyword-based priority suggestion (a simple rule, NOT machine learning; it does not look at the image).
export function suggestPriority(title: string, description: string): "low" | "medium" | "high" {
  const text = `${title} ${description}`.toLowerCase();
  const highKeywords = ["accident", "danger", "dangerous", "emergency", "urgent", "collapse", "sinkhole", "flood", "injury", "fatal", "death"];
  const mediumKeywords = ["pothole", "crack", "broken", "damaged", "leak", "light", "sign"];
  if (highKeywords.some((k) => text.includes(k))) return "high";
  if (mediumKeywords.some((k) => text.includes(k))) return "medium";
  return "low";
}
