"use client";

import { useState } from "react";
import { resolveMethodIcon, resolveMethodLogoKey, type RazorpayMethod } from "../_data/billing";

// Renders a self-hosted brand logo at /public/payment-icons/{key}.svg when one
// exists for this method (drop a matching SVG in there to upgrade from the
// generic icon — no code changes needed). Falls back to a generic Lucide icon
// when no logo file is present yet, or for offline/unrecognized methods.
export function PaymentMethodIcon({
  razorpayMethod,
  razorpayMethodDetail,
  summary,
  className,
}: {
  razorpayMethod?: RazorpayMethod | null;
  razorpayMethodDetail?: string | null;
  summary?: string | null;
  className?: string;
}) {
  const logoKey = resolveMethodLogoKey(razorpayMethod, razorpayMethodDetail);
  const [logoFailed, setLogoFailed] = useState(false);

  if (logoKey && !logoFailed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={`/payment-icons/${logoKey}.svg`}
        alt=""
        className={className}
        onError={() => setLogoFailed(true)}
      />
    );
  }

  const Icon = resolveMethodIcon(razorpayMethod, summary);
  return <Icon className={className} />;
}
