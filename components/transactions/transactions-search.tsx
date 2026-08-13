"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, Search } from "lucide-react";

type TransactionsSearchProps = {
  defaultValue?: string;
  className?: string;
  placeholder?: string;
  smallScreenPlaceholder?: string;
  useSmallScreenPlaceholder?: boolean;
};

export default function TransactionsSearch({
  defaultValue = "",
  className = "",
  placeholder = "Cari catatan, kategori, atau tipe...",
  smallScreenPlaceholder = "Cari transaksi...",
  useSmallScreenPlaceholder = false,
}: TransactionsSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(defaultValue);
  const [isSmallScreen, setIsSmallScreen] = useState(false);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (!useSmallScreenPlaceholder) return;
    const media = window.matchMedia("(max-width: 390px)");
    const update = () => setIsSmallScreen(media.matches);
    update();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", update);
      return () => media.removeEventListener("change", update);
    }

    media.addListener(update);
    return () => media.removeListener(update);
  }, [useSmallScreenPlaceholder]);

  const normalized = useMemo(() => value.trim(), [value]);
  const currentSearchInUrl = (searchParams.get("search") ?? "").trim();

  const applySearchToUrl = useCallback(
    (nextValue: string) => {
      const params = new URLSearchParams(searchParams.toString());

      if (nextValue) {
        params.set("search", nextValue);
      } else {
        params.delete("search");
      }

      params.delete("page");

      const query = params.toString();
      const nextUrl = query ? `${pathname}?${query}` : pathname;

      startTransition(() => {
        router.replace(nextUrl, { scroll: false });
      });
    },
    [pathname, router, searchParams, startTransition],
  );

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (normalized === currentSearchInUrl) return;
      applySearchToUrl(normalized);
    }, 420);

    return () => window.clearTimeout(handle);
  }, [applySearchToUrl, currentSearchInUrl, normalized]);

  return (
    <div className={`relative min-w-0 ${className}`}>
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"
      />
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          applySearchToUrl(value.trim());
        }}
        onBlur={() => {
          applySearchToUrl(value.trim());
        }}
        placeholder={useSmallScreenPlaceholder && isSmallScreen ? smallScreenPlaceholder : placeholder}
        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 pl-9 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-800 dark:bg-[#0a0a0a] dark:ring-offset-[#0a0a0a] dark:placeholder:text-slate-400 dark:focus-visible:ring-teal-400 transition-colors"
      />
      {isPending ? (
        <LoaderCircle
          size={15}
          className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
        />
      ) : null}
    </div>
  );
}
