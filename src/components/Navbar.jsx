import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import NotificationBell from "@/components/NotificationBell";
import RoadCareLogo from "@/components/common/RoadCareLogo";
export default function Navbar() {
    const { user, role, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [mobileOpen, setMobileOpen] = useState(false);
    const handleSignOut = async () => {
        await signOut();
        navigate("/");
    };
    const isActive = (path) => location.pathname === path;
    return (<nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center">
          <RoadCareLogo size="md" theme="dark" />
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1.5">
          <Link to="/">
            <Button variant={isActive("/") ? "secondary" : "ghost"} size="sm" className="font-medium text-slate-700">
              Home
            </Button>
          </Link>
          <Link to="/how-it-works">
            <Button variant={isActive("/how-it-works") ? "secondary" : "ghost"} size="sm" className="font-medium text-slate-700">
              How It Works
            </Button>
          </Link>
          <Link to="/map">
            <Button variant={isActive("/map") ? "secondary" : "ghost"} size="sm" className="font-medium text-slate-700">
              Live Road Map
            </Button>
          </Link>
          <Link to="/about">
            <Button variant={isActive("/about") ? "secondary" : "ghost"} size="sm" className="font-medium text-slate-700">
              About
            </Button>
          </Link>
          {user ? (
            <>
              <Link to={role === "admin" ? "/admin" : role === "officer" ? "/officer" : "/dashboard"}>
                <Button variant={isActive("/dashboard") || isActive("/admin") || isActive("/officer") ? "secondary" : "ghost"} size="sm">
                  <LayoutDashboard className="mr-1.5 h-4 w-4"/>
                  {role === "admin" ? "Admin Portal" : role === "officer" ? "Officer Tasks" : "Dashboard"}
                </Button>
              </Link>
              <NotificationBell />
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                role === "admin" ? "bg-indigo-100 text-indigo-800 border border-indigo-200" :
                role === "officer" ? "bg-amber-100 text-amber-800 border border-amber-200" :
                "bg-emerald-100 text-emerald-800 border border-emerald-200"
              }`}>
                {role || "Citizen"}
              </span>
              <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-slate-600 hover:text-red-600">
                <LogOut className="mr-1.5 h-4 w-4"/>Sign Out
              </Button>
            </>
          ) : (
            <div className="flex items-center gap-2 ml-2">
              <Link to="/auth">
                <Button variant="ghost" size="sm" className="text-slate-700 hover:text-slate-900 font-medium">
                  Login
                </Button>
              </Link>
              <Link to="/auth?tab=signup">
                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-2xs">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6"/> : <Menu className="h-6 w-6"/>}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-card p-4 flex flex-col gap-2">
          <Link to="/" onClick={() => setMobileOpen(false)}>
            <Button variant={isActive("/") ? "secondary" : "ghost"} className="w-full justify-start">
              Home
            </Button>
          </Link>
          <Link to="/how-it-works" onClick={() => setMobileOpen(false)}>
            <Button variant={isActive("/how-it-works") ? "secondary" : "ghost"} className="w-full justify-start">
              How It Works
            </Button>
          </Link>
          <Link to="/map" onClick={() => setMobileOpen(false)}>
            <Button variant={isActive("/map") ? "secondary" : "ghost"} className="w-full justify-start">
              Live Road Map
            </Button>
          </Link>
          <Link to="/about" onClick={() => setMobileOpen(false)}>
            <Button variant={isActive("/about") ? "secondary" : "ghost"} className="w-full justify-start">
              About RoadCare
            </Button>
          </Link>
          {user && (
            <Link to={role === "admin" ? "/admin" : role === "officer" ? "/officer" : "/dashboard"} onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">
                <LayoutDashboard className="mr-2 h-4 w-4" />
                {role === "admin" ? "Admin Dashboard" : role === "officer" ? "Officer Dashboard" : "Citizen Dashboard"}
              </Button>
            </Link>
          )}
          {user ? (
            <Button variant="ghost" className="w-full justify-start text-red-600 hover:bg-red-50" onClick={() => { handleSignOut(); setMobileOpen(false); }}>
              <LogOut className="mr-2 h-4 w-4" />Sign Out
            </Button>
          ) : (
            <div className="flex flex-col gap-2 pt-2 border-t">
              <Link to="/auth" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full">
                  Login
                </Button>
              </Link>
              <Link to="/auth?tab=signup" onClick={() => setMobileOpen(false)}>
                <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  Get Started
                </Button>
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>);
}
