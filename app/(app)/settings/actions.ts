"use server";

import { requireUser } from "@/lib/supabase/auth";
import { forceRecalculateRollovers } from "@/lib/rollover";
import { revalidatePath } from "next/cache";

export async function handleRecalculateRollovers() {
  const { supabase, user } = await requireUser();

  try {
    await forceRecalculateRollovers(supabase, user.id);
    
    // Revalidate paths to update UI
    revalidatePath("/");
    revalidatePath("/transactions");
    revalidatePath("/reports");
    
    return { ok: true };
  } catch (error: any) {
    console.error("Failed to recalculate rollovers:", error);
    return { ok: false, error: error.message || "Gagal menghitung ulang rollover." };
  }
}
