import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  IDLE_COOKIE,
  createIdleCookieOptions,
  MAX_IDLE_MS,
} from "@/lib/auth/idle-session";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Refresh auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname === "/login" || pathname === "/signup";
  const isPublicRoute =
    isAuthRoute ||
    pathname.startsWith("/api/session") ||
    pathname === "/offline";

  // Redirect unauthenticated users from protected routes to login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    redirectResponse.cookies.delete(IDLE_COOKIE);
    return redirectResponse;
  }

  // Redirect authenticated users from login/signup to dashboard
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    redirectResponse.cookies.set(
      IDLE_COOKIE,
      String(Date.now()),
      createIdleCookieOptions(process.env.NODE_ENV === "production"),
    );
    return redirectResponse;
  }

  // Handle idle expiration directly in middleware so skeleton never flashes before redirect
  if (user && !isPublicRoute) {
    const now = Date.now();
    const rawLastActivity = request.cookies.get(IDLE_COOKIE)?.value;
    const lastActivity = rawLastActivity ? Number(rawLastActivity) : null;

    if (
      typeof lastActivity === "number" &&
      Number.isFinite(lastActivity) &&
      now - lastActivity > MAX_IDLE_MS
    ) {
      await supabase.auth.signOut();
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("error", "Session Expired");
      const redirectResponse = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value, cookie);
      });
      redirectResponse.cookies.delete(IDLE_COOKIE);
      return redirectResponse;
    }

    // Pastikan cookie aktivitas selalu aktif dan ter-refresh
    supabaseResponse.cookies.set(
      IDLE_COOKIE,
      String(now),
      createIdleCookieOptions(process.env.NODE_ENV === "production"),
    );
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.svg|manifest.webmanifest|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
