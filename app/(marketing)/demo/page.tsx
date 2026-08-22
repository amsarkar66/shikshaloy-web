import { RefreshCcw, ShieldCheck } from "lucide-react";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/fade-in";
import { DemoLoginButton } from "@/components/marketing/demo-login-button";
import { DEMO_ACCOUNTS } from "@/lib/demo/config";

export default function DemoPage() {
  return (
    <main className="bg-white">
      <section className="relative pt-40 pb-16 sm:pb-20 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-primary-200/40 rounded-full blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <p className="text-primary-600 font-semibold text-sm uppercase tracking-widest mb-3">
              Live Demo
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-zinc-900 tracking-tight text-balance">
              Pick a role. See the real dashboard.
            </h1>
            <p className="mt-5 text-lg text-zinc-500 text-balance">
              No signup, no forms — one click signs you into a fully populated
              demo school as that role, using the exact same dashboard every
              Shikshaloy customer uses.
            </p>
          </FadeIn>

          <FadeIn className="mt-8 inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50/60 px-4 py-2 text-xs font-medium text-zinc-500">
            <RefreshCcw className="h-3.5 w-3.5" />
            Demo data resets automatically every night, so it&apos;s always tidy for the next visitor.
          </FadeIn>
        </div>
      </section>

      <section className="pb-24 sm:pb-32">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {DEMO_ACCOUNTS.map((account) => (
              <StaggerItem key={account.slug}>
                <div
                  id={account.slug}
                  className="scroll-mt-28 flex flex-col h-full rounded-2xl border border-zinc-200 bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-lg hover:shadow-zinc-100 hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className={`inline-flex items-center justify-center h-11 w-11 rounded-xl mb-4 ${account.accent}`}>
                    <account.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900 mb-2">{account.label}</h3>
                  <p className="text-zinc-500 text-sm leading-relaxed mb-6 flex-1">{account.pitch}</p>
                  <DemoLoginButton email={account.email} password={account.password} label={account.label} />
                </div>
              </StaggerItem>
            ))}
          </StaggerChildren>

          <FadeIn className="mt-14 flex items-start gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/60 p-6 max-w-3xl mx-auto">
            <ShieldCheck className="h-5 w-5 text-primary-600 shrink-0 mt-0.5" />
            <p className="text-sm text-zinc-600 leading-relaxed">
              These are shared demo accounts for evaluation only — please don&apos;t
              enter real personal data into them. Everything you see or change
              is reset to a clean baseline every night.
            </p>
          </FadeIn>
        </div>
      </section>
    </main>
  );
}
