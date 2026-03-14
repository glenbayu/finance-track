"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

type FormSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type FormSelectProps = {
  name: string;
  value: string;
  options: FormSelectOption[];
  onValueChange: (nextValue: string) => void;
  required?: boolean;
  placeholder?: string;
};

function getNextIndex(
  currentIndex: number,
  options: FormSelectOption[],
  direction: 1 | -1,
) {
  if (!options.length) return -1;

  let nextIndex = currentIndex;
  for (let i = 0; i < options.length; i += 1) {
    nextIndex = (nextIndex + direction + options.length) % options.length;
    if (!options[nextIndex]?.disabled) {
      return nextIndex;
    }
  }

  return -1;
}

export default function FormSelect({
  name,
  value,
  options,
  onValueChange,
  required,
  placeholder,
}: FormSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );
  const preferredIndex = useMemo(() => {
    const selectedIndex = options.findIndex((option) => option.value === value);
    if (selectedIndex >= 0 && !options[selectedIndex]?.disabled) {
      return selectedIndex;
    }

    return options.findIndex((option) => !option.disabled);
  }, [options, value]);

  const triggerLabel =
    selectedOption?.label ?? placeholder ?? "Pilih salah satu";
  const isPlaceholderVisible = !selectedOption || selectedOption.value === "";

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <div
      ref={rootRef}
      className="relative"
      onKeyDown={(event) => {
        if (!isOpen) return;

        if (event.key === "ArrowDown") {
          event.preventDefault();
          setActiveIndex((prev) => getNextIndex(prev, options, 1));
        }

        if (event.key === "ArrowUp") {
          event.preventDefault();
          setActiveIndex((prev) => getNextIndex(prev, options, -1));
        }

        if (event.key === "Enter" && activeIndex >= 0) {
          event.preventDefault();
          const active = options[activeIndex];
          if (active && !active.disabled) {
            onValueChange(active.value);
            setIsOpen(false);
          }
        }
      }}
    >
      <select
        name={name}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        required={required}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      >
        {options.map((option) => (
          <option key={`${name}-${option.value}`} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        className={`input-base flex items-center justify-between gap-2 text-left ${
          isPlaceholderVisible
            ? "text-slate-400 dark:text-slate-500"
            : "text-slate-800 dark:text-slate-100"
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() =>
          setIsOpen((current) => {
            if (!current) {
              setActiveIndex(preferredIndex);
            }

            return !current;
          })
        }
        onKeyDown={(event) => {
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

          event.preventDefault();
          setIsOpen(true);
          setActiveIndex(preferredIndex);
        }}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-slate-500 dark:text-slate-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-40 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_24px_48px_-24px_rgba(15,23,42,0.4)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_28px_52px_-28px_rgba(2,6,23,0.95)]"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value;
            const isActive = index === activeIndex;

            return (
              <li key={`${name}-item-${option.value}`} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  disabled={option.disabled}
                  className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                    option.disabled
                      ? "cursor-not-allowed text-slate-300 dark:text-slate-600"
                      : isActive
                        ? "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-slate-100"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800"
                  }`}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => {
                    if (option.disabled) return;
                    onValueChange(option.value);
                    setIsOpen(false);
                  }}
                >
                  <span className="truncate">{option.label}</span>
                  {isSelected ? <Check size={14} className="text-slate-700 dark:text-slate-200" /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
