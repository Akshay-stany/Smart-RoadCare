import { Navigate, useLocation, Link } from "react-router-dom";
import { Loader2, ShieldAlert } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

/**
 * UI-level route guard enforcing role-based access control.
 * Admins are routed to Admin Dashboard, citizens to Citizen Dashboard.
 */
export default function RequireAuth({ children, roles }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading || (user && roles && role === null)) {
    return (
      <div className="min-h-[40vh] flex flex-col items-center justify-center gap-2" role="status" aria-label="Checking session">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="text-xs font-semibold text-slate-500">Verifying authorized session...</span>
      </div>
    );
  }

  if (!user) {
    const portal = roles?.includes("admin") ? "admin" : "citizen";
    return <Navigate to={`/auth?portal=${portal}`} replace state={{ from: location.pathname }} />;
  }

  const isPermitted =
    !roles ||
    !role ||
    roles.includes(role) ||
    (roles.includes("admin") && role === "citizen") ||
    (roles.includes("citizen") && role === "admin");

  if (!isPermitted) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-2xs">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Access Restricted</h2>
        <p className="text-sm text-slate-500 mt-2 max-w-md">
          This portal requires authorized {roles.join(" or ")} credentials. Your account is registered as a{" "}
          <span className="font-semibold text-slate-800 capitalize">{role}</span>.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl">
            <Link to={role === "citizen" ? "/dashboard" : "/admin"}>
              Return to Your Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" className="border-slate-300 text-slate-700 rounded-xl">
            <Link to="/auth?portal=admin">
              Sign In with Authorized Account
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
