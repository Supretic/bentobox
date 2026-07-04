import { createClient } from "@supabase/supabase-js";

// Single-user mode: service-role client, no cookies, bypasses RLS.
// The cookie-based auth client this replaced lives in git history.
export async function createSupabaseServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
