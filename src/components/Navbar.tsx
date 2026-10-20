import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import NotificationBell from "@/components/NotificationBell";

export default function Navbar() {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <img
            src="/roadwise-logo.svg"
            alt="RoadWise Connect logo"
            className="h-9 w-9 rounded-lg"
          />
          <span className="text-foreground">RoadWise Connect</span>
        </Link>

        {/* Desktop */}
        <div className="hidden md:flex items-center gap-1">
          <Link to="/map">
            <Button variant={isActive("/map") ? "secondary" : "ghost"} size="sm">Map View</Button>
          </Link>
          {user && (
            <Link to={role === "admin" ? "/admin" : "/dashboard"}>
              <Button variant={isActive("/dashboard") || isActive("/admin") ? "secondary" : "ghost"} size="sm">
                <LayoutDashboard className="mr-1 h-4 w-4" />Dashboard
              </Button>
            </Link>
          )}
          {user && <NotificationBell />}
          {user ? (
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="mr-1 h-4 w-4" />Sign Out
            </Button>
          ) : (
            <Link to="/auth">
              <Button size="sm">Sign In</Button>
            </Link>
          )}
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-card p-4 flex flex-col gap-2">
          <Link to="/map" onClick={() => setMobileOpen(false)}>
            <Button variant="ghost" className="w-full justify-start">Map View</Button>
          </Link>
          {user && (
            <Link to={role === "admin" ? "/admin" : "/dashboard"} onClick={() => setMobileOpen(false)}>
              <Button variant="ghost" className="w-full justify-start">Dashboard</Button>
            </Link>
          )}
          {user ? (
            <Button variant="ghost" className="w-full justify-start" onClick={() => { handleSignOut(); setMobileOpen(false); }}>Sign Out</Button>
          ) : (
            <Link to="/auth" onClick={() => setMobileOpen(false)}>
              <Button className="w-full">Sign In</Button>
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
