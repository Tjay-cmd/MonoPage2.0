import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase admin client with service role.
 * Bypasses RLS - use ONLY for trusted server operations (e.g. public form submissions).
 * Requires SUPABASE_SERVICE_ROLE_KEY in env.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Add it from Supabase Dashboard > Project Settings > API."
    );
  }
  return createClient(url, key);
}
