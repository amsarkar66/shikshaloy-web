"use client";

import { motion } from "framer-motion";
import { ArrowRight, Users, MonitorSmartphone, Sparkles } from "lucide-react";
import Link from "next/link";
import type { PublicSchool } from "@/lib/domains/public-site-data";

const FEATURE_PILLS = [
  { icon: Users, label: "Experienced Faculty" },
  { icon: MonitorSmartphone, label: "Smart Classrooms" },
  { icon: Sparkles, label: "Holistic Development" },
];

function admissionsLabel() {
  const year = new Date().getFullYear();
  return `Admissions Open ${year}-${String((year + 1) % 100).padStart(2, "0")}`;
}

export function Hero({ school }: { school: PublicSchool }) {
  return (
    <section className="relative overflow-hidden bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 px-6 pb-24 pt-14 lg:grid-cols-2 lg:gap-12 lg:pb-32 lg:pt-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-amber-500">
            <span className="h-3.5 w-1 rounded-full bg-amber-500" />
            Welcome to {school.name}
          </span>

          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-gray-900 sm:text-5xl">
            Nurturing Minds.
            <br />
            Building Futures.
          </h1>

          <p className="mt-5 max-w-md text-base text-gray-500">
            {school.tagline ??
              `At ${school.name}, we inspire our students to learn, grow and lead with values, creativity and confidence.`}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/admissions"
              className="inline-flex items-center gap-2 rounded-full bg-primary-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-800"
            >
              {admissionsLabel()}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:border-gray-300"
            >
              Explore Our School
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3">
            {FEATURE_PILLS.map((f) => (
              <div key={f.label} className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <f.icon className="h-4 w-4 text-primary-600" />
                {f.label}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
          className="relative mx-auto w-full max-w-md lg:max-w-none"
        >
          <div
            className="absolute left-1/2 top-0 -z-10 h-[85%] w-[85%] -translate-x-1/2 rounded-full bg-gradient-to-br from-amber-100 via-amber-50 to-transparent"
            aria-hidden
          />
          <div
            className="absolute -bottom-6 -right-2 -z-10 hidden h-40 w-40 opacity-50 sm:block"
            style={{
              backgroundImage: "radial-gradient(circle, rgb(35 94 76 / 0.35) 1.5px, transparent 1.5px)",
              backgroundSize: "14px 14px",
            }}
            aria-hidden
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/public-site-hero.png"
            alt={`Students at ${school.name}`}
            className="relative z-10 mx-auto max-h-[30rem] w-auto object-contain sm:max-h-[34rem]"
          />
        </motion.div>
      </div>
    </section>
  );
}
