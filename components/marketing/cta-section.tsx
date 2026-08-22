import { FancyButton, ArrowUpRightIcon } from "@/components/ui/fancy-button";
import { FadeIn } from "@/components/ui/fade-in";

export function CtaSection() {
  return (
    <section className="bg-primary-950 py-24 sm:py-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[420px] bg-primary-600/25 rounded-full blur-3xl" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <FadeIn className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight text-balance">
          Ready to transform your school?
        </h2>
        <p className="mt-4 text-primary-200 text-lg max-w-xl mx-auto text-balance">
          Explore a live, fully populated demo in seconds, or get started for free — no credit card required.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <FancyButton href="/signup" size="lg">
            Get Started Free
            <ArrowUpRightIcon className="size-5" />
          </FancyButton>
          <FancyButton href="/demo" variant="ghost" size="lg">
            Try the Live Demo
          </FancyButton>
        </div>
      </FadeIn>
    </section>
  );
}
