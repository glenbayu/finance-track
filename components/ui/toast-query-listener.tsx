"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

const PARAM_NAME = "toast";

const TOAST_MESSAGES: Record<string, { type: "success" | "error" | "info"; message: string }> = {
  transaction_created: { type: "success", message: "Transaksi berhasil ditambahkan." },
  transaction_updated: { type: "success", message: "Transaksi berhasil diperbarui." },
  transaction_deleted: { type: "success", message: "Transaksi berhasil dihapus." },
  wallet_saved: { type: "success", message: "Dompet berhasil disimpan." },
  wallet_adjusted: { type: "success", message: "Saldo dompet berhasil disesuaikan." },
  profile_updated: { type: "success", message: "Profil berhasil diperbarui." },
};

export default function ToastQueryListener() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const toastKey = searchParams.get(PARAM_NAME);
    if (!toastKey) return;

    const toastConfig = TOAST_MESSAGES[toastKey] ?? { type: "info" as const, message: toastKey };
    toast[toastConfig.type](toastConfig.message);

    const next = new URLSearchParams(searchParams.toString());
    next.delete(PARAM_NAME);
    const nextUrl = next.toString() ? `${pathname}?${next.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, searchParams]);

  return null;
}
