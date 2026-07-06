import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

export const DEMO_SCHOOL_ID = "00000000-0000-0000-0000-000000000001";
export const DEMO_AY_ID     = "00000000-0000-0000-0000-000000000002";
