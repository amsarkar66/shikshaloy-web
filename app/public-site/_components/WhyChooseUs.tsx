"use client";

import { motion } from "framer-motion";
import { BookOpen, FlaskConical, Trophy, Bus, Wifi, ShieldCheck } from "lucide-react";
import { Reveal, RevealStagger, RevealItem } from "./Reveal";

const FEATURES = [
  { icon: BookOpen, title: "Well-Stocked Library", description: "A dedicated reading space with a growing collection across subjects and grade levels." },
  { icon: FlaskConical, title: "Science & Computer Labs", description: "Hands-on labs that bring the curriculum to life with modern equipment." },
  { icon: Trophy, title: "Sports & Co-curricular", description: "Dedicated grounds and coaching for sports, arts, and cultural activities." },
  { icon: Bus, title: "Safe Transport", description: "Monitored school transport covering key routes across the city." },
  { icon: Wifi, title: "Smart Classrooms", description: "Digitally equipped classrooms that support interactive, modern teaching." },
  { icon: ShieldCheck, title: "Safe Campus", description: "A secure, supervised campus with a strong focus on student wellbeing." },
];

export function WhyChooseUs() {
  return (
    <section className="bg-gray-50 py-16">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal>
          <h2 className="text-2xl font-bold text-gray-900">Why Choose Us</h2>
        </Reveal>
        <RevealStagger className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <RevealItem key={f.title}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <f.icon className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-900">{f.title}</p>
                <p className="mt-1 text-sm text-gray-500">{f.description}</p>
              </motion.div>
            </RevealItem>
          ))}
        </RevealStagger>
      </div>
    </section>
  );
}
