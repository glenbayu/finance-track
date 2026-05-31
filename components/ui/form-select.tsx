"use client";

import { createPortal } from "react-dom";
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { Check, ChevronDown } from "lucide-react";

type FormSelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type FormSelectProps = {
  name: string;
  value?: string;
  defaultValue?: string;
  options: FormSelectOption[];
  onValueChange?: (nextValue: string) => void;
  required?: boolean;
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
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
  defaultValue,
  options,
  onValueChange,
  required,
  placeholder,
  icon,
  disabled,
}: FormSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const listboxId = useId();
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null);
  const isControlled = typeof value === "string";
  const selectedValue = isControlled ? value : internalValue;

  const selectedOption = useMemo(
    () => options.find((option) => option.value === selectedValue),
    [options, selectedValue],
  );
  const preferredIndex = useMemo(() => {
    const selectedIndex = options.findIndex((option) => option.value === selectedValue);
    if (selectedIndex >= 0 && !options[selectedIndex]?.disabled) {
      return selectedIndex;
    }

    return options.findIndex((option) => !option.disabled);
  }, [options, selectedValue]);

  const triggerLabel =
    selectedOption?.label ?? placeholder ?? "Pilih salah satu";
  const isPlaceholderVisible = !selectedOption || selectedOption.value === "";

  const setNextValue = (nextValue: string) => {
    if (!isControlled) {
      setInternalValue(nextValue);
    }
    onValueChange?.(nextValue);
  };

  useEffect(() => {
    if (!isOpen) return;

    const updateMenuPosition = () => {
      const root = rootRef.current;
      if (!root) return;

      const rect = root.getBoundingClientRect();
      const viewportPadding = 8;
      const gap = 8;
      const defaultMaxHeight = 256;
      const availableBelow = window.innerHeight - rect.bottom - viewportPadding;
      const availableAbove = rect.top - viewportPadding;
      const openUpward = availableBelow < 220 && availableAbove > availableBelow;
      const maxHeight = Math.max(
        140,
        Math.min(defaultMaxHeight, (openUpward ? availableAbove : availableBelow) - gap),
      );

      const top = openUpward
        ? Math.max(viewportPadding, rect.top - gap - maxHeight)
        : Math.min(window.innerHeight - viewportPadding - maxHeight, rect.bottom + gap);

      setMenuStyle({
        position: "fixed",
        top: `${Math.round(top)}px`,
        left: `${Math.round(rect.left)}px`,
        width: `${Math.round(rect.width)}px`,
        maxHeight: `${Math.round(maxHeight)}px`,
        zIndex: 9999,
      });
    };

    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);

    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      const clickedInsideRoot = Boolean(rootRef.current?.contains(target));
      const clickedInsideMenu = Boolean(menuRef.current?.contains(target));
      if (!clickedInsideRoot && !clickedInsideMenu) {
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
            setNextValue(active.value);
            setIsOpen(false);
          }
        }
      }}
    >
      <select
        name={name}
        value={selectedValue}
        onChange={(event) => setNextValue(event.target.value)}
        required={required}
        disabled={disabled}
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
        disabled={disabled}
        className={`input-base flex items-center justify-between gap-2 text-left ${
          disabled ? "cursor-not-allowed opacity-70" : ""
        } ${
          isPlaceholderVisible
            ? "text-slate-400 dark:text-slate-500"
            : "text-slate-800 dark:text-slate-100"
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        onClick={() => {
          if (disabled) return;

          setIsOpen((current) => {
            if (!current) {
              setActiveIndex(preferredIndex);
            }

            return !current;
          });
        }}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;

          event.preventDefault();
          setIsOpen(true);
          setActiveIndex(preferredIndex);
        }}
      >
        <span className="truncate">{triggerLabel}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {icon}
          <ChevronDown
            size={16}
            className={`text-slate-500 dark:text-slate-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && menuStyle && typeof document !== "undefined"
        ? createPortal(
            <ul
              id={listboxId}
              ref={menuRef}
              role="listbox"
              style={menuStyle}
              className="overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_24px_48px_-24px_rgba(15,23,42,0.4)] dark:border-slate-700 dark:bg-slate-900 dark:shadow-[0_28px_52px_-28px_rgba(2,6,23,0.95)]"
            >
              {options.map((option, index) => {
                const isSelected = option.value === selectedValue;
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
                        setNextValue(option.value);
                        setIsOpen(false);
                      }}
                    >
                      <span className="truncate">{option.label}</span>
                      {isSelected ? <Check size={14} className="text-slate-700 dark:text-slate-200" /> : null}
                    </button>
                  </li>
                );
              })}
            </ul>,
            document.body,
          )
        : null}
    </div>
  );
}
