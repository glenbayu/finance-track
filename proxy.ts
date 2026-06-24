import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  createIdleCookieOptions,
  IDLE_COOKIE,
  MAX_IDLE_MS,
} from "@/lib/auth/idle-session";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
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
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Important: Server Actions send `next-action` header and expect
  // a specific RSC/action response format. Redirecting them from middleware/proxy
  // can cause "An unexpected response was received from the server".
  const isServerActionRequest =
    request.method === "POST" && request.headers.has("next-action");
  if (isServerActionRequest) {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;

  const redirectWithCookies = (url: URL) => {
    const redirectResponse = NextResponse.redirect(url);

    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });

    return redirectResponse;
  };

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/signup");

  const isProtectedPage =
    pathname === "/" ||
    pathname.startsWith("/transactions") ||
    pathname.startsWith("/categories") ||
    pathname.startsWith("/reports") ||
    pathname.startsWith("/budgets") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/more");

  if (user) {
    const now = Date.now();
    const rawLastActivity = request.cookies.get(IDLE_COOKIE)?.value;
    const lastActivity = rawLastActivity ? Number(rawLastActivity) : null;
    const isExpired =
      typeof lastActivity === "number" &&
      Number.isFinite(lastActivity) &&
      now - lastActivity > MAX_IDLE_MS;

    if (isExpired) {
      await supabase.auth.signOut();

      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set(
        "error",
        "Sesi kamu sudah berakhir karena tidak aktif selama 10 menit.",
      );
      url.searchParams.set("next", `${pathname}${search}`);

      const redirectResponse = redirectWithCookies(url);
      redirectResponse.cookies.delete(IDLE_COOKIE);
      return redirectResponse;
    }

    response.cookies.set(
      IDLE_COOKIE,
      String(now),
      createIdleCookieOptions(request.nextUrl.protocol === "https:"),
    );
  } else {
    response.cookies.delete(IDLE_COOKIE);
  }

  if (!user && isProtectedPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", `${pathname}${search}`);
    return redirectWithCookies(url);
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return redirectWithCookies(url);
  }

  return response;
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/signup",
    "/transactions/:path*",
    "/categories/:path*",
    "/reports/:path*",
    "/budgets/:path*",
    "/settings/:path*",
    "/more/:path*",
  ],
};
