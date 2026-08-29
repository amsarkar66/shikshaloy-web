"use client";

import { motion } from "framer-motion";
import { GraduationCap, BookOpen } from "lucide-react";
import type { PublicFaculty } from "@/lib/domains/public-site-data";

export function TeacherProfileCard({ teacher }: { teacher: PublicFaculty }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-6 flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-8 text-center"
    >
      {teacher.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={teacher.photoUrl} alt={teacher.fullName} className="h-28 w-28 rounded-full object-cover shadow-sm" />
      ) : (
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-primary-500 text-3xl font-bold text-white">
          {teacher.fullName.slice(0, 1)}
        </div>
      )}

      <h1 className="mt-4 text-2xl font-bold text-gray-900">{teacher.fullName}</h1>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-sm text-gray-500">
        {teacher.designation && (
          <span className="flex items-center gap-1">
            <GraduationCap className="h-4 w-4 text-primary-500" /> {teacher.designation}
          </span>
        )}
        {teacher.department && (
          <span className="flex items-center gap-1">
            <BookOpen className="h-4 w-4 text-primary-500" /> {teacher.department}
          </span>
        )}
      </div>

      {teacher.bio && <p className="mx-auto mt-6 max-w-lg text-sm leading-relaxed text-gray-600">{teacher.bio}</p>}
    </motion.div>
  );
}
