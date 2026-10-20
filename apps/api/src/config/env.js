import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  webOrigin: process.env.WEB_ORIGIN || "http://localhost:8080",
  supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://placeholder-project.supabase.co",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  supabaseAnonKey: process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "",
  aiServiceUrl: process.env.AI_SERVICE_URL || "http://localhost:8000",
};
