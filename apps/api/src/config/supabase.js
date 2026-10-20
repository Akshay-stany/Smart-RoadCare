import { createClient } from "@supabase/supabase-js";
import { config } from "./env.js";

// Server-side Supabase client using Service Role Key (privilege protected, never sent to browser)
const key = config.supabaseServiceRoleKey || config.supabaseAnonKey || "placeholder-key";

export const supabaseAdmin = createClient(config.supabaseUrl, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
