import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAppHost, resolveDomainOwner } from "@/lib/domains/resolve-host";
import { supabaseAdmin } from "@/lib/supabase/service";

const ROLE_HOME: Record<string, string> = {
  kernel: "/dashboard",
  super_admin: "/dashboard",
  admin: "/dashboard",
  teacher: "/dashboard",
  parent: "/dashboard",
  student: "/dashboard",
};

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "";

  // A connected school domain never needs auth/session handling — it's an
  // anonymous public site — so resolve and rewrite before any of that runs.
  if (host && !isAppHost(host)) {
    const ownerId = await resolveDomainOwner(host);
    const url = request.nextUrl.clone();
    url.pathname = ownerId
      ? `/public-site/${ownerId}${request.nextUrl.pathname}`.replace(/\/$/, "") || `/public-site/${ownerId}`
      : "/public-site/not-connected";
    return NextResponse.rewrite(url);
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getSession() decodes the JWT locally — no network call, no latency.
  // Actual server components use getUser() where security matters.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;

  const { pathname } = request.nextUrl;
  const requiresAuth =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/verify-phone");

  if (requiresAuth && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && pathname === "/login") {
    // Post-login redirect destination only — not a security gate (every
    // /dashboard route re-verifies role itself) — but still resolved from
    // `profiles` rather than the client-editable JWT user_metadata so a
    // tampered role can't even steer the initial redirect.
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const role = profile?.role;
    const home = role ? (ROLE_HOME[role] ?? "/") : "/";
    return NextResponse.redirect(new URL(home, request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
