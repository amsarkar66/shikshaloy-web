"use client";

import { Lottie } from "lottie-react";
import { motion } from "framer-motion";
import { FancyButton } from "@/components/ui/fancy-button";
import enrollSuccessAnimation from "@/public/lottie/enroll-success.json";

export function EnrollmentSuccessModal({ studentName, onContinue }: { studentName: string; onContinue: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="w-full max-w-xs rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl text-center"
      >
        <Lottie src={enrollSuccessAnimation} loop={false} autoplay className="mx-auto h-28 w-28" />
        <p className="mt-1 text-base font-semibold text-gray-900 dark:text-zinc-50">Enrollment Successful!</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">{studentName} is now an enrolled student.</p>
        <FancyButton onClick={onContinue} size="sm" className="mt-5 w-full">Continue</FancyButton>
      </motion.div>
    </div>
  );
}
