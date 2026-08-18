import crypto from "crypto";

const KEY_ID = process.env.RAZORPAY_KEY_ID;
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;

export function isRazorpayConfigured(): boolean {
  return Boolean(KEY_ID && KEY_SECRET);
}

export async function createRazorpayOrder(
  amountPaise: number,
  receipt: string,
  notes?: Record<string, string>
): Promise<{ id: string; amount: number; currency: string }> {
  if (!KEY_ID || !KEY_SECRET) {
    throw new Error("Razorpay is not configured. Contact support.");
  }
  const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ amount: amountPaise, currency: "INR", receipt, notes }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Razorpay order creation failed: ${body}`);
  }
  return res.json();
}

export async function fetchRazorpayOrder(
  orderId: string
): Promise<{ id: string; notes: Record<string, string> }> {
  if (!KEY_ID || !KEY_SECRET) {
    throw new Error("Razorpay is not configured. Contact support.");
  }
  const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");
  const res = await fetch(`https://api.razorpay.com/v1/orders/${orderId}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to fetch Razorpay order: ${body}`);
  }
  return res.json();
}

export function verifyRazorpaySignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}): boolean {
  if (!KEY_SECRET) return false;
  const expected = crypto
    .createHmac("sha256", KEY_SECRET)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");
  return expected === input.signature;
}

export interface RazorpayPayment {
  id: string;
  order_id: string;
  method: "card" | "netbanking" | "wallet" | "upi" | "emi" | "cardless_emi" | "paylater" | string;
  bank: string | null;
  wallet: string | null;
  vpa: string | null;
  card: { network: string; last4: string; type: string; issuer: string | null } | null;
}

export function isRazorpayWebhookConfigured(): boolean {
  return Boolean(WEBHOOK_SECRET);
}

export function verifyRazorpayWebhookSignature(rawBody: string, signature: string): boolean {
  if (!WEBHOOK_SECRET) return false;
  const expected = crypto.createHmac("sha256", WEBHOOK_SECRET).update(rawBody).digest("hex");
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, signatureBuf);
}

export async function fetchRazorpayPayment(paymentId: string): Promise<RazorpayPayment> {
  if (!KEY_ID || !KEY_SECRET) {
    throw new Error("Razorpay is not configured. Contact support.");
  }
  const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString("base64");
  const res = await fetch(`https://api.razorpay.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to fetch Razorpay payment: ${body}`);
  }
  return res.json();
}

export function summarizeRazorpayPayment(payment: RazorpayPayment): string {
  switch (payment.method) {
    case "card":
      return payment.card
        ? `${payment.card.network} •••• ${payment.card.last4}`
        : "Card";
    case "upi":
      return payment.vpa ? `UPI (${payment.vpa})` : "UPI";
    case "netbanking":
      return payment.bank ? `Netbanking (${payment.bank})` : "Netbanking";
    case "wallet":
      return payment.wallet ? `Wallet (${payment.wallet})` : "Wallet";
    case "emi":
      return "EMI";
    case "cardless_emi":
      return "Cardless EMI";
    case "paylater":
      return "Pay Later";
    default:
      return "Razorpay";
  }
}

// The specific brand identifier within a method — card network, wallet name,
// or bank code — used to key a logo asset (e.g. "visa", "airtelmoney", "hdfc").
export function razorpayMethodDetail(payment: RazorpayPayment): string | null {
  const raw = payment.card?.network ?? payment.wallet ?? payment.bank ?? null;
  return raw ? raw.toLowerCase().replace(/[^a-z0-9]/g, "") : null;
}
