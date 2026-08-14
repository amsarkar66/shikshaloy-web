import { Skeleton } from "@/components/ui/skeleton";

function YourPlanCardSkeleton() {
  return (
    <div className="h-full flex flex-col rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-2 py-4">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
        <Skeleton className="h-4 w-44" />
      </div>

      <div className="pt-4">
        <Skeleton className="mb-4 h-px w-full" />
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-3 w-64" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  );
}

function PlanUsageCardSkeleton() {
  return (
    <div className="h-full rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-2 h-3 w-56" />

      <Skeleton className="my-4 h-px w-full" />

      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i}>
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="mt-2 h-1.5 w-full rounded-full" />
            <div className="mt-1.5 flex items-center justify-between gap-2">
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BillingHistorySkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 dark:border-zinc-700/50">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="mt-1.5 h-3 w-40" />
      </div>
      <div className="border-b border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 px-4 py-3">
        <div className="flex items-center gap-4">
          <Skeleton className="h-3 w-16 flex-1 max-w-[110px]" />
          <Skeleton className="h-3 w-16 flex-1 max-w-[110px]" />
          <Skeleton className="h-3 w-14 flex-1 max-w-[90px]" />
          <Skeleton className="h-3 w-14 flex-1 max-w-[80px]" />
          <Skeleton className="h-3 w-16 flex-1 max-w-[90px]" />
          <Skeleton className="h-3 w-14 flex-1 max-w-[70px]" />
        </div>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <div className="flex flex-1 max-w-[130px] items-center gap-2">
              <Skeleton className="h-7 w-7 shrink-0 rounded-lg" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="h-3 flex-1 max-w-[130px]" />
            <Skeleton className="h-5 flex-1 max-w-[90px] rounded-full" />
            <Skeleton className="h-3 flex-1 max-w-[70px]" />
            <Skeleton className="h-3 flex-1 max-w-[90px]" />
            <Skeleton className="h-5 flex-1 max-w-[70px] rounded-full" />
            <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentMethodCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="mt-1.5 h-3 w-52" />

      <div className="mt-4 flex items-center gap-3 rounded-xl border border-gray-100 dark:border-zinc-800 p-3">
        <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1 space-y-1.5">
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-8 w-16 shrink-0 rounded-lg" />
      </div>

      <Skeleton className="my-4 h-px w-full" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Skeleton className="h-2.5 w-16" />
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  );
}

function IncludedFeaturesCardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <Skeleton className="h-4 w-36" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
            <Skeleton className="h-3 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function BillingSkeleton() {
  return (
    <div className="w-full px-6 py-6 space-y-6">
      {/* Page header */}
      <div className="space-y-2">
        <Skeleton className="h-6 w-56" />
        <Skeleton className="h-3.5 w-72" />
      </div>

      {/* Current plan + usage */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3">
          <YourPlanCardSkeleton />
        </div>
        <div className="lg:col-span-2">
          <PlanUsageCardSkeleton />
        </div>
      </div>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <BillingHistorySkeleton />
        </div>
        <div className="lg:col-span-2 space-y-5">
          <PaymentMethodCardSkeleton />
          <IncludedFeaturesCardSkeleton />
        </div>
      </div>
    </div>
  );
}
