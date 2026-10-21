import { supabaseAdmin } from "../config/supabase.js";

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Missing or invalid Authorization header. Expected Bearer token.",
      });
    }

    const token = authHeader.split(" ")[1];

    // Isolated development-only mock token bypass (strictly disabled in production)
    const isDevMockAllowed =
      process.env.NODE_ENV !== "production" &&
      process.env.ALLOW_DEV_MOCK_AUTH === "true";

    if (
      isDevMockAllowed &&
      (token.startsWith("mock-jwt-token-") || token.startsWith("demo-") || token === "local-dev-token")
    ) {
      const email = req.headers["x-user-email"] || "citizen@roadcare.org";
      req.user = {
        id: req.headers["x-user-id"] || "e4b2d130-1092-4f3b-8215-6d0e82c819a1",
        email,
        user_metadata: { full_name: email.split("@")[0] },
      };
      const { data: roleRow } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", req.user.id)
        .maybeSingle();
      req.userRole = roleRow?.role || "citizen";
      return next();
    }

    // Genuine Supabase Cloud JWT validation
    try {
      const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
      if (!error && user) {
        // Fetch user role from user_roles table
        const { data: roleRow } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        req.user = user;
        req.userRole = roleRow?.role || "citizen";
        return next();
      }
    } catch (authErr) {
      console.warn("Supabase auth verification error:", authErr.message);
    }

    return res.status(401).json({
      success: false,
      error: "Invalid or expired access token.",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Authentication service error.",
      details: err.message,
    });
  }
}

export function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: "Authentication required." });
    }

    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Requires one of roles: [${allowedRoles.join(", ")}]. Current role: ${req.userRole}.`,
      });
    }

    next();
  };
}
