import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  const IDLE_COOKIE = "ft_last_activity";
  const MAX_IDLE_MS = 10 * 60 * 1000;

  let response = NextResponse.next({
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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/signup");

  const isProtectedPage =
    pathname === "/" ||
    pathname.startsWith("/transactions") ||
    pathname.startsWith("/categories");

  if (user) {
    const now = Date.now();
    const rawLastActivity = request.cookies.get(IDLE_COOKIE)?.value;
    const lastActivity = rawLastActivity ? Number(rawLastActivity) : null;
    const isExpired =
      typeof lastActivity === "number" &&
      Number.isFinite(lastActivity) &&
      now - lastActivity > MAX_IDLE_MS;

    if (isExpired) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set(
        "error",
        "Sesi kamu sudah berakhir karena tidak aktif selama 10 menit.",
      );
      url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);

      response = NextResponse.redirect(url);
      await supabase.auth.signOut();
      response.cookies.delete(IDLE_COOKIE);
      return response;
    }

    response.cookies.set(IDLE_COOKIE, String(now), {
      httpOnly: true,
      sameSite: "lax",
      secure: request.nextUrl.protocol === "https:",
      path: "/",
      maxAge: 60 * 60 * 24 * 14,
    });
  } else {
    response.cookies.delete(IDLE_COOKIE);
  }

  if (!user && isProtectedPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
    response = NextResponse.redirect(url);
    response.cookies.delete(IDLE_COOKIE);
    return response;
  }

  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    response = NextResponse.redirect(url);
    return response;
  }

  return response;
}

export const config = {
  matcher: ["/", "/login", "/signup", "/transactions/:path*", "/categories/:path*"],
};
