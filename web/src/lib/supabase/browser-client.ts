import { createClient } from '@supabase/supabase-js';
import { getRequiredEnv } from '@/lib/env.ts';

const SUPABASE_URL = getRequiredEnv(
  import.meta.env.VITE_SUPABASE_URL,
  'VITE_SUPABASE_URL',
);
const SUPABASE_PUBLISHABLE_KEY = getRequiredEnv(
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  'VITE_SUPABASE_PUBLISHABLE_KEY',
);

export const supabaseBrowserClient = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
