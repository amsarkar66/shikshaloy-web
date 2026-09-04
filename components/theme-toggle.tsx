"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

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
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-8 w-8" />;

  const isDark = resolvedTheme === "dark";

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";

    const canAnimate =
      typeof document.startViewTransition === "function" &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!canAnimate) {
      setTheme(next);
      return;
    }

    const rect = buttonRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const y = rect ? rect.top + rect.height / 2 : window.innerHeight / 2;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition!(() => {
      flushSync(() => setTheme(next));
    });

    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
          },
          {
            duration: 600,
            easing: "ease-in-out",
            pseudoElement: "::view-transition-new(root)",
          }
        );
      })
      // The browser can abort a transition for reasons outside our control
      // (tab visibility change, another extension mutating the DOM, etc).
      // The theme has already been applied via flushSync above either way,
      // so there's nothing to recover — just avoid an unhandled rejection.
      .catch(() => {});
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`flex h-8 w-8 items-center justify-center transition-colors ${VARIANT_CLASSES[variant]}`}
    >
      {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
