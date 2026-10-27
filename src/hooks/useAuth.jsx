import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase, isSupabaseConfigured } from "@/integrations/supabase/client";

export const DEMO_ACCOUNTS = {
  citizen: {
    id: "567f6a29-055c-4052-8182-44636c4f251a",
    email: "citizen@roadcare.org",
    password: "CitizenPassword123!",
    role: "citizen",
    fullName: "Citizen Demo",
  },
  officer: {
    id: "271cce2c-4141-46aa-b56b-ab4544efcdcd",
    email: "officer@roadcare.gov",
    password: "OfficerPassword123!",
    role: "officer",
    fullName: "Field Officer Ravi",
  },
  admin: {
    id: "f1002b9b-51e0-4e8b-bbb5-fe7d21dd9977",
    email: "admin@roadcare.gov",
    password: "AdminPassword123!",
    role: "admin",
    fullName: "Municipal Admin",
  },
  sooraj: {
    id: "8224d234-95a8-402d-b8d2-f30d087f3508",
    email: "2442soorajks@gmail.com",
    password: "Password123!",
    role: "admin",
    fullName: "Sooraj KS",
  },
};

const LOCAL_SESSION_KEY = "roadcare_local_session";
const isDevDemoAllowed = true;

function getStoredLocalSession() {
  if (typeof window === "undefined" || !window.localStorage) return null;
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
    if (sessionData) {
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
          supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        ]);

        if (roleRes.data?.role) {
          resolvedRole = roleRes.data.role;
        }

        if (profileRes.data) {
          resolvedProfile = profileRes.data;
          if (!roleRes.data?.role && profileRes.data.role) {
            resolvedRole = profileRes.data.role;
          }
        }
      } catch (err) {
        console.warn("Could not fetch remote user role/profile:", err);
      }
    }

    // Check cached active role preference in localStorage
    if (typeof window !== "undefined" && window.localStorage) {
      try {
        const cachedRole = window.localStorage.getItem(`roadcare_role_${userId}`);
        if (cachedRole && (cachedRole === "admin" || cachedRole === "citizen" || cachedRole === "officer")) {
          resolvedRole = cachedRole;
        }
      } catch {
        // ignore
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

    // Real Supabase Session initialization
    if (!isSupabaseConfigured()) {
      const local = getStoredLocalSession();
      if (local?.user) {
        setUser(local.user);
        setSession(local.session || { user: local.user });
        setRole(local.role || "citizen");
        setProfile(local.profile || { full_name: local.user.user_metadata?.full_name || local.user.email });
      }
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

  // Real 1-click test login against live Supabase accounts
  const quickLogin = async (roleType) => {
    const demo = DEMO_ACCOUNTS[roleType] || DEMO_ACCOUNTS.citizen;
    if (isSupabaseConfigured() && demo.password) {
      return signIn(demo.email, demo.password);
    }

    // In-memory fallback if Supabase not reachable
    const mockUser = {
      id: demo.id,
      email: demo.email,
      email_confirmed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      user_metadata: { full_name: demo.fullName, role: demo.role },
    };
    const sessionObj = {
      user: mockUser,
      session: { access_token: "mock-jwt-token-" + Date.now(), user: mockUser },
      role: demo.role,
      profile: { id: mockUser.id, full_name: demo.fullName, email: mockUser.email, role: demo.role },
    };
    storeLocalSession(sessionObj);
    setUser(mockUser);
    setSession(sessionObj.session);
    setRole(demo.role);
    setProfile(sessionObj.profile);
    setLoading(false);
    return sessionObj;
  };

  // Direct signup without 2FA / OTP
  const signUp = async (email, password, fullName, userRole = "citizen") => {
    const cleanEmail = email.trim().toLowerCase();

    // 1. Try backend API first (creates user with email_confirm: true directly in Supabase Admin)
    try {
      const apiRes = await fetch("/api/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: cleanEmail, password, fullName, role: userRole }),
      });
      const resJson = await apiRes.json();
      if (apiRes.ok && resJson.success) {
        // User created and confirmed! Immediately log in to establish client session
        const loginRes = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });
        if (loginRes.data?.session) {
          setSession(loginRes.data.session);
          setUser(loginRes.data.session.user);
          await fetchUserData(loginRes.data.session.user.id);
          return loginRes.data;
        }
        return resJson;
      } else if (resJson.error) {
        throw new Error(resJson.error);
      }
    } catch (apiErr) {
      if (apiErr.message && !apiErr.message.includes("fetch")) {
        throw apiErr;
      }
      // Fallback if /api endpoint is not available
    }

    if (!isSupabaseConfigured()) {
      throw new Error("Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
    }

    // Direct Supabase signup
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: { full_name: fullName, role: userRole },
      },
    });

    if (error) throw error;

    // Immediately try signing in to skip any OTP screen
    try {
      const loginRes = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });
      if (loginRes.data?.session) {
        if (userRole !== "citizen") {
          try {
            await supabase.from("user_roles").upsert({
              user_id: loginRes.data.session.user.id,
              role: userRole,
            });
            await supabase.from("profiles").upsert({
              id: loginRes.data.session.user.id,
              user_id: loginRes.data.session.user.id,
              full_name: fullName,
              role: userRole,
            });
          } catch (rErr) {
            console.warn("Direct role update warning:", rErr);
          }
        }
        setSession(loginRes.data.session);
        setUser(loginRes.data.session.user);
        await fetchUserData(loginRes.data.session.user.id);
        return loginRes.data;
      }
    } catch {
      // ignore
    }

    return data;
  };

  // Direct Email & Password Sign In
  const signIn = async (email, password, portal) => {
    const cleanEmail = email.trim().toLowerCase();

    // Check if credentials match any predefined project accounts
    const matchingDemoKey = Object.keys(DEMO_ACCOUNTS).find(
      (k) =>
        DEMO_ACCOUNTS[k].email.toLowerCase() === cleanEmail &&
        DEMO_ACCOUNTS[k].password === password
    );

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

        if (!error && data?.session?.user) {
          setSession(data.session);
          setUser(data.session.user);
          await fetchUserData(data.session.user.id);
          return data;
        }

        if (error && !matchingDemoKey) {
          throw error;
        }
      } catch (err) {
        if (!matchingDemoKey) {
          throw err;
        }
      }
    }

    if (matchingDemoKey) {
      return quickLogin(matchingDemoKey);
    }

    throw new Error("Invalid login credentials. Please verify your email and password.");
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
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem("roadcare_active_role");
    }
  };
  const switchRole = useCallback(async (newRole) => {
    if (!newRole) return;
    setRole(newRole);
    if (typeof window !== "undefined" && window.localStorage) {
      if (user?.id) {
        window.localStorage.setItem(`roadcare_role_${user.id}`, newRole);
      }
      window.localStorage.setItem("roadcare_active_role", newRole);
    }
    if (user?.id && isSupabaseConfigured()) {
      try {
        await supabase.from("user_roles").upsert({
          user_id: user.id,
          role: newRole,
        });
        await supabase.from("profiles").upsert({
          id: user.id,
          user_id: user.id,
          role: newRole,
        });
      } catch (err) {
        console.warn("Could not sync role to database:", err);
      }
    }
  }, [user]);

  const value = {
    session,
    user,
    profile,
    role,
    setRole,
    switchRole,
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
