import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const [session, setSession] = useState(null);
    const [user, setUser] = useState(null);
    const [role, setRole] = useState(null);
    const [loading, setLoading] = useState(true);
    const fetchRole = async (userId) => {
        const { data } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", userId)
            .maybeSingle();
        setRole(data?.role ?? "citizen");
    };
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                setTimeout(() => fetchRole(session.user.id), 0);
            }
            else {
                setRole(null);
            }
            setLoading(false);
        });
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchRole(session.user.id);
            }
            setLoading(false);
        });
        return () => subscription.unsubscribe();
    }, []);
    const signUp = async (email, password, fullName) => {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } },
        });
        if (error)
            throw error;
    };
    const signIn = async (email, password) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error)
            throw error;
    };
    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error)
            throw error;
    };
    return (<AuthContext.Provider value={{ session, user, role, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>);
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined)
        throw new Error("useAuth must be used within AuthProvider");
    return context;
}
