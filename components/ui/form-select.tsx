"use client";

import { useId, useRef, useState, useEffect, useCallback, type ReactNode } from "react";
import { Check, ChevronDown } from "lucide-react";

type FormSelectOption = { value: string; label: string; disabled?: boolean };
type FormSelectProps = {
  name: string;
  id?: string;
  label?: string;
  value?: string;
  defaultValue?: string;
  options: FormSelectOption[];
  onValueChange?: (nextValue: string) => void;
  required?: boolean;
  placeholder?: string;
  icon?: ReactNode;
  disabled?: boolean;
  variant?: "default" | "chip";
};


const fieldLabels: Record<string, string> = {
  type: "Jenis", category_id: "Kategori", wallet_id: "Dompet",
  destination_wallet_id: "Dompet tujuan", target_id: "Kategori tujuan",
  target_category_id: "Kategori tujuan", source_id: "Dompet asal",
  icon: "Ikon", color: "Warna", sort: "Urutan", currency: "Mata uang",
};

export default function FormSelect({
  name, id, label, value, defaultValue, options, onValueChange,
  required, placeholder, disabled, variant = "default",
}: FormSelectProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const ariaLabel = label ?? fieldLabels[name] ?? placeholder ?? name.replaceAll("_", " ");

  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState(
    isControlled ? value : (defaultValue ?? "")
  );

  // Sync controlled value
  useEffect(() => {
    if (isControlled) setInternalValue(value!);
  }, [isControlled, value]);

  const currentValue = isControlled ? value! : internalValue;

  const selectedLabel =
    options.find((o) => o.value === currentValue)?.label ??
    placeholder ??
    ariaLabel;

  const isPlaceholderShown = !options.find((o) => o.value === currentValue);

  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelAbove, setPanelAbove] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  // Close on outside click / escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    const handleClick = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        panelRef.current && !panelRef.current.contains(e.target as Node)
      ) close();
    };
    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open, close]);

  // Position panel above/below based on available space
  useEffect(() => {
    if (!open || !triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    setPanelAbove(spaceBelow < 220 && rect.top > 220);
  }, [open]);

  const handleSelect = (optValue: string) => {
    if (!isControlled) setInternalValue(optValue);
    onValueChange?.(optValue);
    close();
  };

  const isChip = variant === "chip";
  const isFilterActive = isChip && currentValue !== "" && currentValue !== "all";

  // ── Chip Variant: Native overlay select for 100% reliable mobile & desktop pickers ──
  if (isChip) {
    return (
      <div
        className="form-select-chip-root relative inline-flex items-center flex-shrink-0"
        style={{
          borderRadius: "9999px",
          border: `1px solid ${isFilterActive ? "var(--lk-primary)" : "var(--lk-border-strong)"}`,
          background: isFilterActive ? "var(--lk-primary-dim)" : "var(--lk-surface-raised)",
          transition: "border-color 150ms ease, background-color 150ms ease, color 150ms ease",
        }}
      >
        {/* Invisible native select overlay that captures taps & clicks */}
        <select
          id={inputId}
          name={name}
          value={currentValue}
          required={required}
          disabled={disabled}
          aria-label={ariaLabel}
          onChange={(e) => {
            const next = e.target.value;
            if (!isControlled) setInternalValue(next);
            onValueChange?.(next);
          }}
          className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
          style={{
            WebkitAppearance: "none",
            appearance: "none",
            fontSize: "16px", // prevents iOS Safari zoom on focus
          }}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>

        {/* Visual Pill Presentation */}
        <div
          aria-hidden="true"
          className="inline-flex items-center gap-1.5 pointer-events-none select-none"
          style={{
            padding: "0.35rem 0.65rem 0.35rem 0.75rem",
            fontSize: "0.8rem",
            fontWeight: 500,
            color: isFilterActive ? "var(--lk-primary-light)" : "var(--lk-text)",
            minHeight: "34px",
          }}
        >
          <span
            style={{
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              color: isFilterActive ? "var(--lk-primary-light)" : "var(--lk-text-muted)",
              fontSize: "0.8rem",
            }}
          >
            {selectedLabel}
          </span>
          <ChevronDown
            size={13}
            style={{
              flexShrink: 0,
              color: isFilterActive ? "var(--lk-primary)" : "var(--lk-text-muted)",
            }}
          />
        </div>
      </div>
    );
  }

  // ── Default Variant: Form select for modals & pages ──
  return (
    <div className="form-select-root" style={{ position: "relative", width: "100%", flexShrink: 0 }}>
      {/* Hidden native select for form submission compatibility */}
      <select
        id={inputId}
        name={name}
        value={currentValue}
        required={required}
        disabled={disabled}
        aria-hidden="true"
        tabIndex={-1}
        onChange={() => {}}
        style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>
        ))}
      </select>

      {/* Custom trigger button */}
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-controls={`${inputId}-listbox`}
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="form-select-trigger input-base"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.5rem",
          cursor: disabled ? "not-allowed" : "pointer",
          textAlign: "left",
          userSelect: "none",
          width: "100%",
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <span
          style={{
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            color: isPlaceholderShown ? "var(--lk-text-faint)" : "var(--lk-text)",
            fontSize: "0.875rem",
          }}
        >
          {selectedLabel}
        </span>
        <ChevronDown
          size={15}
          style={{
            flexShrink: 0,
            color: "var(--lk-text-muted)",
            transition: "transform 180ms ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          id={`${inputId}-listbox`}
          role="listbox"
          aria-label={ariaLabel}
          className="form-select-panel"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            zIndex: 200,
            ...(panelAbove
              ? { bottom: "calc(100% + 4px)" }
              : { top: "calc(100% + 4px)" }),
            backgroundColor: "var(--lk-surface)",
            border: "1px solid var(--lk-border-strong)",
            borderRadius: "0.625rem",
            boxShadow:
              "0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.05)",
            overflow: "hidden",
            animation: "form-select-in 140ms cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          <ul
            style={{
              margin: 0,
              padding: "0.3rem",
              listStyle: "none",
              maxHeight: "200px",
              overflowY: "auto",
              overscrollBehavior: "contain",
            }}
          >
            {placeholder && (
              <li
                role="option"
                aria-selected={isPlaceholderShown}
                aria-disabled="true"
                style={{
                  padding: "0.5rem 0.625rem",
                  fontSize: "0.8125rem",
                  color: "var(--lk-text-faint)",
                  fontStyle: "italic",
                  cursor: "default",
                  borderRadius: "0.375rem",
                }}
              >
                {placeholder}
              </li>
            )}
            {options.map((opt) => {
              const isSelected = currentValue === opt.value;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled}
                  onClick={() => !opt.disabled && handleSelect(opt.value)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "0.5rem",
                    padding: "0.55rem 0.625rem",
                    fontSize: "0.875rem",
                    fontWeight: isSelected ? 600 : 400,
                    borderRadius: "0.4rem",
                    cursor: opt.disabled ? "not-allowed" : "pointer",
                    opacity: opt.disabled ? 0.4 : 1,
                    color: isSelected ? "var(--lk-primary-light)" : "var(--lk-text)",
                    backgroundColor: isSelected ? "var(--lk-primary-dim)" : "transparent",
                    transition: "background-color 100ms ease, color 100ms ease",
                    WebkitTapHighlightColor: "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !opt.disabled)
                      (e.currentTarget as HTMLElement).style.backgroundColor = "var(--lk-surface-hover)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      isSelected ? "var(--lk-primary-dim)" : "transparent";
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {opt.label}
                  </span>
                  {isSelected && (
                    <Check size={14} style={{ flexShrink: 0, color: "var(--lk-primary)" }} />
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
