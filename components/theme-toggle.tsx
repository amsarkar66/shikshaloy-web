"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

const VARIANT_CLASSES = {
  // Floating glass pill — for auth/onboarding screens over decorative backgrounds.
  glass:
    "rounded-full border border-white/60 bg-white/30 text-amber-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-md dark:border-white/20 dark:bg-white/5 dark:text-amber-400 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
  // Flat icon button — matches the other toolbar icons in the dashboard header (search, bell, etc.).
  ghost:
    "rounded-lg text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 hover:text-gray-900 dark:hover:text-zinc-50",
} as const;

export function ThemeToggle({ variant = "glass" }: { variant?: keyof typeof VARIANT_CLASSES }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-8 w-8" />;

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`flex h-8 w-8 items-center justify-center transition-colors ${VARIANT_CLASSES[variant]}`}
    >
      {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
