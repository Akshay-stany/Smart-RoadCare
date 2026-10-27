import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { supabaseAdmin } from "../config/supabase.js";

const router = Router();

const SignupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(2),
  role: z.enum(["citizen", "officer", "admin"]).default("citizen"),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  portal: z.enum(["citizen", "admin"]).optional(),
});

// 1. Direct Registration without 2FA / OTP (Auto-confirmed via Supabase Admin)
router.post("/signup", async (req, res, next) => {
  try {
    const { email, password, fullName, role } = SignupSchema.parse(req.body);
    const cleanEmail = email.trim().toLowerCase();

    // Check if user already exists
    const { data: userList } = await supabaseAdmin.auth.admin.listUsers();
    const existing = userList?.users?.find(
      (u) => u.email?.toLowerCase() === cleanEmail
    );

    let userId;
    if (existing) {
      return res.status(409).json({
        success: false,
        error: "An account with this email address already exists. Please sign in directly.",
      });
    }

    // Create user with email_confirm: true so no verification code / OTP is required
    const { data: createData, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          role: role || "citizen",
        },
      });

    if (createError) throw createError;
    userId = createData?.user?.id;

    if (userId) {
      // Upsert profile record
      try {
        await supabaseAdmin.from("profiles").upsert({
          id: userId,
          user_id: userId,
          email: cleanEmail,
          full_name: fullName,
          role: role || "citizen",
        });
      } catch (profErr) {
        console.warn("Profile creation notice:", profErr.message);
      }

      // Upsert user_roles record (delete prior trigger row if any, then insert exact role)
      try {
        await supabaseAdmin.from("user_roles").delete().eq("user_id", userId);
        await supabaseAdmin.from("user_roles").insert({
          user_id: userId,
          role: role || "citizen",
        });
      } catch (roleErr) {
        console.warn("User role creation notice:", roleErr.message);
      }
    }

    res.status(201).json({
      success: true,
      message: "Account created successfully with direct instant access.",
      user: {
        id: userId,
        email: cleanEmail,
        fullName,
        role: role || "citizen",
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: err.errors[0]?.message || "Invalid input data",
      });
    }
    next(err);
  }
});

// 2. Direct Email + Password Login
router.post("/login", async (req, res, next) => {
  try {
    const { email, password, portal } = LoginSchema.parse(req.body);
    const cleanEmail = email.trim().toLowerCase();

    // Attempt direct sign-in via Supabase
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      return res.status(401).json({
        success: false,
        error: error.message || "Invalid email or password.",
      });
    }

    const user = data.user;

    // Fetch user role from user_roles or profiles
    let resolvedRole = user.user_metadata?.role || "citizen";
    try {
      const { data: roleRow } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleRow?.role) {
        resolvedRole = roleRow.role;
      } else {
        const { data: profileRow } = await supabaseAdmin
          .from("profiles")
          .select("role, full_name")
          .eq("id", user.id)
          .maybeSingle();
        if (profileRow?.role) resolvedRole = profileRow.role;
      }
    } catch (roleErr) {
      console.warn("Role resolution note:", roleErr.message);
    }



    res.json({
      success: true,
      message: "Authentication successful.",
      session: data.session,
      user: {
        id: user.id,
        email: user.email,
        role: resolvedRole,
        fullName: user.user_metadata?.full_name || cleanEmail.split("@")[0],
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: err.errors[0]?.message || "Invalid input data",
      });
    }
    next(err);
  }
});

// 3. Current authenticated user profile
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    let profile = null;
    try {
      const { data: p } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("id", req.user.id)
        .maybeSingle();
      profile = p;
    } catch {
      // ignore
    }

    res.json({
      success: true,
      user: {
        id: req.user.id,
        email: req.user.email,
        role: req.userRole || profile?.role || "citizen",
        fullName: profile?.full_name || req.user.user_metadata?.full_name || req.user.email?.split("@")[0],
        emailConfirmedAt: req.user.email_confirmed_at,
        createdAt: req.user.created_at,
      },
    });
  } catch (err) {
    next(err);
  }
});

export default router;
