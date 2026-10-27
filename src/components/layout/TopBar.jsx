import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import NotificationBell from "@/components/NotificationBell";
import { Menu, User, LogOut, Bell, Shield, HardHat, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function TopBar({ onMenuClick }) {
  const { user, role, switchRole, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isAdminView = location.pathname.startsWith("/admin") || role === "admin";
  const isOfficerView = !isAdminView && (location.pathname.startsWith("/officer") || role === "officer");

  const handleSwitchRole = async (newRole) => {
    if (switchRole) {
      await switchRole(newRole);
    }
    if (newRole === "admin") navigate("/admin");
    else if (newRole === "officer") navigate("/officer");
    else navigate("/dashboard");
  };

  const getRoleBadge = () => {
    if (isAdminView) {
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs py-0.5">
          Administrator
        </Badge>
      );
    }
    if (isOfficerView) {
      return (
        <Badge variant="outline" className="bg-sky-50 text-sky-700 border-sky-200 text-xs py-0.5">
          Maintenance Officer
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs py-0.5">
        Citizen
      </Badge>
    );
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
          <span className="font-semibold text-slate-800">RoadCare Platform</span>
          <span>•</span>
          <span className="text-xs">{getRoleBadge()}</span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Notification Bell */}
        <NotificationBell />

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2.5 p-1.5 rounded-full hover:bg-slate-100 transition-colors focus:outline-none">
            <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-xs font-bold uppercase shadow-xs ${
              isAdminView ? "bg-purple-700" : "bg-slate-800"
            }`}>
              {user?.email?.charAt(0) || "U"}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-800 leading-tight">
                {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "User"}
              </span>
              <span className="text-[10px] text-slate-500 capitalize leading-tight">
                {isAdminView ? "Administrator" : isOfficerView ? "Maintenance Officer" : role || "Citizen"}
              </span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-semibold text-slate-900 leading-none">
                  {user?.user_metadata?.full_name || "RoadCare User"}
                </p>
                <p className="text-[11px] leading-none text-slate-500 truncate">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/profile" className="cursor-pointer">
                <User className="w-4 h-4 mr-2 text-slate-500" />
                Profile Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/notifications" className="cursor-pointer">
                <Bell className="w-4 h-4 mr-2 text-slate-500" />
                Notifications
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[10px] text-slate-400 uppercase tracking-wider font-bold py-1">
              Switch Persona View
            </DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => handleSwitchRole("citizen")}
              className={`cursor-pointer text-xs ${!isAdminView && !isOfficerView ? "bg-emerald-50 text-emerald-800 font-semibold" : ""}`}
            >
              <User className="w-3.5 h-3.5 mr-2 text-emerald-600" />
              Citizen View
              {!isAdminView && !isOfficerView && <Check className="w-3.5 h-3.5 ml-auto text-emerald-600" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleSwitchRole("officer")}
              className={`cursor-pointer text-xs ${isOfficerView ? "bg-sky-50 text-sky-800 font-semibold" : ""}`}
            >
              <HardHat className="w-3.5 h-3.5 mr-2 text-sky-600" />
              Field Officer View
              {isOfficerView && <Check className="w-3.5 h-3.5 ml-auto text-sky-600" />}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleSwitchRole("admin")}
              className={`cursor-pointer text-xs ${isAdminView ? "bg-purple-50 text-purple-800 font-semibold" : ""}`}
            >
              <Shield className="w-3.5 h-3.5 mr-2 text-purple-600" />
              Municipal Admin View
              {isAdminView && <Check className="w-3.5 h-3.5 ml-auto text-purple-600" />}
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="text-rose-600 focus:text-rose-600 cursor-pointer"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
