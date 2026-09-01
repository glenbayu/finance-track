import dns from "node:dns/promises";

// Daftar domain disposable / temporary email populer
const DISPOSABLE_DOMAINS = new Set([
  "10minutemail.com",
  "10minutemail.net",
  "tempmail.com",
  "temp-mail.org",
  "tempmail.net",
  "guerrillamail.com",
  "guerrillamail.net",
  "guerrillamail.org",
  "guerrillamail.biz",
  "guerrillamailblock.com",
  "sharklasers.com",
  "grr.la",
  "mailinator.com",
  "mailinator2.com",
  "mailinator.net",
  "yopmail.com",
  "yopmail.fr",
  "yopmail.net",
  "dispostable.com",
  "throwawaymail.com",
  "trashmail.com",
  "trashmail.net",
  "trashmail.org",
  "fakemailgenerator.com",
  "getnada.com",
  "inboxkitten.com",
  "mohmal.com",
  "crazymailing.com",
  "emailondeck.com",
  "generator.email",
  "mytemp.email",
  "minutemail.com",
  "tempinbox.com",
  "burnermail.io",
  "dropmail.me",
  "maildrop.cc",
  "nada.ltd",
  "getairmail.com",
  "disposablemail.com",
  "trash-mail.com",
  "tempail.com",
  "fakeinbox.com",
  "mailcatch.com",
  "tmail.ws",
]);

// Basic RFC 5322 regex check
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export type EmailValidationResult = {
  isValid: boolean;
  error?: string;
};

/**
 * Validasi email: format -> disposable email -> DNS MX Record
 */
export async function validateEmail(email: string): Promise<EmailValidationResult> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Validasi Format & Karakter Dasar
  if (!cleanEmail || cleanEmail.length > 254) {
    return { isValid: false, error: "Format alamat email tidak valid." };
  }

  if (!EMAIL_REGEX.test(cleanEmail)) {
    return { isValid: false, error: "Format alamat email tidak valid." };
  }

  const parts = cleanEmail.split("@");
  if (parts.length !== 2) {
    return { isValid: false, error: "Format alamat email tidak valid." };
  }

  const [, domain] = parts;

  // Pastikan domain memiliki ekstensi TLD yang valid (minimal ada titik)
  if (!domain.includes(".") || domain.endsWith(".")) {
    return { isValid: false, error: "Domain email tidak valid." };
  }

  // 2. Filter Disposable / Temporary Email
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      isValid: false,
      error: "Pendaftaran menggunakan email sementara/disposable tidak diizinkan.",
    };
  }

  // 3. DNS Lookup: Cek MX Record (dengan Timeout 3s)
  try {
    const mxLookup = async () => {
      const records = await dns.resolveMx(domain);
      return records && records.length > 0;
    };

    const hasMx = await Promise.race([
      mxLookup(),
      new Promise<boolean>((_, reject) =>
        setTimeout(() => reject(new Error("DNS_TIMEOUT")), 3000)
      ),
    ]);

    if (!hasMx) {
      return {
        isValid: false,
        error: `Domain "@${domain}" tidak dapat menerima email (MX record tidak ditemukan).`,
      };
    }
  } catch (err: unknown) {
    const error = err as { code?: string; message?: string };

    // Jika domain tidak ditemukan di DNS (ENOTFOUND / ENODATA / NXDOMAIN / NOTFOUND)
    if (
      error.code === "ENOTFOUND" ||
      error.code === "ENODATA" ||
      error.code === "NXDOMAIN" ||
      error.code === "NOTFOUND"
    ) {
      // Coba fallback cek A record (beberapa domain kecil menerima mail via A record)
      try {
        const aRecords = await dns.resolve4(domain);
        if (!aRecords || aRecords.length === 0) {
          return {
            isValid: false,
            error: `Domain "@${domain}" tidak ditemukan atau tidak aktif.`,
          };
        }
      } catch {
        return {
          isValid: false,
          error: `Domain "@${domain}" tidak ditemukan atau tidak memiliki server email aktif.`,
        };
      }
    } else if (error.message === "DNS_TIMEOUT") {
      // Fail-open saat DNS timeout agar user asli tidak terhalang jika ada gangguan jaringan sementara
      console.warn(`[EmailValidator] DNS timeout untuk domain: ${domain}, membiarkan proses berlanjut.`);
    } else {
      // Error jaringan lainnya (misal dev offline) -> fail-open
      console.warn(`[EmailValidator] Error saat memeriksa DNS domain ${domain}:`, error);
    }
  }

  return { isValid: true };
}
