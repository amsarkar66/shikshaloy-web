import { Skeleton } from "@/components/ui/skeleton";

export function IdCardsSkeleton() {
  return (
    <div className="w-full px-6 py-6">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr_320px] gap-5 items-stretch">
          {/* Left column — selection */}
          <div className="flex flex-col gap-3">
            <div className="flex shrink-0 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden p-1.5 gap-1.5">
              <Skeleton className="h-8 flex-1 rounded-md" />
              <Skeleton className="h-8 flex-1 rounded-md" />
            </div>

            <div className="flex flex-1 flex-col rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
              <div className="shrink-0 space-y-3 border-b border-gray-200 dark:border-zinc-800 p-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-9 flex-1 rounded-lg" />
                  <Skeleton className="h-9 w-9 shrink-0 rounded-lg" />
                </div>
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-16" />
                </div>
              </div>

              <div className="flex-1 min-h-[280px] space-y-4 p-3">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <Skeleton className="h-4 w-4 shrink-0 rounded-sm" />
                    <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
                    <Skeleton className="h-3.5 flex-1 max-w-[110px]" />
                    <Skeleton className="h-3.5 w-12" />
                    <Skeleton className="h-3.5 w-10" />
                  </div>
                ))}
              </div>

              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800/60 px-4 py-3">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-28 rounded-lg" />
              </div>
            </div>
          </div>

          {/* Middle column — canvas / preview */}
          <div className="flex flex-col rounded-xl border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900/40 p-6 min-h-[400px]">
            <Skeleton className="mb-4 h-4 w-36 shrink-0" />
            <div className="flex flex-1 flex-col items-center justify-center gap-3">
              <div className="w-[204px] rounded-2xl border border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-3 shadow-sm">
                <Skeleton className="h-16 w-full rounded-lg" />
                <div className="flex flex-col items-center gap-2 pt-6">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <Skeleton className="h-3.5 w-28" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="mt-2 h-3 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="mt-3 h-10 w-24" />
                </div>
              </div>
              <Skeleton className="h-3 w-64" />
            </div>
          </div>

          {/* Right column — properties */}
          <div className="space-y-5">
            <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 space-y-4">
              <Skeleton className="h-3.5 w-28" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-14" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-5 w-9 rounded-full" />
              </div>
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-5 w-9 rounded-full" />
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 space-y-4">
              <Skeleton className="h-3.5 w-28" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-24 rounded-full" />
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 space-y-4">
              <Skeleton className="h-3.5 w-24" />
              <div className="flex gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex-1 space-y-1.5">
                    <Skeleton className="h-20 w-full rounded-lg" />
                    <Skeleton className="mx-auto h-2.5 w-3/4" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
