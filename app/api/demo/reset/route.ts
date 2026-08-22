import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/service";

// Lets a kernel operator (or the DEMO_RESET_SECRET-holding caller) trigger an
// immediate refresh of the public demo school instead of waiting for the
// nightly `reset_demo_school()` cron job (see supabase/migrations). Edit the
// demo school's data as super_admin, re-snapshot it into the `demo_baseline`
// schema, then hit this route to make the new baseline live right away.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-demo-reset-secret");
  if (!process.env.DEMO_RESET_SECRET || secret !== process.env.DEMO_RESET_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabaseAdmin.rpc("reset_demo_school");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
