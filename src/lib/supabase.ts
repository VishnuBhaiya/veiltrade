import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://xbbktcezmhphvtheyqwf.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_FBEN8LHWLt2bIJ8yWL4x4w_poYRkaZN';

export function hasSupabase() {
  return true;
}

export function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
