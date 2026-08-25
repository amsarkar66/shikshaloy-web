import { Quote } from "lucide-react";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/fade-in";

// PLACEHOLDER COPY — not real customers. Every quote/name/designation/school
// below must be replaced with a genuine, attributable testimonial before
// this section ships to production.
const TESTIMONIALS = [
  {
    quote:
      "We switched from spreadsheets to Shikshaloy and cut our fee-collection follow-ups in half. The parent app alone was worth it.",
    name: "[Name]",
    designation: "Principal",
    school: "[School Name]",
  },
  {
    quote:
      "Attendance used to eat up the first ten minutes of every period. Now it's done before the bell finishes ringing.",
    name: "[Name]",
    designation: "Teacher",
    school: "[School Name]",
  },
  {
    quote:
      "I can see my daughter's attendance and homework the same day, not at the end of the term.",
    name: "[Name]",
    designation: "Parent",
    school: "[School Name]",
  },
  {
    quote:
      "Setting up our whole school took an afternoon. Support answered every question we had.",
    name: "[Name]",
    designation: "Admin",
    school: "[School Name]",
  },
];

export function DemoTestimonials() {
  return (
    <section className="pb-24 sm:pb-32 bg-zinc-50/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-16 max-w-2xl mx-auto">
          <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-3">
            Testimonials
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight text-balance">
            What schools are saying
          </h2>
        </FadeIn>

        <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {TESTIMONIALS.map((t) => (
            <StaggerItem key={t.quote}>
              <div className="flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:border-primary-200 hover:shadow-md hover:shadow-primary-50 hover:-translate-y-0.5 transition-all duration-300">
                <Quote className="h-6 w-6 text-primary-200" fill="currentColor" />
                <p className="mt-3 flex-1 text-[15px] text-zinc-700 leading-relaxed text-balance">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3 border-t border-zinc-100 pt-5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-zinc-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/user-profile-icon.svg" alt="" className="h-full w-full" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900">{t.name}</p>
                    <p className="truncate text-xs text-zinc-500">
                      {t.designation} · {t.school}
                    </p>
                  </div>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}
