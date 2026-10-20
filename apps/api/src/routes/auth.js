import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", req.user.id)
      .maybeSingle();

    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.userRole,
        fullName: profile?.full_name || req.user.user_metadata?.full_name || null,
        emailConfirmedAt: req.user.email_confirmed_at,
        createdAt: req.user.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
