import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ROLE_HOME: Record<string, string> = {
  kernel: "/dashboard",
  super_admin: "/dashboard",
  admin: "/dashboard",
  teacher: "/dashboard",
  parent: "/dashboard",
  student: "/dashboard",
};

export async function middleware(request: NextRequest) {
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
  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (isDashboardRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && pathname === "/login") {
    const role = user.user_metadata?.role as string | undefined;
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
