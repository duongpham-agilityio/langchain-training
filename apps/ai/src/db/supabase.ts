import { createClient } from "@supabase/supabase-js";

// Configs
import { config } from "@/config";

// Server side: no browser storage to persist to and no user session to refresh.
export const createSupabaseAdminClient = () =>
  createClient(config.supabase.url, config.supabase.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
