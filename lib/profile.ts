/** Display names are personal labels, not legal identities. Allow all scripts. */
export const PROFILE_NAME_MAX_LENGTH = 80;

export function validateProfileName(value: string): string | undefined {
  const name = value.trim();
  if (!name) return "Nama tidak boleh kosong. Isi nama yang ingin ditampilkan.";
  if (name.length > PROFILE_NAME_MAX_LENGTH) return "Nama maksimal 80 karakter. Gunakan nama yang lebih singkat.";
  if (/\p{Cc}/u.test(name)) return "Nama tidak boleh memuat karakter kontrol atau baris baru.";
}

export type ProfileUpdateResult =
  | { ok: true; name: string }
  | { ok: false; error: string; field?: "name" };
