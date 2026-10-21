import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth, DEMO_ACCOUNTS } from "@/hooks/useAuth";
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
  HardHat,
  Building2,
  Sparkles,
} from "lucide-react";

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, signIn, signUp, signInWithGoogle, quickLogin, role, isDevDemoAllowed } = useAuth();

  const [mode, setMode] = useState(
    searchParams.get("tab") === "signup" ? "signup" : "signin"
  );
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // If already logged in, redirect to role-appropriate dashboard
  useEffect(() => {
    if (user) {
      if (role === "admin") navigate("/admin");
      else if (role === "officer") navigate("/officer");
      else navigate("/dashboard");
    }
  }, [user, role, navigate]);

  const handleQuickLogin = (roleType) => {
    try {
      const demo = DEMO_ACCOUNTS[roleType];
      quickLogin(roleType);
      toast.success(`Signed in as ${demo.fullName} (${roleType})!`);
      if (roleType === "admin") navigate("/admin");
      else if (roleType === "officer") navigate("/officer");
      else navigate("/dashboard");
    } catch (err) {
      toast.error(err.message || "Quick login failed");
    }
  };

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

        const data = await signUp(email, password, fullName);
        if (data?.session) {
          toast.success("Account created successfully! Welcome to RoadCare.");
          navigate("/dashboard");
        } else {
          toast.success("Account created! Please check your email for the verification code.");
          navigate(`/verify-otp?email=${encodeURIComponent(email)}`);
        }
      } else {
        await signIn(email, password);
        toast.success("Welcome back!");
        // Navigation will be handled by useEffect above
      }
    } catch (err) {
      toast.error(err.message || "Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      // Browser redirects to Google OAuth
    } catch (err) {
      toast.error(
        err.message || "Google sign-in is not configured or failed to initialize."
      );
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans">
      {/* Left Column: Form & Brand */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-8 sm:p-12 lg:p-16 bg-white shadow-xs z-10">
        {/* Brand Header */}
        <Link to="/" className="flex items-center">
          <RoadCareLogo size="md" theme="dark" subtext="Civic Portal" />
        </Link>

        {/* Main Auth Form Container */}
        <div className="max-w-md w-full mx-auto my-8">
          <div className="text-center sm:text-left mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {mode === "signin" ? "Welcome Back" : "Create Account"}
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {mode === "signin"
                ? "Sign in to access your civic dashboard, issue tracker, and maps"
                : "Join RoadCare to report road issues and track resolutions"}
            </p>
          </div>

          {/* Development-only quick login banner (hidden in production) */}
          {isDevDemoAllowed && (
            <div className="mb-6 p-4 bg-emerald-50/60 border border-emerald-200/80 rounded-2xl">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Local Development Demo Access
                </span>
                <span className="text-[11px] text-emerald-700 font-medium">Dev Mode</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin("citizen")}
                  className="h-10 text-xs font-semibold bg-white border-emerald-300 text-slate-800 hover:bg-emerald-100 flex flex-col items-center justify-center py-1 gap-0.5 rounded-xl shadow-2xs"
                >
                  <span className="flex items-center gap-1 text-emerald-700">
                    <UserIcon className="w-3.5 h-3.5" />
                    Citizen
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">Report & Track</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin("officer")}
                  className="h-10 text-xs font-semibold bg-white border-emerald-300 text-slate-800 hover:bg-emerald-100 flex flex-col items-center justify-center py-1 gap-0.5 rounded-xl shadow-2xs"
                >
                  <span className="flex items-center gap-1 text-amber-700">
                    <HardHat className="w-3.5 h-3.5" />
                    Officer
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">Tasks & Fixes</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickLogin("admin")}
                  className="h-10 text-xs font-semibold bg-white border-emerald-300 text-slate-800 hover:bg-emerald-100 flex flex-col items-center justify-center py-1 gap-0.5 rounded-xl shadow-2xs"
                >
                  <span className="flex items-center gap-1 text-indigo-700">
                    <Building2 className="w-3.5 h-3.5" />
                    Admin
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">Analytics & Assign</span>
                </Button>
              </div>
            </div>
          )}

          {/* Genuine Google OAuth Button */}
          <div className="space-y-2 mb-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className="w-full h-12 text-sm font-semibold border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 flex items-center justify-center gap-3 rounded-xl shadow-2xs"
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    fill="#EA4335"
                  />
                </svg>
              )}
              Continue with Google
            </Button>
          </div>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-medium">
                Or sign in with email
              </span>
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Full Name</Label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <Input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-11 rounded-lg border-slate-200 focus-visible:ring-emerald-500"
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
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 rounded-lg border-slate-200 focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700">Password</Label>
                {mode === "signin" && (
                  <Link
                    to="/reset-password"
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    Forgot password?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <Input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 rounded-lg border-slate-200 focus-visible:ring-emerald-500"
                />
              </div>
            </div>

            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <Input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-11 rounded-lg border-slate-200 focus-visible:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <>
                  {mode === "signin" ? "Sign In to RoadCare" : "Create Account"}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle Signin / Signup */}
          <div className="mt-6 text-center">
            {mode === "signin" ? (
              <p className="text-sm text-slate-600">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Sign up now
                </button>
              </p>
            ) : (
              <p className="text-sm text-slate-600">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className="font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Footer Terms */}
        <p className="text-xs text-slate-400 text-center">
          By continuing, you agree to our{" "}
          <Link to="/terms" className="underline hover:text-slate-600">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="underline hover:text-slate-600">
            Privacy Policy
          </Link>
          .
        </p>
      </div>

      {/* Right Column: Hero Visual matching civic platform design */}
      <div className="hidden md:flex md:w-1/2 relative bg-slate-900 overflow-hidden items-end p-12 lg:p-16">
        <img
          src="/images/road-login-hero.jpg"
          alt="Scenic Mountain Road"
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-transparent" />

        <div className="relative z-10 text-white max-w-lg space-y-3 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 backdrop-blur-md">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            Civic Infrastructure Management
          </div>
          <h2 className="text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight">
            Better Roads
            <br />
            Brighter Communities
          </h2>
          <p className="text-sm text-slate-300 font-medium tracking-wide">
            Report • Track • Resolve
          </p>
        </div>
      </div>
    </div>
  );
}
