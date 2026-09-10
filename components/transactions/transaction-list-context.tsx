"use client";

import Link from "next/link";
import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { safeTransactionListUrl } from "@/lib/ui/presentation";

const STORAGE_KEY = "finance-track-transaction-list";
const EVENT = "ft_transaction_list";

export function readTransactionListUrl() {
  try { return safeTransactionListUrl(window.sessionStorage.getItem(STORAGE_KEY)); }
  catch { return "/transactions"; }
}

function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  return () => window.removeEventListener(EVENT, callback);
}

export function TransactionListMemory() {
  const pathname = usePathname();
  const params = useSearchParams();
  useEffect(() => {
    // Server-action redirects carry a toast; do not overwrite the list being returned to.
    if (pathname !== "/transactions" || params.has("toast")) return;
    const query = params.toString();
    try {
      window.sessionStorage.setItem(STORAGE_KEY, query ? `${pathname}?${query}` : pathname);
      window.dispatchEvent(new Event(EVENT));
    } catch { /* Navigation still works when browser storage is unavailable. */ }
  }, [pathname, params]);
  return null;
}

export function TransactionReturnLink({ children, className }: { children: ReactNode; className?: string }) {
  const href = useSyncExternalStore(subscribe, readTransactionListUrl, () => "/transactions");
  return <Link href={href} className={className}>{children}</Link>;
}
