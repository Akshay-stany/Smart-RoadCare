import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { getErrorMessage } from "@/lib/errors";
import { Loader2, MapPin } from "lucide-react";
export default function AuthPage() {
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [fullName, setFullName] = useState("");
    const [loading, setLoading] = useState(false);
    const { signIn, signUp } = useAuth();
    const navigate = useNavigate();
    const [showForgot, setShowForgot] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetLoading, setResetLoading] = useState(false);
    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setResetLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
                redirectTo: `${window.location.origin}/reset-password`,
            });
            if (error)
                throw error;
            toast.success("Password reset link sent! Check your email.");
            setShowForgot(false);
        }
        catch (err) {
            toast.error(getErrorMessage(err));
        }
        finally {
            setResetLoading(false);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isSignUp) {
                await signUp(email, password, fullName);
                toast.success("Account created! You can now sign in.");
                setIsSignUp(false);
            }
            else {
                await signIn(email, password);
                toast.success("Welcome back!");
                // Role-based redirect happens after auth state updates
                // Fetch role to determine redirect
                const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", (await supabase.auth.getUser()).data.user?.id ?? "").maybeSingle();
                navigate(roleData?.role === "admin" ? "/admin" : "/dashboard");
            }
        }
        catch (err) {
            toast.error(getErrorMessage(err));
        }
        finally {
            setLoading(false);
        }
    };
    if (showForgot) {
        return (<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
              <MapPin className="h-6 w-6 text-primary-foreground"/>
            </div>
            <h1 className="text-2xl font-bold text-foreground">Forgot Password</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your email to receive a reset link</p>
          </div>
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="resetEmail">Email</Label>
              <Input id="resetEmail" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required/>
            </div>
            <Button type="submit" className="w-full" disabled={resetLoading}>
              {resetLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
              Send Reset Link
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground">
            <button onClick={() => setShowForgot(false)} className="text-primary font-medium underline-offset-4 hover:underline">
              Back to Sign In
            </button>
          </p>
        </div>
      </div>);
    }
    return (<div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <MapPin className="h-6 w-6 text-primary-foreground"/>
          </div>
          <h1 className="text-2xl font-bold text-foreground">{isSignUp ? "Create Account" : "Welcome Back"}</h1>
          <p className="text-sm text-muted-foreground mt-1">{isSignUp ? "Join RoadCare to report issues" : "Sign in to your account"}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignUp && (<div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required/>
            </div>)}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6}/>
          </div>
          {!isSignUp && (<div className="text-right">
              <button type="button" onClick={() => setShowForgot(true)} className="text-sm text-primary font-medium underline-offset-4 hover:underline">
                Forgot password?
              </button>
            </div>)}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
            {isSignUp ? "Sign Up" : "Sign In"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary font-medium underline-offset-4 hover:underline">
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>);
}
