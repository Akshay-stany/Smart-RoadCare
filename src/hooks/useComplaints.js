import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useCallback } from "react";

export const INITIAL_CIVIC_COMPLAINTS = [
  {
    id: "a90b4391-4567-4221-a1d2-b677a29e1024",
    complaint_id: "RC-1024",
    title: "Hazardous Pothole on Indiranagar 100ft Road",
    description: "Deep pothole on the main road lane causing traffic delays and vehicle damage.",
    category: "Pothole",
    department: "Roads & Highways",
    latitude: 12.9716,
    longitude: 77.6412,
    address: "Indiranagar 100ft Rd, Bengaluru, Karnataka",
    status: "in_progress",
    priority: "high",
    is_urgent: true,
    image_url: "/images/pothole-defect.jpg",
    completion_image_url: null,
    assigned_officer_id: "23c1092f-b441-45c1-92e1-458bb319c801",
    assigned_officer_name: "Ravi Kumar",
    user_id: "e4b2d130-1092-4f3b-8215-6d0e82c819a1",
    created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
    expected_resolution_date: new Date(Date.now() + 2 * 86400000).toISOString().split("T")[0],
  },
  {
    id: "a90b4391-4567-4221-a1d2-b677a29e1023",
    complaint_id: "RC-1023",
    title: "Severe Road Crack across Lane",
    description: "Transverse and alligator cracks widening due to monsoons.",
    category: "Road Crack",
    department: "Roads & Highways",
    latitude: 12.9352,
    longitude: 77.6245,
    address: "Koramangala 4th Block, Bengaluru",
    status: "pending",
    priority: "medium",
    is_urgent: false,
    image_url: "/images/pothole-defect.jpg",
    completion_image_url: null,
    assigned_officer_id: null,
    assigned_officer_name: null,
    user_id: "e4b2d130-1092-4f3b-8215-6d0e82c819a1",
    created_at: new Date(Date.now() - 5 * 86400000).toISOString(),
  },
  {
    id: "a90b4391-4567-4221-a1d2-b677a29e1022",
    complaint_id: "RC-1022",
    title: "Blocked Storm Drainage Hazard",
    description: "Open drain overflowing onto road curb causing flooding.",
    category: "Drainage Issue",
    department: "Stormwater Drainage",
    latitude: 12.9121,
    longitude: 77.6446,
    address: "HSR Layout Sector 1, Bengaluru",
    status: "resolved",
    priority: "low",
    is_urgent: false,
    image_url: "/images/pothole-defect.jpg",
    completion_image_url: "/images/pothole-repaired.jpg",
    admin_remark: "Drain cleared and asphalt patching completed.",
    assigned_officer_id: "23c1092f-b441-45c1-92e1-458bb319c801",
    assigned_officer_name: "Ravi Kumar",
    user_id: "e4b2d130-1092-4f3b-8215-6d0e82c819a1",
    created_at: new Date(Date.now() - 10 * 86400000).toISOString(),
    resolved_at: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: "a90b4391-4567-4221-a1d2-b677a29e1021",
    complaint_id: "RC-1021",
    title: "Damaged Road Surface & Loose Gravel",
    description: "Surface disintegration causing two-wheelers to skid dangerously.",
    category: "Damaged Road",
    department: "Roads & Highways",
    latitude: 12.9698,
    longitude: 77.7499,
    address: "Whitefield Main Road, Bengaluru",
    status: "pending",
    priority: "high",
    is_urgent: true,
    image_url: "/images/pothole-defect.jpg",
    completion_image_url: null,
    assigned_officer_id: null,
    assigned_officer_name: null,
    user_id: "e4b2d130-1092-4f3b-8215-6d0e82c819a1",
    created_at: new Date(Date.now() - 14 * 86400000).toISOString(),
  },
  {
    id: "a90b4391-4567-4221-a1d2-b677a29e1020",
    complaint_id: "RC-1020",
    title: "Missing Manhole Cover on MG Road",
    description: "Open manhole hazard left unmarked in the center lane.",
    category: "Manhole Cover",
    department: "Sanitation & Sewerage",
    latitude: 12.9756,
    longitude: 77.6066,
    address: "MG Road, Bengaluru, Karnataka",
    status: "pending",
    priority: "critical",
    is_urgent: true,
    image_url: "/images/pothole-defect.jpg",
    completion_image_url: null,
    assigned_officer_id: null,
    assigned_officer_name: null,
    user_id: "e4b2d130-1092-4f3b-8215-6d0e82c819a1",
    created_at: new Date(Date.now() - 18 * 86400000).toISOString(),
  },
];

export function suggestPriority(title = "", description = "") {
  const text = `${title || ""} ${description || ""}`.toLowerCase();
  const highKeywords = ["accident", "sinkhole", "danger", "dangerous", "urgent", "critical", "injury"];
  const mediumKeywords = ["pothole", "crack", "damage", "uneven", "bump"];
  if (highKeywords.some((w) => text.includes(w))) return "high";
  if (mediumKeywords.some((w) => text.includes(w))) return "medium";
  return "low";
}

const LOCAL_COMPLAINTS_KEY = "roadcare_complaints_v2";

export function getLocalComplaints() {
  if (typeof window === "undefined" || !window.localStorage) {
    return INITIAL_CIVIC_COMPLAINTS;
  }
  try {
    const raw = window.localStorage.getItem(LOCAL_COMPLAINTS_KEY);
    if (!raw) {
      window.localStorage.setItem(LOCAL_COMPLAINTS_KEY, JSON.stringify(INITIAL_CIVIC_COMPLAINTS));
      return INITIAL_CIVIC_COMPLAINTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_CIVIC_COMPLAINTS;
  }
}

export function saveLocalComplaints(complaints) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(LOCAL_COMPLAINTS_KEY, JSON.stringify(complaints));
    window.dispatchEvent(new CustomEvent("roadcare-complaint-changed", { detail: complaints }));
  } catch (err) {
    console.error("Failed to save local complaints:", err);
  }
}

