"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MapPin, Phone, Mail } from "lucide-react";
import type { PublicSchool } from "@/lib/domains/public-site-data";
import { resolveActiveSchool } from "../_lib/resolve-active-school";

const QUICK_LINKS = [
  { to: "/about", label: "About" },
  { to: "/faculty", label: "Faculty" },
  { to: "/admissions", label: "Admissions" },
  { to: "/results", label: "Check Result" },
  { to: "/gallery", label: "Gallery" },
  { to: "/announcements", label: "Announcements" },
  { to: "/events", label: "Events" },
  { to: "/contact", label: "Contact & Grievance" },
];

export function Footer({ schools }: { schools: PublicSchool[] }) {
  const searchParams = useSearchParams();
  const school = resolveActiveSchool(schools, searchParams.get("school") ?? undefined);
  const address = [school.address, school.city, school.state].filter(Boolean).join(", ");

  return (
    <footer className="border-t border-gray-200 bg-gray-900 text-gray-300">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
          <div>
            <h3 className="text-lg font-bold text-white">{school.name}</h3>
            {school.tagline && <p className="mt-1 text-sm text-gray-400">{school.tagline}</p>}

            <div className="mt-6 flex flex-col gap-2 text-sm">
              {address && (
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0 text-primary-400" /> {address}
                </span>
              )}
              {school.phone && (
                <a href={`tel:${school.phone}`} className="flex items-center gap-2 hover:text-white">
                  <Phone className="h-4 w-4 shrink-0 text-primary-400" /> {school.phone}
                </a>
              )}
              {school.email && (
                <a href={`mailto:${school.email}`} className="flex items-center gap-2 hover:text-white">
                  <Mail className="h-4 w-4 shrink-0 text-primary-400" /> {school.email}
                </a>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Quick Links</p>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              {QUICK_LINKS.map((link) => (
                <Link key={link.to} href={link.to} className="text-gray-400 hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-8 border-t border-gray-800 pt-6 text-xs text-gray-500">
          © {new Date().getFullYear()} {school.name}. Powered by Shikshaloy.
        </p>
      </div>
    </footer>
  );
}
