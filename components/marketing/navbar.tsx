"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { FancyButton } from "@/components/ui/fancy-button";
import { Menu, X, LayoutDashboard, LogOut, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const links = [
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Live Demo", href: "/demo" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

function getInitials(user: User): string {
  const name = user.user_metadata?.full_name as string | undefined;
  if (name) {
    const parts = name.trim().split(" ").filter(Boolean);
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : parts[0][0].toUpperCase();
  }
  return (user.email ?? "?")[0].toUpperCase();
}

function getDashboardHref(): string {
  return "/dashboard";
}

function UserAvatar({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const dashHref = getDashboardHref();
  const initials = getInitials(user);
  const role = (user.user_metadata?.role as string | undefined) ?? "";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 rounded-full focus:outline-none"
        aria-label="User menu"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-b from-primary-400 to-primary-500 text-sm font-bold text-white shadow-[0_2px_0_0_var(--color-primary-700)] ring-2 ring-primary-100 transition-all hover:brightness-105">
          {initials}
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-zinc-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl border border-zinc-200 bg-white py-1.5 shadow-xl shadow-zinc-200/60">
          {/* User info */}
          <div className="border-b border-zinc-100 px-3 pb-2.5 pt-1.5">
            <p className="text-xs font-semibold text-zinc-900">
              {(user.user_metadata?.full_name as string) || "Account"}
            </p>
            <p className="truncate text-[11px] text-zinc-500">{user.email}</p>
            {role && (
              <span className="mt-1 inline-flex items-center rounded-full bg-primary-50 px-1.5 py-0.5 text-[10px] font-medium capitalize text-primary-700">
                {role.replace("_", " ")}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="p-1">
            <Link
              href={dashHref}
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-900"
            >
              <LayoutDashboard className="h-4 w-4" />
              Go to dashboard
            </Link>
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "border-b border-zinc-200 bg-white/85 backdrop-blur-md"
          : "border-b border-transparent bg-white/40 backdrop-blur-sm"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Shikshaloy" width={32} height={32} className="h-8 w-8" priority />
          <span className="text-lg font-bold text-zinc-900 tracking-tight">
            Shikshaloy
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop right */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <UserAvatar user={user} />
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors px-3 py-2"
              >
                Sign In
              </Link>
              <FancyButton href="/signup" className="text-sm">
                Get Started Free
              </FancyButton>
            </>
          )}
        </div>

        <button
          className="md:hidden text-zinc-900"
          onClick={() => setOpen(!open)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-zinc-200 px-4 py-4 space-y-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="block text-zinc-600 hover:text-zinc-900 text-sm py-2"
              onClick={() => setOpen(false)}
            >
              {l.label}
            </Link>
          ))}
          <div className="pt-2 flex flex-col gap-2">
            {user ? (
              <FancyButton href={getDashboardHref()} className="w-full">
                Go to Dashboard
              </FancyButton>
            ) : (
              <>
                <Link
                  href="/login"
                  className="w-full text-center rounded-full border border-zinc-200 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Sign In
                </Link>
                <FancyButton href="/signup" className="w-full">
                  Get Started Free
                </FancyButton>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
