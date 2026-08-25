"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import { usePathname } from "next/navigation";

// Only the authenticated app (dashboard + the auth/onboarding flow that leads
// into it) is dark-mode aware. The public marketing site is styled light-only,
// so it must never inherit the app's dark default — otherwise translucent
// zinc-50/60-style section backgrounds render washed-out gray against the
// dark <body>.
const DARK_AWARE_PREFIXES = ["/dashboard", "/login", "/signup", "/onboarding", "/verify-phone"];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDarkAware = DARK_AWARE_PREFIXES.some((p) => pathname.startsWith(p));

  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      forcedTheme={isDarkAware ? undefined : "light"}
    >
      {children}
    </NextThemesProvider>
  );
}
