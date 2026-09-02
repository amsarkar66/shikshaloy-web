import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="w-full px-6 py-6 space-y-4">
      {/* Title + publish status + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-3 w-56" />
        </div>
        <div className="sm:ml-auto flex items-center gap-2">
          <Skeleton className="h-9 w-32 rounded-lg" />
          <Skeleton className="h-9 w-24 rounded-lg" />
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Section rail */}
        <nav className="flex shrink-0 gap-1 overflow-x-auto lg:w-56 lg:flex-col lg:overflow-visible">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2">
              <Skeleton className="h-4 w-4 shrink-0" />
              <Skeleton className="h-3.5 w-24" />
            </div>
          ))}
        </nav>

        {/* Section card (Theme) */}
        <div className="min-w-0 flex-1">
          <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5 space-y-4">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-64" />
            </div>

            <div className="space-y-1.5">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2.5 w-56" />
              <div className="flex items-center gap-3 pt-1.5">
                <Skeleton className="h-9 w-12 rounded-lg" />
                <Skeleton className="h-9 w-32 rounded-lg" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>

            <Skeleton className="h-8 w-32 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
