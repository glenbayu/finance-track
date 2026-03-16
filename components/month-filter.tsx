"use client";

import { useEffect, useId, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, LoaderCircle } from "lucide-react";

type MonthFilterProps = {
  selectedMonth: string;
  className?: string;
};

export default function MonthFilter({
  selectedMonth,
  className = "",
}: MonthFilterProps) {
  const inputId = useId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [displayMonth, setDisplayMonth] = useState(selectedMonth);

  useEffect(() => {
    setDisplayMonth(selectedMonth);
  }, [selectedMonth]);

  function handleMonthChange(nextMonth: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextMonth) {
      params.set("month", nextMonth);
    } else {
      params.delete("month");
    }

    const query = params.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;

    startTransition(() => {
      router.replace(nextUrl);
    });
  }

  return (
    <div className={`relative min-w-0 ${className}`}>
      <label htmlFor={inputId} className="sr-only">
        Pilih bulan
      </label>
      <CalendarDays
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"
      />
      <input
        id={inputId}
        type="month"
        value={displayMonth}
        onChange={(event) => {
          const nextMonth = event.currentTarget.value;
          setDisplayMonth(nextMonth);
          handleMonthChange(nextMonth);
        }}
        className="input-base h-10 w-full min-w-[170px] py-2 pl-9 pr-10 sm:min-w-[210px]"
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
