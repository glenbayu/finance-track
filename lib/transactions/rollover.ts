import { SupabaseClient } from "@supabase/supabase-js";

/**
 * Recalculate the current month's wallet rollovers.
 *
 * The calculation runs in a single PostgreSQL transaction. The database
 * function serializes calls per user, so concurrent dashboard/settings requests
 * cannot create duplicate generated rows or apply a partial recalculation.
 */
export async function forceRecalculateRollovers(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await supabase.rpc("recalculate_monthly_rollovers", {
    p_user_id: userId,
  });

  if (error) {
    throw new Error(`Gagal menghitung ulang rollover: ${error.message}`);
  }
}