function sortByNewest(items) {
  return [...items].sort((a, b) => {
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });
}

export function useComplaints(userId) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["complaints", userId],
    queryFn: async () => {
      // 1. Try Supabase cloud query first if configured
      try {
        let q = supabase.from("complaints").select("*").order("created_at", { ascending: false });
        if (userId) q = q.eq("user_id", userId);
        const { data, error } = await q;
        if (!error && data && data.length > 0) {
          return data;
        }
      } catch {
        // Fall back to local synchronized database
      }

      // 2. Return local synchronized civic database
      const local = getLocalComplaints();
      if (userId) {
        return sortByNewest(local.filter((c) => c.user_id === userId));
      }
      return sortByNewest(local);
    },
    staleTime: 5000,
  });

  // Listen for local real-time events across windows & tabs
  useEffect(() => {
    const handleLocalUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      queryClient.invalidateQueries({ queryKey: ["complaint-by-id"] });
    };

    window.addEventListener("roadcare-complaint-changed", handleLocalUpdate);

    // Also subscribe to Supabase Realtime postgres_changes
    const channelName = `complaints-rt-${Date.now()}`;
    const channel = supabase.channel(channelName);
    channel.on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
    });
    channel.subscribe();

    return () => {
      window.removeEventListener("roadcare-complaint-changed", handleLocalUpdate);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

export function useMyComplaints(userId) {
  return useComplaints(userId);
}

export function useComplaintById(complaintId) {
  return useQuery({
    queryKey: ["complaint-by-id", complaintId],
    queryFn: async () => {
      const normalized = complaintId?.trim().toUpperCase();
      if (!normalized) return null;

      // 1. Try cloud
      try {
        const { data, error } = await supabase
          .from("complaints")
          .select("*")
          .or(`complaint_id.eq.${normalized},id.eq.${complaintId}`)
          .maybeSingle();
        if (!error && data) return data;
      } catch {
        // Fall back to local
      }

      const all = getLocalComplaints();
      return (
        all.find(
          (c) =>
            c.complaint_id?.toUpperCase() === normalized ||
            c.id === complaintId
        ) || null
      );
    },
    enabled: Boolean(complaintId?.trim()),
    staleTime: 5000,
  });
}

export function useCreateComplaint() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (complaint) => {
      const current = getLocalComplaints();
      const nextCodeNumber = 1025 + current.length;
      const complaintCode = `RC-${nextCodeNumber}`;

      const newRecord = {
        id: `cpl-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        complaint_id: complaintCode,
        title: complaint.title,
        description: complaint.description,
        category: complaint.category || "Pothole",
        department: "Roads & Highways",
        latitude: complaint.latitude,
        longitude: complaint.longitude,
        address: complaint.address || "Bengaluru, Karnataka",
        status: "pending",
        priority: complaint.priority || "high",
        is_urgent: Boolean(complaint.is_urgent),
        image_url: complaint.image_url || "/images/pothole-defect.jpg",
        completion_image_url: null,
        user_id: complaint.user_id,
        created_at: new Date().toISOString(),
      };

      // 1. Try cloud insert
      try {
        const { data, error } = await supabase
          .from("complaints")
          .insert({ ...newRecord })
          .select()
          .single();
        if (!error && data) {
          newRecord.id = data.id;
          newRecord.complaint_id = data.complaint_id || complaintCode;
        }
      } catch {
        // Retain local record
      }

      // 2. Save locally and dispatch real-time update
      const updatedList = [newRecord, ...current];
      saveLocalComplaints(updatedList);

      return newRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
    },
  });
}

export function useUpdateComplaintStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status, remarks, assignedOfficerId, assignedOfficerName, completionImageUrl }) => {
      const all = getLocalComplaints();
      const target = all.find((c) => c.id === id || c.complaint_id === id);
      if (!target) throw new Error("Complaint not found");

      const updated = {
        ...target,
        status: status || target.status,
        admin_remark: remarks !== undefined ? remarks : target.admin_remark,
        assigned_officer_id: assignedOfficerId !== undefined ? assignedOfficerId : target.assigned_officer_id,
        assigned_officer_name: assignedOfficerName !== undefined ? assignedOfficerName : target.assigned_officer_name,
        completion_image_url: completionImageUrl !== undefined ? completionImageUrl : target.completion_image_url,
        resolved_at: status === "resolved" ? new Date().toISOString() : target.resolved_at,
        updated_at: new Date().toISOString(),
      };

      // Try cloud update
      try {
        await supabase
          .from("complaints")
          .update({
            status: updated.status,
            admin_remark: updated.admin_remark,
            assigned_officer_id: updated.assigned_officer_id,
            assigned_officer_name: updated.assigned_officer_name,
            completion_image_url: updated.completion_image_url,
            resolved_at: updated.resolved_at,
          })
          .eq("id", target.id);
      } catch {
        // Fall back to local
      }

      const nextList = all.map((c) => (c.id === target.id ? updated : c));
      saveLocalComplaints(nextList);
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      queryClient.invalidateQueries({ queryKey: ["complaint-by-id"] });
    },
  });
}

export const useUpdateComplaint = useUpdateComplaintStatus;

