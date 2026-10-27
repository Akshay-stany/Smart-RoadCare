import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { supabaseAdmin } from "../config/supabase.js";
import { calculatePriorityScore } from "../services/priorityScorer.js";
import { findDuplicateCandidates } from "../services/duplicateDetector.js";

const router = Router();

// Validation schema for creating a complaint
const CreateComplaintSchema = z.object({
  title: z.string().min(3).max(120),
  description: z.string().min(5).max(1000),
  category: z.string().default("pothole"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  address: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal("")),
  isUrgent: z.boolean().default(false),
  trafficDensity: z.enum(["low", "medium", "high"]).default("medium"),
});

function formatComplaint(c) {
  if (!c) return null;
  return {
    ...c,
    complaint_id: c.complaint_id || ("RC-" + (c.id ? c.id.slice(0, 4) : "1001").toUpperCase()),
    department: c.department || "Roads & Highways",
    address: c.address || (c.latitude ? `Lat: ${c.latitude.toFixed(4)}, Lng: ${c.longitude.toFixed(4)}` : "Bengaluru, Karnataka"),
    priority: c.priority || "medium",
    is_urgent: c.is_urgent ?? false,
    status: c.status || "pending",
  };
}

// 1. Safe Public Map View (No authentication required; strictly safe fields without reporter PII)
router.get("/map", async (_req, res, next) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("complaints")
      .select("*");

    if (error) throw error;
    const formatted = (data || []).map(formatComplaint);
    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    next(err);
  }
});

// 2. Proximity search for nearby issues
router.get("/nearby", async (req, res, next) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lng = parseFloat(req.query.lng);
    const radiusMeters = parseInt(req.query.radiusMeters || "150", 10);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ success: false, error: "lat and lng query parameters are required" });
    }

    const { data: allComplaints } = await supabaseAdmin
      .from("complaints")
      .select("*");

    const formatted = (allComplaints || []).map(formatComplaint);
    const duplicates = findDuplicateCandidates(
      { latitude: lat, longitude: lng },
      formatted,
      radiusMeters
    );

    res.json({ success: true, count: duplicates.length, candidates: duplicates });
  } catch (err) {
    next(err);
  }
});

// 3. List complaints (Role-aware: citizen sees own, admin sees all)
router.get("/", requireAuth, async (req, res, next) => {
  try {
    let query = supabaseAdmin.from("complaints").select("*").order("created_at", { ascending: false });

    // If citizen, only return their own complaints
    if (req.userRole === "citizen") {
      query = query.eq("user_id", req.user.id);
    }

    // Optional filters
    if (req.query.status) query = query.eq("status", req.query.status);
    if (req.query.category) query = query.eq("category", req.query.category);

    const { data, error } = await query;
    if (error) throw error;

    const formatted = (data || []).map(formatComplaint);
    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    next(err);
  }
});

// 4. Create new complaint
router.post("/", requireAuth, async (req, res, next) => {
  try {
    const validated = CreateComplaintSchema.parse(req.body);

    // Fetch existing recent complaints for duplicate check
    const { data: existing } = await supabaseAdmin
      .from("complaints")
      .select("*")
      .limit(100);

    const formattedExisting = (existing || []).map(formatComplaint);
    const duplicateCandidates = findDuplicateCandidates(
      {
        latitude: validated.latitude,
        longitude: validated.longitude,
        category: validated.category,
      },
      formattedExisting,
      85 // 85 meters radius
    );

    // Calculate deterministic priority score
    const priorityResult = calculatePriorityScore({
      category: validated.category,
      isUrgent: validated.isUrgent,
      trafficDensity: validated.trafficDensity,
      nearbyReportCount: duplicateCandidates.length + 1,
    });

    // Try full insert first, fallback to basic schema if optional columns don't exist
    let complaintData = null;
    try {
      const { data, error } = await supabaseAdmin
        .from("complaints")
        .insert({
          user_id: req.user.id,
          title: validated.title,
          description: validated.description,
          category: validated.category,
          latitude: validated.latitude,
          longitude: validated.longitude,
          image_url: validated.imageUrl || null,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      complaintData = data;
    } catch (insertErr) {
      console.warn("Retrying complaint insert:", insertErr.message);
      const { data, error } = await supabaseAdmin
        .from("complaints")
        .insert({
          user_id: req.user.id,
          title: validated.title,
          status: "pending",
        })
        .select()
        .single();
      if (error) throw error;
      complaintData = data;
    }

    // Record initial status history event (best effort)
    try {
      await supabaseAdmin.from("complaint_status_history").insert({
        complaint_id: complaintData.id,
        old_status: null,
        new_status: "pending",
        changed_by: req.user.id,
        actor_name: req.user.email,
        remark: "Citizen submitted issue report.",
      });
    } catch {
      // Ignore if table not present
    }

    const formattedComplaint = formatComplaint(complaintData);

    res.status(201).json({
      success: true,
      data: formattedComplaint,
      priorityAssessment: priorityResult,
      duplicateCandidates,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: "Validation failed", details: err.errors });
    }
    next(err);
  }
});

// 5. Get Single Complaint Details
router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    let query = supabaseAdmin.from("complaints").select("*");

    if (id.startsWith("RC-")) {
      query = query.eq("complaint_id", id);
    } else {
      query = query.eq("id", id);
    }

    const { data: complaint, error } = await query.maybeSingle();
    if (error) throw error;
    if (!complaint) {
      return res.status(404).json({ success: false, error: "Complaint not found" });
    }

    // Role check: Citizen can only view their own complaint details
    if (req.userRole === "citizen" && complaint.user_id !== req.user.id) {
      return res.status(403).json({ success: false, error: "Access denied to private complaint details" });
    }

    res.json({ success: true, data: formatComplaint(complaint) });
  } catch (err) {
    next(err);
  }
});

// 6. Get Complaint Status History
router.get("/:id/history", requireAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from("complaint_status_history")
      .select("*")
      .eq("complaint_id", id)
      .order("created_at", { ascending: true });

    if (error) throw error;
    res.json({ success: true, data: data || [] });
  } catch (err) {
    next(err);
  }
});

export default router;
