import { Navigate, useLocation } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
/**
 * UI-level route guard. This only improves UX — real authorization is enforced by
 * database RLS today and by the API in later phases.
 */
export default function RequireAuth({ children, roles }) {
    const { user, role, loading } = useAuth();
    const location = useLocation();
    if (loading || (user && roles && role === null)) {
        return (<div className="min-h-[40vh] flex items-center justify-center" role="status" aria-label="Checking session">
        <Loader2 className="h-8 w-8 animate-spin text-primary"/>
      </div>);
    }
    if (!user) {
        return <Navigate to="/auth" replace state={{ from: location.pathname }}/>;
    }
    if (roles && role && !roles.includes(role)) {
        return (<div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Access denied. You do not have permission to view this page.</p>
      </div>);
    }
    return <>{children}</>;
}
