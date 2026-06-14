import { Star } from "lucide-react";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/fade-in";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "Principal, Delhi Public School",
    avatar: "PS",
    text: "Shikshaloy transformed how we manage our 800-student school. Fee collection, attendance, and communication — all under one roof. The parent app is a game changer.",
    rating: 5,
  },
  {
    name: "Mohammed Rashid",
    role: "Admin, Al-Amin Academy",
    avatar: "MR",
    text: "We used to spend hours on manual attendance and report cards. Now it takes minutes. The teacher portal is intuitive and our staff adopted it within a week.",
    rating: 5,
  },
  {
    name: "Sunita Devi",
    role: "Parent of Class 8 student",
    avatar: "SD",
    text: "I get instant notifications when my daughter is absent or her fees are due. I can even message her class teacher directly. Finally, a school app that actually works.",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="bg-slate-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-16">
          <p className="text-indigo-600 font-semibold text-sm uppercase tracking-widest mb-3">
            Loved by Schools
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            What Schools Are Saying
          </h2>
        </FadeIn>

        <StaggerChildren className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <StaggerItem key={t.name}>
              <div className="rounded-2xl bg-white border border-slate-100 p-8 hover:shadow-lg hover:shadow-slate-100 transition-all duration-300 h-full flex flex-col">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-slate-600 text-sm leading-relaxed mb-6 flex-1">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{t.name}</p>
                    <p className="text-slate-500 text-xs">{t.role}</p>
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
