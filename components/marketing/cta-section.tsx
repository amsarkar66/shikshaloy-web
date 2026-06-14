import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/ui/fade-in";

export function CtaSection() {
  return (
    <section className="bg-indigo-950 py-24 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/20 rounded-full blur-3xl" />
      </div>

      <FadeIn className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
          Ready to Transform Your School?
        </h2>
        <p className="mt-4 text-indigo-200 text-lg max-w-xl mx-auto">
          Join 500+ schools already using Shikshaloy. Get started in minutes — no credit card required.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/login">
            <Button
              size="lg"
              className="bg-indigo-500 hover:bg-indigo-400 text-white px-8 py-6 text-base font-semibold rounded-xl group"
            >
              Get Started Free
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="#contact">
            <Button
              size="lg"
              variant="ghost"
              className="text-indigo-200 hover:text-white hover:bg-white/10 px-8 py-6 text-base font-semibold rounded-xl border border-white/10"
            >
              Talk to Sales
            </Button>
          </Link>
        </div>
      </FadeIn>
    </section>
  );
}
