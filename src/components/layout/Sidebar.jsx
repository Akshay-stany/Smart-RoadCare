import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import RoadCareLogo from "@/components/common/RoadCareLogo";
import {
  LayoutDashboard,
  AlertCircle,
  FileText,
  MapPin,
  Camera,
  Bell,
  User,
  ClipboardList,
  UserCheck,
  BarChart3,
  Users,
  Settings,
  CheckSquare,
  LogOut,
  Shield,
} from "lucide-react";

export default function Sidebar({ className = "" }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, switchRole, signOut, user } = useAuth();

  // Determine active view: If current path is in /admin or active role is admin
  const isAdminView = location.pathname.startsWith("/admin") || role === "admin";
  const isOfficerView = !isAdminView && (location.pathname.startsWith("/officer") || role === "officer");

  const handleSwitchPortal = async (target) => {
    if (target === "admin") {
      if (switchRole) await switchRole("admin");
      navigate("/admin");
    } else {
      if (switchRole) await switchRole("citizen");
      navigate("/dashboard");
    }
  };

  const getNavLinks = () => {
    if (isAdminView) {
      return [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { label: "Manage Complaints", href: "/admin/complaints", icon: ClipboardList },
        { label: "Assign Officers", href: "/admin/assign", icon: UserCheck },
        { label: "Live Map", href: "/map", icon: MapPin },
        { label: "Live Detection", href: "/live-detection", icon: Camera },
        { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
        { label: "Users", href: "/admin/users", icon: Users },
        { label: "Notifications", href: "/notifications", icon: Bell },
        { label: "Settings", href: "/admin/settings", icon: Settings },
      ];
    }

    if (isOfficerView) {
      return [
        { label: "Dashboard", href: "/officer", icon: LayoutDashboard },
        { label: "Assigned Tasks", href: "/officer/tasks", icon: CheckSquare },
        { label: "Update Status", href: "/officer/status", icon: ClipboardList },
        { label: "Map View", href: "/map", icon: MapPin },
        { label: "Live Detection", href: "/live-detection", icon: Camera },
        { label: "Profile", href: "/profile", icon: User },
      ];
    }

    // Default: Citizen
    return [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Report Issue", href: "/report", icon: AlertCircle },
      { label: "My Complaints", href: "/my-complaints", icon: FileText },
      { label: "Map View", href: "/map", icon: MapPin },
      { label: "Live Detection", href: "/live-detection", icon: Camera },
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Profile", href: "/profile", icon: User },
    ];
  };

  const navLinks = getNavLinks();

  const isActive = (href) => {
    if (href === "/dashboard" || href === "/admin" || href === "/officer") {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside
      className={`w-64 bg-[#0B1328] text-white flex flex-col shrink-0 h-screen sticky top-0 border-r border-slate-800/60 ${className}`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 gap-3 border-b border-slate-800/80">
        <RoadCareLogo
          size="sm"
          theme="light"
          subtext={
            isAdminView
              ? "Admin Console"
              : isOfficerView
              ? "Officer Portal"
              : "Civic Portal"
          }
        />
      </div>

      {/* Portal Mode Switcher Option in Sidebar */}
      <div className="px-3 pt-3 pb-1">
        <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 mb-1.5 flex items-center justify-between">
            <span>Portal Mode</span>
            <span
              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                isAdminView
                  ? "bg-purple-900/60 text-purple-300 border border-purple-700/50"
                  : "bg-emerald-950 text-emerald-300 border border-emerald-800/50"
              }`}
            >
              {isAdminView ? "Admin Mode" : "Citizen Mode"}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-1 bg-slate-950/80 p-1 rounded-lg border border-slate-800/60">
            <button
              type="button"
              onClick={() => handleSwitchPortal("admin")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all ${
                isAdminView
                  ? "bg-purple-600 text-white shadow-xs font-bold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin</span>
            </button>
            <button
              type="button"
              onClick={() => handleSwitchPortal("citizen")}
              className={`flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md text-xs font-semibold transition-all ${
                !isAdminView
                  ? "bg-emerald-600 text-white shadow-xs font-bold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Citizen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navLinks.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                active
                  ? isAdminView
                    ? "bg-purple-600 text-white shadow-sm font-semibold"
                    : "bg-emerald-600 text-white shadow-sm font-semibold"
                  : "text-slate-300 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  active ? "text-white" : "text-slate-400"
                }`}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer / User info */}
      <div className="p-4 border-t border-slate-800/80 bg-[#091022]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white uppercase shrink-0 ${
              isAdminView ? "bg-purple-700" : "bg-slate-700"
            }`}>
              {user?.email?.charAt(0) || "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-white truncate">
                {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}
              </p>
              <p className="text-[10px] text-slate-400 capitalize truncate">
                {isAdminView ? "Administrator" : isOfficerView ? "Maintenance Officer" : role || "Citizen"}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            title="Sign out"
            className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
