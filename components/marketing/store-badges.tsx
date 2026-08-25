const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.shikshaloy.edu";

// Source: svgl.app (googleplay.svg) — official multicolor Google Play mark.
function GooglePlayIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 466 511.98" className={className} fill="none">
      <g fillRule="nonzero">
        <path fill="#EA4335" d="M199.9 237.8 1.4 470.17c7.22 24.57 30.16 41.81 55.8 41.81 11.16 0 20.93-2.79 29.3-8.37l244.16-139.46L199.9 237.8z" />
        <path fill="#FBBC04" d="m433.91 205.1-104.65-60-111.61 110.22 113.01 108.83 104.64-58.6c18.14-9.77 30.7-29.3 30.7-50.23-1.4-20.93-13.95-40.46-32.09-50.22z" />
        <path fill="#34A853" d="M199.42 273.45 329.27 145.1 87.9 8.37C79.53 2.79 68.36 0 57.2 0 30.7 0 6.98 18.14 1.4 41.86l198.02 231.59z" />
        <path fill="#4285F4" d="M1.39 41.86C0 46.04 0 51.63 0 57.2v397.64c0 5.57 0 9.76 1.4 15.34l216.27-214.86L1.39 41.86z" />
      </g>
    </svg>
  );
}

// Source: svgl.app (apple.svg) — official Apple mark, single path (fill: currentColor).
function AppleIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 814 1000" className={className} fill="currentColor">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
    </svg>
  );
}

// Single compact square icon button — e.g. inline in a CTA button row, where
// the full official black "GET IT ON Google Play" badge reads as an oversized,
// mismatched foreign element next to custom-styled buttons.
export function GooglePlayButton({ className = "" }: { className?: string }) {
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Get it on Google Play"
      title="Get it on Google Play"
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm hover:border-zinc-300 hover:shadow-md transition-all ${className}`}
    >
      <GooglePlayIcon className="h-5 w-5" />
    </a>
  );
}

// Compact square variant — e.g. next to a CTA button rather than as its own row.
export function StoreIconButtons({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <a
        href={PLAY_STORE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Get it on Google Play"
        title="Get it on Google Play"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white shadow-sm hover:border-zinc-300 hover:shadow-md transition-all"
      >
        <GooglePlayIcon className="h-5 w-5" />
      </a>

      <div
        aria-label="Coming soon on the App Store"
        title="Coming soon on the App Store"
        className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 select-none"
      >
        <span className="absolute -top-2 -right-2 rounded-md border border-zinc-200 bg-zinc-50 px-1.5 py-[3px] text-[7px] font-bold leading-none tracking-wide text-zinc-600">
          SOON
        </span>
        <AppleIcon className="h-5 w-5 text-zinc-400" />
      </div>
    </div>
  );
}
