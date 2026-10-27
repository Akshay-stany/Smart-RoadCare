import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import RoadCareLogo from "@/components/common/RoadCareLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  ShieldCheck,
  Building2,
  Eye,
  EyeOff,
  AlertCircle,
} from "lucide-react";

export default function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signIn, signUp, signOut, role, switchRole } = useAuth();

  // Portal: 'citizen' or 'admin'
  const portalParam = searchParams.get("portal");
  const portal = portalParam === "admin" ? "admin" : "citizen";
  const isAdminPortal = portal === "admin";

  // Mode: 'signin' or 'signup'
  const [mode, setMode] = useState(
    searchParams.get("tab") === "signup" ? "signup" : "signin"
  );

  const [loading, setLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Switch between Citizen and Admin portal views
  const switchPortal = (targetPortal) => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFullName("");
    setMode("signin");
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("portal", targetPortal);
      p.delete("tab");
      return p;
    });
  };

  const switchMode = (targetMode) => {
    setMode(targetMode);
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (targetMode === "signup") {
        p.set("tab", "signup");
      } else {
        p.delete("tab");
      }
      return p;
    });
  };

  // If already logged in, redirect to the appropriate dashboard
  useEffect(() => {
    if (user && role) {
      if (isAdminPortal) {
        navigate("/admin");
      } else {
        if (role === "citizen") {
          navigate("/dashboard");
        } else if (role === "admin") {
          navigate("/admin");
        } else if (role === "officer") {
          navigate("/officer");
        }
      }
    }
  }, [user, role, isAdminPortal, navigate]);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "signup") {
        if (!fullName.trim()) {
          toast.error("Please enter your full name");
          setLoading(false);
          return;
        }
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters long");
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          toast.error("Passwords do not match");
          setLoading(false);
          return;
        }

        // Register with appropriate role
        const targetRole = isAdminPortal ? "admin" : "citizen";
        await signUp(email, password, fullName, targetRole);

        if (isAdminPortal) {
          if (switchRole) await switchRole("admin");
          toast.success("Administrator account created successfully! Welcome to RoadCare.");
          navigate("/admin");
        } else {
          toast.success("Account created successfully! Welcome to RoadCare.");
          navigate("/dashboard");
        }
      } else {
        // Sign-in Flow
        const authData = await signIn(email, password, portal);

        if (isAdminPortal) {
          if (switchRole) await switchRole("admin");
          toast.success("Welcome back! Signed in to Admin Portal.");
          navigate("/admin");
        } else {
          toast.success("Welcome back! Signed in successfully.");
          navigate("/dashboard");
        }
      }
    } catch (err) {
      toast.error(err.message || "Authentication failed. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans selection:bg-emerald-500 selection:text-white">
      {/* Left Column: Authentic Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-[420px] space-y-6">
          {/* Logo Header */}
          <div className="flex items-center justify-between">
            <Link to="/" className="inline-block">
              <RoadCareLogo
                size="md"
                theme="dark"
                subtext={isAdminPortal ? "ADMIN PORTAL" : "CIVIC PORTAL"}
              />
            </Link>

            {/* Portal Switch Badge */}
            <button
              type="button"
              onClick={() => switchPortal(isAdminPortal ? "citizen" : "admin")}
              className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                isAdminPortal
                  ? "bg-sky-50 text-sky-800 border-sky-200 hover:bg-sky-100"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
              }`}
            >
              {isAdminPortal ? "Switch to Citizen Portal" : "Admin Login"}
            </button>
          </div>



          {/* Heading */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                  isAdminPortal ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {isAdminPortal ? (
                  <Building2 className="w-4 h-4 text-sky-800" />
                ) : (
                  <UserIcon className="w-4 h-4 text-emerald-700" />
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {mode === "signup"
                  ? isAdminPortal
                    ? "Create Admin Account"
                    : "Create Citizen Account"
                  : isAdminPortal
                  ? "Admin Login"
                  : "Citizen Login"}
              </h1>
            </div>

            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {mode === "signup"
                ? isAdminPortal
                  ? "Create administrative credentials to manage citizen reports and work orders"
                  : "Join RoadCare to report road damage and track repairs in your city"
                : isAdminPortal
                ? "Authorized personnel access to manage citizen reports and work orders"
                : "Sign in to report road issues, track complaints, and receive repair updates"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Full Name</Label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <Input
                    type="text"
                    required
                    placeholder={isAdminPortal ? "Municipal Admin Name" : "Alex Morgan"}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-11 rounded-xl bg-[#F0F5FF]/60 border-slate-200 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">Email Address</Label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <Input
                  type="email"
                  required
                  placeholder={isAdminPortal ? "admin@roadcare.gov" : "name@example.com"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 rounded-xl bg-[#F0F5FF]/60 border-slate-200 focus-visible:ring-emerald-500 text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700">Password</Label>
                {mode === "signin" && (
                  <Link
                    to={`/reset-password?portal=${portal}`}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 rounded-xl bg-[#F0F5FF]/60 border-slate-200 focus-visible:ring-emerald-500 text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Confirm Password</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 rounded-xl bg-[#F0F5FF]/60 border-slate-200 focus-visible:ring-emerald-500 text-slate-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className={`w-full h-11 text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 mt-2 ${
                isAdminPortal
                  ? "bg-[#0F3C6C] hover:bg-[#0c2f55]"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  {mode === "signin"
                    ? isAdminPortal
                      ? "Sign In to Admin Portal"
                      : "Sign In as Citizen"
                    : isAdminPortal
                    ? "Create Admin Account"
                    : "Create Citizen Account"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle Signin / Signup */}
          <div className="mt-5 text-center">
            {mode === "signin" ? (
              <p className="text-xs sm:text-sm text-slate-600">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signup")}
                  className={`font-semibold ${
                    isAdminPortal
                      ? "text-[#0F3C6C] hover:text-[#0c2f55]"
                      : "text-emerald-600 hover:text-emerald-700"
                  }`}
                >
                  Sign up now
                </button>
              </p>
            ) : (
              <p className="text-xs sm:text-sm text-slate-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => switchMode("signin")}
                  className={`font-semibold ${
                    isAdminPortal
                      ? "text-[#0F3C6C] hover:text-[#0c2f55]"
                      : "text-emerald-600 hover:text-emerald-700"
                  }`}
                >
                  Sign in
                </button>
              </p>
            )}
          </div>

          <div className="pt-2 text-center">
            <p className="text-[11px] text-slate-400">
              By continuing, you agree to our{" "}
              <a href="#" className="underline hover:text-slate-600">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="underline hover:text-slate-600">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>

      {/* Right Column: Hero Visual with Mountain Road & Civic Tagline */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-slate-950 items-end p-12 lg:p-16 overflow-hidden">
        <img
          src="/images/road-login-hero.jpg"
          alt="Scenic Mountain Road"
          className="absolute inset-0 w-full h-full object-cover opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/35 to-transparent" />

        <div className="relative z-10 text-white max-w-lg space-y-3 animate-fade-in">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md ${
              isAdminPortal
                ? "bg-sky-500/20 text-sky-300 border-sky-500/30"
                : "bg-emerald-500/20 text-emerald-300 border-emerald-500/30"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            {isAdminPortal ? "Municipal Highway Authority" : "Civic Infrastructure Management"}
          </div>
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            Better Roads.
            <br />
            Brighter Communities<span className="text-emerald-400">.</span>
          </h2>
          <p className="text-sm text-slate-300 font-medium tracking-wide">
            {isAdminPortal
              ? "Complaint triage • Work crew assignment • Verification audit"
              : "Report • Track • Resolve"}
          </p>
        </div>
      </div>
    </div>
  );
}
