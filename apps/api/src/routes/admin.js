import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

// Protect all admin endpoints
router.use(requireAuth, requireRole(["admin"]));

// 1. Admin Dashboard Analytics Aggregations
router.get("/dashboard", async (_req, res, next) => {
  try {
    const { data: complaints, error } = await supabaseAdmin.from("complaints").select("*");
    if (error) throw error;

    const list = complaints || [];
    const total = list.length;
    const pending = list.filter((c) => c.status === "pending").length;
    const inProgress = list.filter((c) => c.status === "in_progress").length;
    const resolved = list.filter((c) => c.status === "resolved").length;
    const highPriority = list.filter((c) => c.priority === "high" || c.priority === "critical").length;

    // Monthly aggregation
    const monthlyMap = {};
    for (const c of list) {
      const month = new Date(c.created_at).toLocaleString("default", { month: "short" });
      if (!monthlyMap[month]) monthlyMap[month] = { submitted: 0, resolved: 0 };
      monthlyMap[month].submitted += 1;
      if (c.status === "resolved") monthlyMap[month].resolved += 1;
    }

    // Category breakdown
    const categoryMap = {};
    for (const c of list) {
      const cat = c.category || "other";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    }

    res.json({
      success: true,
      stats: {
        total,
        pending,
        inProgress,
        resolved,
        highPriority,
        resolutionRatePercent: total > 0 ? Math.round((resolved / total) * 100) : 0,
      },
      monthlyTrends: Object.entries(monthlyMap).map(([m, vals]) => ({
        month: m,
        ...vals,
      })),
      categoryBreakdown: categoryMap,
    });
  } catch (err) {
    next(err);
  }
});

// 2. Assign Officer to Complaint
const AssignOfficerSchema = z.object({
  complaintId: z.string().uuid(),
  officerId: z.string().uuid(),
  officerName: z.string().min(2),
  expectedCompletionDate: z.string().optional(),
});

router.post("/assign", async (req, res, next) => {
  try {
    const { complaintId, officerId, officerName, expectedCompletionDate } =
      AssignOfficerSchema.parse(req.body);

    const { data: updated, error } = await supabaseAdmin
      .from("complaints")
      .update({
        assigned_officer_id: officerId,
        assigned_officer_name: officerName,
        expected_resolution_date: expectedCompletionDate || null,
        status: "in_progress",
      })
      .eq("id", complaintId)
      .select()
      .single();

    if (error) throw error;

    // Record status history
    await supabaseAdmin.from("complaint_status_history").insert({
      complaint_id: complaintId,
      old_status: "verified",
      new_status: "in_progress",
      changed_by: req.user.id,
      actor_name: req.user.email,
      remark: `Assigned to field maintenance officer ${officerName}.`,
    });

    // Write audit log
    await supabaseAdmin.from("audit_logs").insert({
      user_id: req.user.id,
      action: "ASSIGN_OFFICER",
      resource_type: "complaint",
      resource_id: complaintId,
      metadata: { officerId, officerName, expectedCompletionDate },
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors });
    }
    next(err);
  }
});

// 3. Complaint Status Transition with Required State Machine Rules
const LEGAL_TRANSITIONS = {
  pending: ["verified", "rejected", "duplicate"],
  verified: ["in_progress", "rejected"],
  in_progress: ["resolved", "rejected"],
  resolved: ["closed", "in_progress"], // in_progress if citizen reopens
  rejected: ["pending"], // reopen
  duplicate: [],
  closed: [],
};

router.post("/status-transition", async (req, res, next) => {
  try {
    const { complaintId, targetStatus, reason } = req.body;

    const { data: complaint, error: fetchErr } = await supabaseAdmin
      .from("complaints")
      .select("*")
      .eq("id", complaintId)
      .single();

    if (fetchErr || !complaint) {
      return res.status(404).json({ success: false, error: "Complaint not found" });
    }

    const allowed = LEGAL_TRANSITIONS[complaint.status] || [];
    if (!allowed.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        error: `Illegal state transition from '${complaint.status}' to '${targetStatus}'. Allowed: [${allowed.join(", ")}].`,
      });
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from("complaints")
      .update({
        status: targetStatus,
        resolved_at: targetStatus === "resolved" ? new Date().toISOString() : undefined,
      })
      .eq("id", complaintId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Log status history
    await supabaseAdmin.from("complaint_status_history").insert({
      complaint_id: complaintId,
      old_status: complaint.status,
      new_status: targetStatus,
      changed_by: req.user.id,
      actor_name: req.user.email,
      remark: reason || `Status changed from ${complaint.status} to ${targetStatus}`,
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
});

export default router;
