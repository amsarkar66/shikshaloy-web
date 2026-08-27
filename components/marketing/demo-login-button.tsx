"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { sendGAEvent } from "@next/third-parties/google";
import { FancyButton, ArrowUpRightIcon } from "@/components/ui/fancy-button";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function DemoLoginButton({
  email,
  password,
  label,
  className,
}: {
  email: string;
  password: string;
  label: string;
  className?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleClick = async () => {
    setError("");
    setLoading(true);
    // GA4 attributes this event to the visitor's session traffic source
    // automatically — no need to attach UTM params by hand.
    sendGAEvent("event", "demo_live_preview_click", { role: label });
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Couldn't sign in to the demo right now — please try again in a moment.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className={cn("flex flex-col", className)}>
      <div className="flex">
        <FancyButton
          onClick={handleClick}
          disabled={loading}
          aria-label={loading ? undefined : `Try ${label} demo`}
          className="flex-1"
        >
          {loading ? (
            "Signing in…"
          ) : (
            <>
              Live Preview
              <ArrowUpRightIcon className="size-4 transition-transform duration-300 ease-out group-hover/fancy:-translate-y-0.5 group-hover/fancy:translate-x-0.5" />
            </>
          )}
        </FancyButton>
      </div>
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
