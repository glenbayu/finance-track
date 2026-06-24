import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { IDLE_COOKIE } from "@/lib/auth/idle-session";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const response = new NextResponse(null, {
    status: 204,
  });
  response.cookies.delete(IDLE_COOKIE);

  return response;
}

