import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  createIdleCookieOptions,
  IDLE_COOKIE,
  MAX_IDLE_MS,
} from "@/lib/auth/idle-session";

export async function POST() {
  const cookieStore = await cookies();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const response = new NextResponse(null, {
    status: 204,
  });

  if (!user) {
    response.cookies.delete(IDLE_COOKIE);
    return response;
  }

  const now = Date.now();
  const rawLastActivity = cookieStore.get(IDLE_COOKIE)?.value;
  const lastActivity = rawLastActivity ? Number(rawLastActivity) : null;
  const isExpired =
    typeof lastActivity === "number" &&
    Number.isFinite(lastActivity) &&
    now - lastActivity > MAX_IDLE_MS;

  if (isExpired) {
    await supabase.auth.signOut();
    const expiredResponse = NextResponse.json(
      {
        expired: true,
      },
      {
        status: 401,
      },
    );
    expiredResponse.cookies.delete(IDLE_COOKIE);
    return expiredResponse;
  }

  response.cookies.set(
    IDLE_COOKIE,
    String(now),
    createIdleCookieOptions(process.env.NODE_ENV === "production"),
  );

  return response;
}
