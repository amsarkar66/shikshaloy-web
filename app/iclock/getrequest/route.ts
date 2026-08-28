import { NextResponse } from "next/server";

// The device polls this periodically for pending remote commands (e.g.
// "enroll this user", "clear log"). We don't push commands from the
// dashboard yet, so always ack with no pending work. See app/iclock/cdata
// for the protocol notes.
export async function GET() {
  return new NextResponse("OK", { status: 200 });
}
