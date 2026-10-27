import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";
import RoadCareLogo from "@/components/common/RoadCareLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { Loader2, Mail, Lock, ArrowLeft, KeyRound, CheckCircle2, Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const portal = searchParams.get("portal") === "admin" ? "admin" : "citizen";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isRecovery, setIsRecovery] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.get("type") === "recovery") {
      setIsRecovery(true);
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecovery(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSendResetEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      if (isSupabaseConfigured()) {
        const redirectTo = `${window.location.origin}/reset-password`;
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
          redirectTo,
        });
        if (error) throw error;
      }
      setEmailSent(true);
      toast.success("Password reset link has been dispatched to your email.");
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to send reset email. Please verify the address.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated successfully! You can now sign in.");
      navigate(`/auth?portal=${portal}`);
    } catch (err) {
      toast.error(getErrorMessage(err) || "Failed to update password. Please request a new link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-10 shadow-sm">
        {/* Brand Header */}
        <div className="flex justify-center mb-6">
          <Link to="/">
            <RoadCareLogo size="md" theme="dark" subtext="CIVIC PORTAL" />
          </Link>
        </div>

        {isRecovery ? (
          // 1. Password Reset Mode (after clicking email link)
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
                <KeyRound className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Set New Password</h1>
              <p className="text-xs text-slate-500 mt-1">
                Enter your new password below to regain access to your account.
              </p>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">New Password</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 rounded-xl border-slate-200 focus-visible:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-10 h-11 rounded-xl border-slate-200 focus-visible:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save New Password"}
              </Button>
            </form>
          </div>
        ) : emailSent ? (
          // 2. Email Sent Confirmation
          <div className="text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Check Your Inbox</h1>
            <p className="text-sm text-slate-600 leading-relaxed max-w-xs mx-auto">
              We have dispatched a password reset link to <strong className="text-slate-800">{email}</strong>.
            </p>
            <div className="pt-4 flex flex-col gap-2">
              <Button
                variant="outline"
                onClick={() => setEmailSent(false)}
                className="w-full rounded-xl border-slate-200 text-slate-700"
              >
                Resend to another address
              </Button>
              <Link
                to={`/auth?portal=${portal}`}
                className="inline-flex items-center justify-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-semibold pt-2"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Return to Login
              </Link>
            </div>
          </div>
        ) : (
          // 3. Request Reset Link Form
          <div className="space-y-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Forgot Password?</h1>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Enter your registered {portal === "admin" ? "authorized administrative" : "citizen"} email address and we'll send you instructions to reset your password.
              </p>
            </div>

            <form onSubmit={handleSendResetEmail} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-slate-700">Email Address</Label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <Input
                    type="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 rounded-xl bg-slate-50/50 border-slate-200 focus-visible:ring-emerald-500 text-slate-900"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Password Reset Link"}
              </Button>
            </form>

            <div className="text-center pt-2">
              <Link
                to={`/auth?portal=${portal}`}
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to {portal === "admin" ? "Admin" : "Citizen"} Login
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
