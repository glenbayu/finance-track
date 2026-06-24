"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronDown, LoaderCircle } from "lucide-react";
import { formatMonthLabel } from "@/lib/format";

type MonthFilterProps = {
  selectedMonth: string;
  className?: string;
  compact?: boolean;
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
  compact = false,
}: MonthFilterProps) {
  const inputId = useId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const rootRef = useRef<HTMLDivElement | null>(null);
  const compactInputRef = useRef<HTMLInputElement | null>(null);
  const [displayMonth, setDisplayMonth] = useState(selectedMonth);
  const [supportsMonthInput, setSupportsMonthInput] = useState(true);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const [isCompactOpen, setIsCompactOpen] = useState(false);

  useEffect(() => {
    setDisplayMonth(selectedMonth);
  }, [selectedMonth]);

  useEffect(() => {
    if (!isCompactOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!rootRef.current?.contains(target)) {
        setIsCompactOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCompactOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isCompactOpen]);

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
    setIsCompactOpen(false);
    handleMonthChange(nextMonth);
  }

  const useDropdownPicker = isCoarsePointer || !supportsMonthInput;
  const compactLabel = formatMonthLabel(displayMonth);
  const useCompactNativePicker = compact && supportsMonthInput;

  function openCompactNativePicker() {
    const input = compactInputRef.current;
    if (!input) return;

    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }

    input.focus();
    input.click();
  }

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      {useCompactNativePicker ? (
        <>
          <button
            type="button"
            onClick={openCompactNativePicker}
            className="btn-secondary h-10 w-full min-w-0 justify-between gap-2 rounded-2xl px-4 text-sm font-semibold"
          >
            <span className="truncate text-left">{compactLabel}</span>
            <ChevronDown size={16} className="shrink-0 text-slate-500 dark:text-slate-400" />
          </button>

          <label htmlFor={`${inputId}-compact-native`} className="sr-only">
            Pilih bulan
          </label>
          <input
            ref={compactInputRef}
            id={`${inputId}-compact-native`}
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
            tabIndex={-1}
            className="pointer-events-none absolute left-0 top-0 h-px w-px opacity-0"
          />
        </>
      ) : compact ? (
        <>
          <button
            type="button"
            aria-haspopup="dialog"
            aria-expanded={isCompactOpen}
            onClick={() => setIsCompactOpen((current) => !current)}
            className="btn-secondary h-10 w-full min-w-0 justify-between gap-2 rounded-2xl px-4 text-sm font-semibold"
          >
            <span className="truncate text-left">{compactLabel}</span>
            <ChevronDown
              size={16}
              className={`shrink-0 text-slate-500 transition-transform dark:text-slate-400 ${
                isCompactOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isCompactOpen ? (
            <div className="absolute left-0 right-0 top-full z-[90] mt-2 rounded-[22px] border border-[color:var(--stroke)] bg-[color:var(--surface)]/98 p-3 shadow-[0_24px_44px_-26px_rgba(39,31,17,0.34)] backdrop-blur-sm dark:shadow-[0_28px_52px_-28px_rgba(2,6,23,0.95)]">
              <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] gap-2">
                <label htmlFor={`${inputId}-compact-month`} className="sr-only">
                  Pilih bulan
                </label>
                <select
                  id={`${inputId}-compact-month`}
                  value={displayMonthNum}
                  aria-label="Pilih bulan"
                  onChange={(event) => updateFromFallback(displayYear, Number(event.currentTarget.value))}
                  className="input-base select-base h-10 rounded-2xl py-2 text-sm"
                >
                  {monthOptions.map((monthOption) => (
                    <option key={monthOption.value} value={monthOption.value}>
                      {monthOption.label}
                    </option>
                  ))}
                </select>

                <label htmlFor={`${inputId}-compact-year`} className="sr-only">
                  Pilih tahun
                </label>
                <select
                  id={`${inputId}-compact-year`}
                  value={displayYear}
                  aria-label="Pilih tahun"
                  onChange={(event) => updateFromFallback(Number(event.currentTarget.value), displayMonthNum)}
                  className="input-base select-base h-10 rounded-2xl py-2 text-sm"
                >
                  {yearOptions.map((yearOption) => (
                    <option key={yearOption} value={yearOption}>
                      {yearOption}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : null}
        </>
      ) : useDropdownPicker ? (
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
            compact
              ? "absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
              : useDropdownPicker
              ? "absolute right-3 top-3 animate-spin text-slate-400"
              : "absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
          }
        />
      ) : null}
    </div>
  );
}
