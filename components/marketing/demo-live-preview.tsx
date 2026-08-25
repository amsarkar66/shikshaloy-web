import { FadeIn } from "@/components/ui/fade-in";
import { DemoFeatureShowcase } from "@/components/marketing/demo-feature-showcase";
import { SHOWCASE_FEATURES } from "@/components/marketing/showcase-features";

export function DemoLivePreview() {
  return (
    <section className="pb-24 sm:pb-32">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center mb-16 max-w-2xl mx-auto">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-zinc-900 tracking-tight text-balance">
            Every one of these <span className="text-primary-600">12 modules</span> is{" "}
            <span className="text-primary-600">100% real</span>
          </h2>
          <p className="mt-4 text-zinc-500 text-balance">
            The exact same screens every Shikshaloy customer sees — pick a
            module below to try it live.
          </p>
        </FadeIn>

        <FadeIn>
          <DemoFeatureShowcase features={SHOWCASE_FEATURES} />
        </FadeIn>
      </div>
    </section>
  );
}
