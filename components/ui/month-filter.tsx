"use client";

import { useEffect, useId, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, LoaderCircle } from "lucide-react";

type MonthFilterProps = {
  selectedMonth: string;
  className?: string;
  forceDropdownPicker?: boolean;
};

function isMonthValue(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

function toMonthParts(value: string) {
  if (!isMonthValue(value)) {
    const today = new Date();
    return {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
    };
  }

  const [year, month] = value.split("-").map(Number);
  return { year, month };
}

export default function MonthFilter({
  selectedMonth,
  className = "",
  forceDropdownPicker = false,
}: MonthFilterProps) {
  const inputId = useId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [displayMonth, setDisplayMonth] = useState(selectedMonth);
  const [supportsMonthInput, setSupportsMonthInput] = useState(true);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);

  useEffect(() => {
    setDisplayMonth(selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "month");
    setSupportsMonthInput(input.type === "month");
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(pointer: coarse)");
    const update = () => setIsCoarsePointer(mediaQuery.matches);
    update();

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    }

    mediaQuery.addListener(update);
    return () => mediaQuery.removeListener(update);
  }, []);

  function handleMonthChange(nextMonth: string) {
    if (nextMonth === selectedMonth) return;
    if (nextMonth && !isMonthValue(nextMonth)) return;

    const params = new URLSearchParams(searchParams.toString());

    if (nextMonth) {
      params.set("month", nextMonth);
    } else {
      params.delete("month");
    }

    params.delete("page");

    const query = params.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;

    startTransition(() => {
      router.replace(nextUrl, { scroll: false });
    });
  }

  const { year: displayYear, month: displayMonthNum } = useMemo(
    () => toMonthParts(displayMonth),
    [displayMonth],
  );

  const yearOptions = useMemo(() => {
    const start = displayYear - 6;
    const end = displayYear + 6;
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [displayYear]);

  const monthOptions = [
    { value: 1, label: "Jan" },
    { value: 2, label: "Feb" },
    { value: 3, label: "Mar" },
    { value: 4, label: "Apr" },
    { value: 5, label: "Mei" },
    { value: 6, label: "Jun" },
    { value: 7, label: "Jul" },
    { value: 8, label: "Agu" },
    { value: 9, label: "Sep" },
    { value: 10, label: "Okt" },
    { value: 11, label: "Nov" },
    { value: 12, label: "Des" },
  ];

  function updateFromFallback(nextYear: number, nextMonthNum: number) {
    const safeMonth = Math.min(12, Math.max(1, nextMonthNum));
    const nextMonth = `${nextYear}-${String(safeMonth).padStart(2, "0")}`;
    setDisplayMonth(nextMonth);
    handleMonthChange(nextMonth);
  }

  const useDropdownPicker = forceDropdownPicker || isCoarsePointer || !supportsMonthInput;

  return (
    <div className={`relative min-w-0 ${className}`}>
      {useDropdownPicker ? (
        <div className="grid grid-cols-2 gap-2">
          <label htmlFor={`${inputId}-month`} className="sr-only">
            Pilih bulan
          </label>
          <select
            id={`${inputId}-month`}
            value={displayMonthNum}
            aria-label="Pilih bulan"
            onChange={(event) => updateFromFallback(displayYear, Number(event.currentTarget.value))}
            className="input-base select-base h-11 py-2 text-base sm:h-10 sm:text-sm"
          >
            {monthOptions.map((monthOption) => (
              <option key={monthOption.value} value={monthOption.value}>
                {monthOption.label}
              </option>
            ))}
          </select>

          <label htmlFor={`${inputId}-year`} className="sr-only">
            Pilih tahun
          </label>
          <select
            id={`${inputId}-year`}
            value={displayYear}
            aria-label="Pilih tahun"
            onChange={(event) => updateFromFallback(Number(event.currentTarget.value), displayMonthNum)}
            className="input-base select-base h-11 py-2 text-base sm:h-10 sm:text-sm"
          >
            {yearOptions.map((yearOption) => (
              <option key={yearOption} value={yearOption}>
                {yearOption}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <>
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
            aria-busy={isPending}
            inputMode="numeric"
            pattern="[0-9]{4}-[0-9]{2}"
            onChange={(event) => {
              const nextMonth = event.currentTarget.value;
              setDisplayMonth(nextMonth);
              handleMonthChange(nextMonth);
            }}
            className="input-base h-11 w-full min-w-0 py-2 pl-9 pr-10 text-base sm:h-10 sm:text-sm"
          />
        </>
      )}
      {isPending ? (
        <LoaderCircle
          size={15}
          className={
            useDropdownPicker
              ? "absolute right-3 top-3 animate-spin text-slate-400"
              : "absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
          }
        />
      ) : null}
    </div>
  );
}
