import { DEMO_ACCOUNTS } from "@/lib/demo/config";
import { FadeIn, StaggerChildren, StaggerItem } from "@/components/ui/fade-in";

// Split so the grid-line intersection dots (only meaningful for a clean
// 3-col x 2-row block) can be positioned against the first 6 roles, while
// the 7th (Driver) spans the full width of its own closing row.
const GRID_ACCOUNTS = DEMO_ACCOUNTS.slice(0, 6);
const LAST_ACCOUNT = DEMO_ACCOUNTS[6];

function RoleCell({ account }: { account: (typeof DEMO_ACCOUNTS)[number] }) {
  return (
    <a
      href={`#${account.slug}`}
      className="group flex h-full min-h-[220px] flex-col items-center justify-center gap-4 px-8 py-10 text-center transition-colors duration-300 hover:bg-white/70"
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm shadow-zinc-900/5">
        <account.icon className="h-6 w-6 text-primary-600" />
      </span>
      <div>
        <h3 className="text-lg font-bold text-zinc-900">{account.label}</h3>
        <p className="mt-2 max-w-[240px] text-sm text-zinc-500 leading-relaxed text-balance">
          {account.pitch}
        </p>
      </div>
    </a>
  );
}

export function DemoRoleComparison() {
  return (
    <section className="pb-24 sm:pb-32 border-t border-zinc-100 bg-zinc-50/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-24 sm:pt-32">
        <FadeIn className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-zinc-900 tracking-tight">
            Compare every role at a glance
          </h2>
          <p className="mt-3 text-zinc-500 max-w-xl mx-auto text-balance">
            Each role sees a purpose-built slice of the same dashboard — here&apos;s
            what each one unlocks.
          </p>
        </FadeIn>

        <div className="relative">
          <StaggerChildren className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-200/70">
            {GRID_ACCOUNTS.map((account) => (
              <StaggerItem key={account.slug} className="bg-zinc-50">
                <RoleCell account={account} />
              </StaggerItem>
            ))}
          </StaggerChildren>

          <div className="h-px bg-zinc-200/70" />

          <div className="bg-zinc-50">
            <RoleCell account={LAST_ACCOUNT} />
          </div>

          {/* Intersection dots — three equal-height rows (min-h-[220px] cells), so the
              two horizontal dividers fall exactly at 1/3 and 2/3 of this wrapper. */}
          <span className="hidden lg:flex h-4 w-4 items-center justify-center absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 rounded-md bg-zinc-50">
            <span className="h-1.5 w-1.5 rounded-[2px] bg-zinc-300" />
          </span>
          <span className="hidden lg:flex h-4 w-4 items-center justify-center absolute top-1/3 left-2/3 -translate-x-1/2 -translate-y-1/2 rounded-md bg-zinc-50">
            <span className="h-1.5 w-1.5 rounded-[2px] bg-zinc-300" />
          </span>
          <span className="hidden lg:flex h-4 w-4 items-center justify-center absolute top-2/3 left-1/3 -translate-x-1/2 -translate-y-1/2 rounded-md bg-zinc-50">
            <span className="h-1.5 w-1.5 rounded-[2px] bg-zinc-300" />
          </span>
          <span className="hidden lg:flex h-4 w-4 items-center justify-center absolute top-2/3 left-2/3 -translate-x-1/2 -translate-y-1/2 rounded-md bg-zinc-50">
            <span className="h-1.5 w-1.5 rounded-[2px] bg-zinc-300" />
          </span>
        </div>
      </div>
    </section>
  );
}
