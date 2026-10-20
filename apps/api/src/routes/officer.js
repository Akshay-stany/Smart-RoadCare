import { Router } from "express";
import { z } from "zod";
import { requireAuth, requireRole } from "../middleware/auth.js";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

router.use(requireAuth, requireRole(["officer", "admin"]));

// 1. List assigned tasks for officer
router.get("/tasks", async (req, res, next) => {
  try {
    let query = supabaseAdmin
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });

    if (req.userRole === "officer") {
      query = query.eq("assigned_officer_id", req.user.id);
    }

    const { data: tasks, error } = await query;
    if (error) throw error;

    res.json({ success: true, count: tasks?.length || 0, data: tasks || [] });
  } catch (err) {
    next(err);
  }
});

// 2. Submit Resolution Evidence & Complete Task
const ResolveTaskSchema = z.object({
  completionImageUrl: z.string().url().optional().or(z.literal("")),
  remarks: z.string().min(3).max(500),
  status: z.enum(["in_progress", "resolved", "rejected"]).default("resolved"),
});

router.post("/tasks/:id/resolve", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { completionImageUrl, remarks, status } = ResolveTaskSchema.parse(req.body);

    const { data: complaint, error: fetchErr } = await supabaseAdmin
      .from("complaints")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchErr || !complaint) {
      return res.status(404).json({ success: false, error: "Task complaint not found" });
    }

    // Role verification: Officer can only update their own assigned task
    if (req.userRole === "officer" && complaint.assigned_officer_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: "Forbidden. You are not the assigned officer for this task.",
      });
    }

    const { data: updated, error: updateErr } = await supabaseAdmin
      .from("complaints")
      .update({
        status,
        completion_image_url: completionImageUrl || null,
        admin_remark: remarks,
        resolved_at: status === "resolved" ? new Date().toISOString() : undefined,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Record status history event
    await supabaseAdmin.from("complaint_status_history").insert({
      complaint_id: id,
      old_status: complaint.status,
      new_status: status,
      changed_by: req.user.id,
      actor_name: `Officer (${req.user.email})`,
      remark: remarks,
    });

    res.json({ success: true, data: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ success: false, error: err.errors });
    }
    next(err);
  }
});

export default router;
