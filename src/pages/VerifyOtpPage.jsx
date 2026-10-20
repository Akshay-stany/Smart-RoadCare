import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, MailCheck, ArrowLeft, RefreshCw } from "lucide-react";

export default function VerifyOtpPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyOtp, resendOtp, user, role } = useAuth();

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (user && user.email_confirmed_at) {
      if (role === "admin") navigate("/admin");
      else if (role === "officer") navigate("/officer");
      else navigate("/dashboard");
    }
  }, [user, role, navigate]);

  // Handle countdown timer for resend OTP
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleChange = (index, value) => {
    // Only accept numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only keep single digit
    setOtp(newOtp);

    // Auto focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      inputRefs.current[5]?.focus();
    } else {
      toast.error("Please paste a valid 6-digit numeric code.");
    }
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    const token = otp.join("");
    if (token.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }
    if (!email) {
      toast.error("Please enter the associated email address");
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(email, token, "signup");
      toast.success("Email verified successfully! Welcome to RoadCare.");
      navigate("/dashboard");
    } catch (err) {
      // Try with type 'email' if 'signup' fails (for existing users or magic OTP)
      try {
        await verifyOtp(email, token, "email");
        toast.success("Email verified successfully!");
        navigate("/dashboard");
      } catch (secondErr) {
        toast.error(
          secondErr.message || err.message || "Invalid or expired verification code."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending || !email) return;

    setResending(true);
    try {
      await resendOtp(email, "signup");
      toast.success("New verification code sent to your email!");
      setCooldown(60); // 60s cooldown
    } catch (err) {
      toast.error(err.message || "Failed to resend code. Please wait before retrying.");
      setCooldown(30);
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-10 shadow-xs text-center">
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mx-auto mb-5 shadow-2xs">
          <MailCheck className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Verify Your Email
        </h1>
        <p className="mt-2 text-sm text-slate-500 max-w-xs mx-auto">
          We have sent a 6-digit verification code to{" "}
          <span className="font-semibold text-slate-800">
            {email || "your email address"}
          </span>
        </p>

        {/* Email correction if needed */}
        <div className="mt-4 mb-6">
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="name@example.com"
            className="text-center h-10 text-xs border-slate-200"
          />
        </div>

        {/* 6 Digit Input Boxes */}
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex items-center justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
              />
            ))}
          </div>

          <Button
            type="submit"
            disabled={loading || otp.join("").length !== 6}
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              "Confirm & Continue"
            )}
          </Button>
        </form>

        {/* Resend Action */}
        <div className="mt-6 flex flex-col items-center gap-3 text-xs text-slate-500">
          <p>
            Didn't receive the email?{" "}
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || resending}
              className="font-semibold text-emerald-600 hover:text-emerald-700 disabled:text-slate-400 disabled:cursor-not-allowed ml-1"
            >
              {resending
                ? "Sending..."
                : cooldown > 0
                ? `Resend code in ${cooldown}s`
                : "Resend Code"}
            </button>
          </p>

          <Link
            to="/auth"
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 font-medium mt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
