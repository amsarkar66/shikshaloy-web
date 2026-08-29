"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { GraduationCap, ArrowRight } from "lucide-react";
import type { PublicSchool } from "@/lib/domains/public-site-data";
import { RevealStagger, RevealItem } from "./Reveal";

const AVATAR_COLORS = [
  "bg-primary-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-sky-500",
  "bg-pink-500",
];

export function FacultyGrid({
  school,
  limit,
  bare,
}: {
  school: PublicSchool;
  limit?: number;
  bare?: boolean;
}) {
  const items = limit ? school.faculty.slice(0, limit) : school.faculty;

  const body = (
    <>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Our Faculty</h2>
        {limit && school.faculty.length > limit && (
          <Link href="/faculty" className="flex items-center gap-1 text-sm font-semibold text-primary-600 hover:underline">
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-6 text-sm text-gray-500">Faculty information will be published here soon.</p>
      ) : (
        <RevealStagger className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((f, i) => (
            <RevealItem key={f.id}>
              <motion.div whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                <Link
                  href={`/faculty/${f.id}`}
                  className="flex flex-col items-center rounded-xl border border-gray-200 bg-white p-5 text-center shadow-sm transition-shadow hover:shadow-md"
                >
                  {f.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={f.photoUrl}
                      alt={f.fullName}
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold text-white ${
                        AVATAR_COLORS[i % AVATAR_COLORS.length]
                      }`}
                    >
                      {f.fullName.slice(0, 1)}
                    </div>
                  )}
                  <p className="mt-3 text-sm font-semibold text-gray-900">{f.fullName}</p>
                  {f.designation && (
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
                      <GraduationCap className="h-3 w-3" /> {f.designation}
                    </p>
                  )}
                  {f.department && <p className="mt-0.5 text-[11px] text-primary-500">{f.department}</p>}
                </Link>
              </motion.div>
            </RevealItem>
          ))}
        </RevealStagger>
      )}
    </>
  );

  if (bare) return body;

  return (
    <section id="faculty" className="bg-gray-50 py-16">
      <div className="mx-auto max-w-5xl px-6">{body}</div>
    </section>
  );
}
