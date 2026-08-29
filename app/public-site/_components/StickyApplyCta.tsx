"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";

export function StickyApplyCta() {
  const pathname = usePathname();

  if (pathname === "/admissions") return null;

  return (
    <Link
      href="/admissions"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-primary-500/30 transition-transform hover:scale-105 hover:bg-primary-600 lg:hidden"
    >
      <GraduationCap className="h-4 w-4" />
      Apply Now
    </Link>
  );
}
