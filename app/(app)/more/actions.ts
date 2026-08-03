"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  
  if (!name) {
    throw new Error("Nama tidak boleh kosong.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { full_name: name }
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/more");
  revalidatePath("/settings");
  revalidatePath("/");
}
