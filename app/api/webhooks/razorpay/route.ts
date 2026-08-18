import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { verifyRazorpayWebhookSignature, fetchRazorpayOrder, type RazorpayPayment } from "@/lib/razorpay";
import { fulfillRazorpayPayment } from "@/lib/billing/fulfill-razorpay-payment";
import { PLANS, type PlanId } from "@/app/dashboard/billing/_data/billing";

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-razorpay-signature");

  if (!signature || !verifyRazorpayWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "payment.captured") {
    const payment = event.payload?.payment?.entity as RazorpayPayment | undefined;
    if (payment?.order_id) {
      const order = await fetchRazorpayOrder(payment.order_id);
      const institutionId = order.notes?.institutionId;
      const planId = order.notes?.planId;

      if (institutionId && PLANS.some((p) => p.id === planId)) {
        await fulfillRazorpayPayment({
          institutionId,
          planId: planId as PlanId,
          orderId: payment.order_id,
          payment,
        });
        revalidatePath("/dashboard/billing");
      }
    }
  }

  return NextResponse.json({ ok: true });
}
