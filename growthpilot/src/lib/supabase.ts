import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const demoModeFlag = process.env.NEXT_PUBLIC_ALLOW_DEMO_MODE === "true";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
export const isDemoModeEnabled = !isSupabaseConfigured && demoModeFlag && process.env.NODE_ENV !== "production";

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;