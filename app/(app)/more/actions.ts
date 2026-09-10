"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { validateProfileName, type ProfileUpdateResult } from "@/lib/profile";

export async function updateProfile(formData: FormData): Promise<ProfileUpdateResult> {
  const value = formData.get("name");
  const name = typeof value === "string" ? value.trim() : "";
  const validationError = validateProfileName(name);
  if (validationError) return { ok: false, field: "name", error: validationError };

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { ok: false, error: "Sesi akun berakhir. Silakan masuk kembali sebelum menyimpan profil." };
  }

  // Only the authenticated user's display name is writable in this basic form.
  const { data, error } = await supabase.auth.updateUser({
    data: { full_name: name }
  });

  if (error) {
    return { ok: false, error: "Profil belum tersimpan. Periksa koneksi lalu coba lagi." };
  }
  if (data.user?.user_metadata?.full_name !== name) {
    return { ok: false, error: "Perubahan belum terkonfirmasi. Buka kembali profil untuk memeriksa nama kamu." };
  }

  revalidatePath("/more");
  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { ok: true, name };
}
