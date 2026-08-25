import type { ReactNode } from "react";
import { Share2, Plus, Copy } from "lucide-react";

interface DemoPreviewChromeProps {
  label: string;
  description: string;
  icon: ReactNode;
  content: ReactNode;
}

export function DemoPreviewChrome({ label, description, icon, content }: DemoPreviewChromeProps) {
  return (
    <div className="relative rounded-2xl p-3">
      <div className="absolute inset-0 rounded-2xl bg-zinc-100 [-webkit-mask-image:linear-gradient(to_bottom,#000_60%,transparent_100%)] [mask-image:linear-gradient(to_bottom,#000_60%,transparent_100%)]" />

      <div className="relative flex items-center gap-2.5 px-1.5 pb-3 pt-0.5">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-white text-primary-600 ring-1 ring-zinc-950/[0.08] shadow-[0_1px_1px_rgba(0,0,0,0.02),0_2px_4px_rgba(0,0,0,0.05)] [&_svg]:h-3 [&_svg]:w-3">
          {icon}
        </span>
        <div className="flex min-w-0 items-center gap-2">
          <h3 className="shrink-0 text-sm font-semibold text-zinc-900">{label}</h3>
          <span className="text-zinc-300">·</span>
          <p className="truncate text-xs text-zinc-500">{description}</p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <span className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-400">
            <Share2 className="h-3 w-3" />
          </span>
          <span className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-400">
            <Plus className="h-3 w-3" />
          </span>
          <span className="flex h-6 w-6 items-center justify-center rounded-md text-zinc-400">
            <Copy className="h-3 w-3" />
          </span>
        </div>
      </div>

      {/* Rendered dashboard content — real component, preview-only */}
      <div className="relative z-10 aspect-[16/9] w-full overflow-hidden rounded-2xl bg-white shadow-xl shadow-zinc-900/5 ring-1 ring-zinc-200/60">
        <div className="pointer-events-none absolute inset-0 select-none overflow-hidden">{content}</div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white to-transparent" />
      </div>
    </div>
  );
}
