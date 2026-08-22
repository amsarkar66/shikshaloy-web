"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { FancyButton } from "@/components/ui/fancy-button";
import { createClient } from "@/lib/supabase/client";

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
    <div className={className}>
      <FancyButton onClick={handleClick} disabled={loading} className="w-full">
        {loading ? "Signing in…" : `Try ${label} demo`}
      </FancyButton>
      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}
