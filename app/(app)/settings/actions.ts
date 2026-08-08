"use server";

import { requireUser } from "@/lib/supabase/auth";
import { forceRecalculateRollovers } from "@/lib/transactions/rollover";
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
  } catch (error: unknown) {
    console.error("Failed to recalculate rollovers:", error);
    const message = error instanceof Error ? error.message : "Gagal menghitung ulang rollover.";
    return { ok: false, error: message };
  }
}
