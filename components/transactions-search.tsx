"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle, Search } from "lucide-react";

type TransactionsSearchProps = {
  defaultValue?: string;
  className?: string;
  placeholder?: string;
};

export default function TransactionsSearch({
  defaultValue = "",
  className = "",
  placeholder = "Cari catatan, kategori, atau tipe...",
}: TransactionsSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

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
        router.replace(nextUrl);
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
        placeholder={placeholder}
        className="input-base h-10 w-full py-2 pl-9 pr-10"
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
