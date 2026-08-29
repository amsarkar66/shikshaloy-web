"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Menu, X } from "lucide-react";
import type { PublicSchool } from "@/lib/domains/public-site-data";
import { resolveActiveSchool } from "../_lib/resolve-active-school";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/faculty", label: "Faculty" },
  { to: "/admissions", label: "Admissions" },
  { to: "/results", label: "Results" },
  { to: "/gallery", label: "Gallery" },
  { to: "/announcements", label: "Announcements" },
  { to: "/events", label: "Events" },
  { to: "/contact", label: "Contact" },
];

export function Header({ schools }: { schools: PublicSchool[] }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeSchool = resolveActiveSchool(schools, searchParams.get("school") ?? undefined);

  function selectSchool(id: string) {
    router.push(`${pathname}?school=${id}`);
  }

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
        <Link href="/" className="flex min-w-0 items-center gap-3" onClick={() => setMenuOpen(false)}>
          {activeSchool.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={activeSchool.logoUrl}
              alt={activeSchool.name}
              className="h-10 w-10 shrink-0 rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-500 text-sm font-bold text-white">
              {activeSchool.name.slice(0, 1)}
            </div>
          )}
          <span className="truncate text-lg font-bold text-gray-900">{activeSchool.name}</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-gray-600 xl:flex">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.to;
            return (
              <Link
                key={link.to}
                href={link.to}
                className={`transition-colors hover:text-primary-600 ${isActive ? "text-primary-600" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {schools.length > 1 && (
            <select
              value={activeSchool.id}
              onChange={(e) => selectSchool(e.target.value)}
              className="hidden rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 outline-none focus:border-primary-400 sm:block"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
          <Link
            href="/admissions"
            className="hidden items-center gap-1.5 rounded-full bg-primary-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-800 lg:inline-flex"
          >
            Apply Now
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 xl:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-gray-100 bg-white px-6 py-3 xl:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.to;
              return (
                <Link
                  key={link.to}
                  href={link.to}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive ? "bg-primary-50 text-primary-600" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
          {schools.length > 1 && (
            <select
              value={activeSchool.id}
              onChange={(e) => selectSchool(e.target.value)}
              className="mt-3 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none focus:border-primary-400"
            >
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </nav>
      )}
    </header>
  );
}
