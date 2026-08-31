import { BannerManager } from "@/app/dashboard/schools/_components/banner-upload";
import type { SchoolBanner } from "@/lib/schools/banner-actions";

export function CarouselSection({ initialBanners }: { initialBanners: SchoolBanner[] }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <h2 className="text-sm font-bold text-gray-900 dark:text-zinc-50">Carousel</h2>
      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
        Rotates as a slideshow on your public website homepage. Landscape, up to 2MB each. Changes go live immediately.
      </p>
      <div className="mt-4">
        <BannerManager initialBanners={initialBanners} />
      </div>
    </div>
  );
}
