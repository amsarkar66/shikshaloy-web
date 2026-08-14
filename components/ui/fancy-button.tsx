import Link from "next/link";
import { cn } from "@/lib/utils";

type FancyButtonVariant = "primary" | "white" | "dark" | "ghost";
type FancyButtonSize = "xs" | "sm" | "default" | "lg";

// Shared AlignUI "fancy button" recipe: a flat fill, a 1px gradient-border
// pseudo-element (mask trick) for the glassy top edge, and a translucent
// white top-to-transparent sheen that brightens on hover — every variant
// below only supplies its own fill/ring/shadow color, so they all read as
// the same button family instead of mixing a flat style with a chunky
// offset-shadow "gummy" style.
const base =
  "group/fancy relative inline-flex shrink-0 select-none items-center justify-center gap-1.5 font-semibold whitespace-nowrap outline-none transition-[transform,filter,box-shadow] duration-150 ease-out active:translate-y-px disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-3 focus-visible:ring-primary-400/50 before:pointer-events-none before:absolute before:inset-0 before:z-10 before:rounded-[inherit] before:bg-gradient-to-b before:from-white/[.16] before:to-transparent before:p-px before:[mask-clip:content-box,border-box] before:[mask-composite:exclude] before:[mask-image:linear-gradient(#fff_0_0),linear-gradient(#fff_0_0)] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:bg-gradient-to-b after:from-white after:to-transparent after:opacity-0 after:transition-opacity after:duration-200 after:ease-out hover:after:opacity-[.14] active:after:opacity-[.06]";

const variants: Record<FancyButtonVariant, string> = {
  primary:
    "bg-primary-500 text-white shadow-[0_0_0_1px_var(--color-primary-700),0_2px_4px_-1px_rgba(15,23,20,0.32)] hover:shadow-[0_0_0_1px_var(--color-primary-700),0_4px_10px_-2px_rgba(15,23,20,0.36)] active:shadow-[0_0_0_1px_var(--color-primary-700),0_1px_2px_-1px_rgba(15,23,20,0.32)]",
  white:
    "bg-white text-zinc-900 shadow-[0_0_0_1px_var(--color-zinc-200),0_2px_4px_-1px_rgba(0,0,0,0.06)] hover:bg-zinc-50 hover:shadow-[0_0_0_1px_var(--color-zinc-300),0_4px_10px_-2px_rgba(0,0,0,0.08)] active:shadow-[0_0_0_1px_var(--color-zinc-200),0_1px_2px_-1px_rgba(0,0,0,0.06)]",
  dark: "bg-zinc-900 text-white shadow-[0_0_0_1px_rgba(0,0,0,0.6),0_2px_4px_-1px_rgba(0,0,0,0.4)] hover:brightness-110 hover:shadow-[0_0_0_1px_rgba(0,0,0,0.6),0_4px_10px_-2px_rgba(0,0,0,0.5)] active:shadow-[0_0_0_1px_rgba(0,0,0,0.6),0_1px_2px_-1px_rgba(0,0,0,0.4)]",
  ghost:
    "bg-white/10 text-white shadow-[0_0_0_1px_rgba(255,255,255,0.15)] hover:bg-white/15 hover:shadow-[0_0_0_1px_rgba(255,255,255,0.2)] active:shadow-[0_0_0_1px_rgba(255,255,255,0.15)]",
};

// Radius scales with height using the theme's --radius-* tokens (same scale
// `ui/button.tsx` draws from) instead of a single fixed value, so every size
// keeps the reference button's corner-radius-to-height ratio and all of them
// move together if the theme's base --radius ever changes.
const sizes: Record<FancyButtonSize, string> = {
  // Dashboard densities — icon-leading action buttons (New, Save, Upload…).
  xs: "h-8 rounded-md px-3 text-xs",
  sm: "h-9 rounded-lg px-4 text-sm",
  // Marketing densities — bigger, icon-trailing CTAs.
  default: "h-10 rounded-lg pl-5 pr-4 text-sm",
  lg: "h-12 rounded-xl pl-7 pr-6 text-base",
};

interface FancyButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  variant?: FancyButtonVariant;
  size?: FancyButtonSize;
  href?: string;
  children: React.ReactNode;
}

export function FancyButton({
  variant = "primary",
  size = "default",
  href,
  className,
  children,
  ...props
}: FancyButtonProps) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
}

// Matches the arrow-right-up glyph used by the AlignUI cta-05 reference button.
export function ArrowUpRightIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      fill="currentColor"
      className={cn("relative z-10 shrink-0 text-white/[.64]", className)}
    >
      <path d="M5.63589 19.7784L4.22169 18.3644L15.657 6.92908L10.0712 6.92908V4.92908L19.0712 4.92908L19.0712 13.9291H17.0712L17.0712 8.34326L5.63589 19.7784Z" />
    </svg>
  );
}
