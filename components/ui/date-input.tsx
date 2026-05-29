"use client";

import { useEffect, useMemo, useState } from "react";

type DateInputProps = {
  name: string;
  defaultValue: string;
  required?: boolean;
  className?: string;
  ariaLabel?: string;
};

function isDateValue(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value);
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function buildIsoDate(year: number, month: number, day: number) {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function toDateParts(value: string) {
  if (!isDateValue(value)) {
    const today = new Date();
    return {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate(),
    };
  }

  const [year, month, day] = value.split("-").map(Number);
  const maxDay = getDaysInMonth(year, month);
  return {
    year,
    month,
    day: Math.min(day, maxDay),
  };
}

export default function DateInput({
  name,
  defaultValue,
  required,
  className = "",
  ariaLabel = "Pilih tanggal",
}: DateInputProps) {
  const [displayDate, setDisplayDate] = useState(defaultValue);
  const [supportsDateInput, setSupportsDateInput] = useState(true);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const selectClassName = `${className} select-base`.trim();

  useEffect(() => {
    setDisplayDate(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const input = document.createElement("input");
    input.setAttribute("type", "date");
    setSupportsDateInput(input.type === "date");
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

  const { year, month, day } = useMemo(
    () => toDateParts(displayDate),
    [displayDate],
  );

  const useDropdownPicker = isCoarsePointer || !supportsDateInput;

  const yearOptions = useMemo(() => {
    const start = year - 6;
    const end = year + 6;
    return Array.from({ length: end - start + 1 }, (_, index) => start + index);
  }, [year]);

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

  const dayOptions = useMemo(() => {
    const maxDay = getDaysInMonth(year, month);
    return Array.from({ length: maxDay }, (_, index) => index + 1);
  }, [year, month]);

  function updateFromParts(nextYear: number, nextMonth: number, nextDay: number) {
    const safeMonth = Math.min(12, Math.max(1, nextMonth));
    const maxDay = getDaysInMonth(nextYear, safeMonth);
    const safeDay = Math.min(maxDay, Math.max(1, nextDay));
    setDisplayDate(buildIsoDate(nextYear, safeMonth, safeDay));
  }

  if (!useDropdownPicker) {
    return (
      <input
        type="date"
        name={name}
        value={displayDate}
        onChange={(event) => setDisplayDate(event.currentTarget.value)}
        className={className}
        required={required}
        aria-label={ariaLabel}
      />
    );
  }

  return (
    <>
      <input type="hidden" name={name} value={displayDate} />
      <div className="grid grid-cols-3 gap-2">
        <label htmlFor={`${name}-day`} className="sr-only">
          Hari
        </label>
        <select
          id={`${name}-day`}
          value={day}
          onChange={(event) => updateFromParts(year, month, Number(event.currentTarget.value))}
          className={selectClassName}
          required={required}
          aria-label="Pilih hari"
        >
          {dayOptions.map((dayOption) => (
            <option key={dayOption} value={dayOption}>
              {dayOption}
            </option>
          ))}
        </select>

        <label htmlFor={`${name}-month`} className="sr-only">
          Bulan
        </label>
        <select
          id={`${name}-month`}
          value={month}
          onChange={(event) => updateFromParts(year, Number(event.currentTarget.value), day)}
          className={selectClassName}
          required={required}
          aria-label="Pilih bulan"
        >
          {monthOptions.map((monthOption) => (
            <option key={monthOption.value} value={monthOption.value}>
              {monthOption.label}
            </option>
          ))}
        </select>

        <label htmlFor={`${name}-year`} className="sr-only">
          Tahun
        </label>
        <select
          id={`${name}-year`}
          value={year}
          onChange={(event) => updateFromParts(Number(event.currentTarget.value), month, day)}
          className={selectClassName}
          required={required}
          aria-label="Pilih tahun"
        >
          {yearOptions.map((yearOption) => (
            <option key={yearOption} value={yearOption}>
              {yearOption}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
