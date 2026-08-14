import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

// Supabase's "Send SMS Hook" POSTs { user, sms: { otp } } here instead of
// calling a built-in provider. We forward that OTP to Fast2SMS's DLT route.
// https://supabase.com/docs/guides/auth/auth-hooks/send-sms-hook

const FAST2SMS_API_KEY = Deno.env.get("FAST2SMS_API_KEY");
const FAST2SMS_SENDER_ID = Deno.env.get("FAST2SMS_SENDER_ID");
// The 6-digit message/template ID for your DLT-approved Fast2SMS template.
const FAST2SMS_MESSAGE_ID = Deno.env.get("FAST2SMS_MESSAGE_ID");

async function sendOtpViaFast2Sms(phone: string, otp: string) {
  // Fast2SMS expects a plain 10-digit Indian mobile number, no "+91" prefix.
  const number = phone.replace(/^\+?91/, "").replace(/\D/g, "");

  const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      authorization: FAST2SMS_API_KEY ?? "",
    },
    body: JSON.stringify({
      route: "dlt",
      sender_id: FAST2SMS_SENDER_ID,
      message: FAST2SMS_MESSAGE_ID,
      // Pipe-separated if your approved template has more than one
      // variable — adjust this if the OTP isn't the only placeholder.
      variables_values: otp,
      numbers: number,
    }),
  });

  const result = await response.json().catch(() => ({}));
  const ok = response.ok && result?.return === true;
  return { ok, result };
}

Deno.serve(async (req) => {
  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  const base64Secret = (Deno.env.get("SEND_SMS_HOOK_SECRET") ?? "").replace("v1,whsec_", "");

  try {
    const wh = new Webhook(base64Secret);
    const { user, sms } = wh.verify(payload, headers) as {
      user: { phone: string };
      sms: { otp: string };
    };

    if (!FAST2SMS_API_KEY || !FAST2SMS_SENDER_ID || !FAST2SMS_MESSAGE_ID) {
      throw new Error("FAST2SMS_API_KEY / FAST2SMS_SENDER_ID / FAST2SMS_MESSAGE_ID are not configured");
    }

    const { ok, result } = await sendOtpViaFast2Sms(user.phone, sms.otp);

    if (!ok) {
      return new Response(
        JSON.stringify({
          error: {
            http_code: 500,
            message: `Failed to send SMS via Fast2SMS: ${JSON.stringify(result)}`,
          },
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: {
          http_code: 500,
          message: `Failed to send sms: ${error instanceof Error ? error.message : String(error)}`,
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
