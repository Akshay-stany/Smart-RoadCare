import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

export const DEMO_ACCOUNTS = {
  citizen: {
    id: "e4b2d130-1092-4f3b-8215-6d0e82c819a1",
    email: "citizen@roadcare.org",
    role: "citizen",
    fullName: "Citizen Ravi",
    emailConfirmedAt: "2026-10-20T08:30:00.000Z",
  },
  officer: {
    id: "23c1092f-b441-45c1-92e1-458bb319c801",
    email: "officer@roadcare.gov",
    role: "officer",
    fullName: "Ravi Kumar (Field Officer)",
    emailConfirmedAt: "2026-10-20T08:30:00.000Z",
  },
  admin: {
    id: "d9a3b814-3110-482a-a92c-54a7c1b82092",
    email: "admin@roadcare.gov",
    role: "admin",
    fullName: "Anita Sharma (Municipal Admin)",
    emailConfirmedAt: "2026-10-20T08:30:00.000Z",
  },
};

const LOCAL_SESSION_KEY = "roadcare_local_session";
const isDevDemoAllowed = Boolean(import.meta.env.DEV && import.meta.env.VITE_ENABLE_DEV_DEMO === "true");

function getStoredLocalSession() {
  if (!isDevDemoAllowed || typeof window === "undefined" || !window.localStorage) return null;
  try {
    const raw = window.localStorage.getItem(LOCAL_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function storeLocalSession(sessionData) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    if (isDevDemoAllowed && sessionData) {
      window.localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(sessionData));
    } else {
      window.localStorage.removeItem(LOCAL_SESSION_KEY);
    }
  } catch (err) {
    console.error("Failed to persist local session:", err);
  }
}

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = useCallback(async (userId) => {
    if (!userId) {
      setRole(null);
      setProfile(null);
      return null;
    }
    let resolvedRole = "citizen";
    let resolvedProfile = null;

    if (isSupabaseConfigured()) {
      try {
        const [roleRes, profileRes] = await Promise.all([
          supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle(),
          supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        ]);

        if (roleRes.data?.role) {
          resolvedRole = roleRes.data.role;
        }

        if (profileRes.data) {
          resolvedProfile = profileRes.data;
        }
      } catch (err) {
        console.warn("Could not fetch remote user role/profile:", err);
      }
    }

    setRole(resolvedRole);
    if (resolvedProfile) {
      setProfile(resolvedProfile);
    }

    return resolvedRole;
  }, []);

  useEffect(() => {
    let mounted = true;

    // 1. In dev-demo mode only, check local session
    if (isDevDemoAllowed) {
      const local = getStoredLocalSession();
      if (local?.user) {
        setUser(local.user);
        setSession(local.session || { user: local.user });
        setRole(local.role || "citizen");
        setProfile(local.profile || { full_name: local.user.user_metadata?.full_name || local.user.email });
        setLoading(false);
        return;
      }
    }

    // 2. Real Supabase Session initialization
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      if (newSession?.user) {
        setSession(newSession);
        setUser(newSession.user);
        await fetchUserData(newSession.user.id);
      } else {
        setSession(null);
        setUser(null);
        setRole(null);
        setProfile(null);
      }
      setLoading(false);
    });

    supabase.auth
      .getSession()
      .then(async ({ data: { session: initialSession } }) => {
        if (!mounted) return;
        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          await fetchUserData(initialSession.user.id);
        } else {
          setSession(null);
          setUser(null);
          setRole(null);
          setProfile(null);
        }
      })
      .catch((err) => {
        console.warn("Error getting initial Supabase session:", err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [fetchUserData]);

  const setLocalSessionState = (mockUser, mockRole, mockName) => {
    if (!isDevDemoAllowed) {
      throw new Error("Local simulated authentication is disabled in production.");
    }
    const sessionObj = {
      user: mockUser,
      session: {
        access_token: "mock-jwt-token-" + Date.now(),
        user: mockUser,
      },
      role: mockRole,
      profile: {
        id: mockUser.id,
        user_id: mockUser.id,
        full_name: mockName,
        email: mockUser.email,
        role: mockRole,
      },
    };
    storeLocalSession(sessionObj);
    setUser(mockUser);
    setSession(sessionObj.session);
    setRole(mockRole);
    setProfile(sessionObj.profile);
    setLoading(false);
    window.dispatchEvent(new CustomEvent("roadcare-auth-changed", { detail: sessionObj }));
    return sessionObj;
  };

  const quickLogin = (roleType) => {
    if (!isDevDemoAllowed) {
      throw new Error("Demo shortcuts are disabled in production.");
    }
    const demo = DEMO_ACCOUNTS[roleType] || DEMO_ACCOUNTS.citizen;
    const mockUser = {
      id: demo.id,
      email: demo.email,
      email_confirmed_at: demo.emailConfirmedAt,
      created_at: new Date().toISOString(),
      user_metadata: { full_name: demo.fullName },
    };
    return setLocalSessionState(mockUser, demo.role, demo.fullName);
  };

  const signUp = async (email, password, fullName) => {
    if (!isSupabaseConfigured()) {
      if (isDevDemoAllowed) {
        const mockUser = {
          id: `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          email,
          email_confirmed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          user_metadata: { full_name: fullName },
        };
        return setLocalSessionState(mockUser, "citizen", fullName);
      }
      throw new Error("Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      throw error;
    }
    return data;
  };

  const signIn = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();

    // Dev-only demo shortcut
    if (isDevDemoAllowed) {
      for (const key of Object.keys(DEMO_ACCOUNTS)) {
        if (DEMO_ACCOUNTS[key].email === cleanEmail) {
          return quickLogin(key);
        }
      }
    }

    if (!isSupabaseConfigured()) {
      throw new Error("Authentication service is not configured. Please check environment variables.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      throw error;
    }

    if (data?.session?.user) {
      setSession(data.session);
      setUser(data.session.user);
      await fetchUserData(data.session.user.id);
    }
    return data;
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      throw new Error(
        "Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY."
      );
    }

    const redirectUrl = `${window.location.origin}/auth/callback`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) throw error;
    return data;
  };

  const verifyOtp = async (email, token, type = "signup") => {
    if (!isSupabaseConfigured()) {
      throw new Error("Authentication service is not configured. Cannot verify OTP.");
    }

    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token: token.trim(),
      type,
    });

    if (error) throw error;

    if (data?.session?.user) {
      setSession(data.session);
      setUser(data.session.user);
      await fetchUserData(data.session.user.id);
    }
    return data;
  };

  const resendOtp = async (email, type = "signup") => {
    if (!isSupabaseConfigured()) {
      throw new Error("Authentication service is not configured.");
    }

    const { data, error } = await supabase.auth.resend({
      email: email.trim().toLowerCase(),
      type,
    });

    if (error) throw error;
    return data;
  };

  const resetPassword = async (email) => {
    if (!isSupabaseConfigured()) {
      throw new Error("Authentication service is not configured.");
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) throw error;
    return data;
  };

  const updatePassword = async (newPassword) => {
    if (!isSupabaseConfigured()) {
      throw new Error("Authentication service is not configured.");
    }

    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // ignore network errors on logout
    }
    storeLocalSession(null);
    setUser(null);
    setSession(null);
    setRole(null);
    setProfile(null);
  };

  const value = {
    session,
    user,
    profile,
    role,
    loading,
    isDevDemoAllowed,
    signUp,
    signIn,
    signInWithGoogle,
    quickLogin,
    verifyOtp,
    resendOtp,
    resetPassword,
    updatePassword,
    signOut,
    refreshUserData: () => (user ? fetchUserData(user.id) : Promise.resolve()),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
