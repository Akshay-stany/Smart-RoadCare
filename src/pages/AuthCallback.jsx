import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { fetchUserData, role: currentRole } = useAuth();
  const [status, setStatus] = useState("Verifying authentication...");
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function handleAuthCallback() {
      // 1. Check for error in query or hash
      const error = searchParams.get("error");
      const errorDesc = searchParams.get("error_description");
      if (error) {
        setErrorMsg(errorDesc || error || "Google authentication failed.");
        return;
      }

      if (!isSupabaseConfigured()) {
        // Fallback for local demo
        setStatus("Redirecting to dashboard...");
        setTimeout(() => {
          navigate("/dashboard");
        }, 600);
        return;
      }

      try {
        setStatus("Finalizing secure session...");
        const { data, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) throw sessionErr;

        const session = data?.session;
        if (!session?.user) {
          // If no session found immediately, wait for onAuthStateChange
          const { data: authListener } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
              if (newSession?.user && isMounted) {
                authListener?.subscription?.unsubscribe();
                await routeUserByRole(newSession.user);
              }
            }
          );

          // Timeout after 8 seconds
          setTimeout(() => {
            if (isMounted && !session?.user) {
              setErrorMsg("Authentication session timed out. Please try logging in again.");
            }
          }, 8000);
          return;
        }

        await routeUserByRole(session.user);
      } catch (err) {
        if (isMounted) {
          setErrorMsg(err.message || "Failed to finalize authentication session.");
        }
      }
    }

    async function routeUserByRole(user) {
      if (!isMounted) return;
      setStatus("Determining assigned role and permissions...");

      let assignedRole = "citizen";

      try {
        // Query user_roles table
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .maybeSingle();

        if (roleRow?.role) {
          assignedRole = roleRow.role;
        } else {
          // Check user metadata or email conventions
          const metaRole = user.user_metadata?.role;
          if (metaRole === "admin" || user.email?.toLowerCase().includes("admin")) {
            assignedRole = "admin";
          } else if (metaRole === "officer" || user.email?.toLowerCase().includes("officer")) {
            assignedRole = "officer";
          }
        }

        if (fetchUserData) {
          await fetchUserData(user.id);
        }
      } catch (err) {
        console.warn("Could not query user_roles; defaulting to citizen:", err);
      }

      if (!isMounted) return;

      setStatus(`Welcome! Redirecting to ${assignedRole} portal...`);

      if (assignedRole === "admin") {
        navigate("/admin", { replace: true });
      } else if (assignedRole === "officer") {
        navigate("/officer", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    }

    handleAuthCallback();

    return () => {
      isMounted = false;
    };
  }, [navigate, searchParams, fetchUserData]);

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 p-8 shadow-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Authentication Failed</h2>
          <p className="text-sm text-slate-600">{errorMsg}</p>
          <div className="pt-2">
            <Button
              onClick={() => navigate("/auth")}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
            >
              Back to Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/90 p-8 shadow-sm text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">RoadCare Authentication</h2>
        <p className="text-xs text-slate-500 font-medium">{status}</p>
      </div>
    </div>
  );
}
