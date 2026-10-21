import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://placeholder-project.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "placeholder-anon-key";

// Safe storage access for browser vs SSR / restricted environments / testing
let safeStorage;
try {
  if (typeof window !== "undefined" && window.localStorage) {
    const probe = "__rc_probe__";
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    safeStorage = window.localStorage;
  }
} catch {
  safeStorage = undefined;
}

export const isSupabaseConfigured = () => {
  const url = import.meta.env.VITE_SUPABASE_URL || "";
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || "";
  return Boolean(
    url &&
    key &&
    !url.includes("placeholder") &&
    !url.includes("YOUR-PROJECT-REF") &&
    !key.includes("placeholder") &&
    !key.includes("your-anon")
  );
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: safeStorage,
    persistSession: Boolean(safeStorage),
    autoRefreshToken: Boolean(safeStorage),
  },
});

