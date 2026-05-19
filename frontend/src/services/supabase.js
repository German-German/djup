import { createClient } from '@supabase/supabase-js';

// Both keys are PUBLISHABLE — safe to expose. The Supabase project's RLS
// policies (see supabase_setup.sql) gate every table. Service-role keys
// must never appear here.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://pfpuccklbmlxvivdgjel.supabase.co';
const SUPABASE_PUBLISHABLE_KEY =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_XNLE3NkIb5vod0lesINgFw_0DXHz_9j';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export const isSupabaseConfigured = () =>
  Boolean(import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL) &&
  Boolean(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || SUPABASE_PUBLISHABLE_KEY);
