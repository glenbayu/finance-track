"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown, Search } from "lucide-react";

export type FilterOption = { value: string; label: string };

type FilterSelectProps = {
  /** Dipakai untuk aria-label dan judul bottom sheet di mobile */
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
  /** Tampilkan kotak cari di dalam list (berguna untuk daftar kategori yang panjang) */
  searchable?: boolean;
  /** true kalau filter sedang aktif (bukan nilai default) -> pill diberi aksen */
  active?: boolean;
  /** Ikon kecil di kiri label (opsional) */
  icon?: ReactNode;
  /** sm = 36px (mobile chip), md = 40px (sejajar dengan input di toolbar desktop) */
  size?: "sm" | "md";
  /** pill = rounded-full, soft = rounded-lg */
  shape?: "pill" | "soft";
  /** chip = pill kecil untuk filter; field = tampil seperti input form (pakai class input-base) */
  variant?: "chip" | "field";
  /** Teks saat belum ada nilai yang cocok, mis. "Pilih kategori" */
  placeholder?: string;
  /** id untuk trigger, supaya bisa dihubungkan dengan <label htmlFor> */
  id?: string;
  className?: string;
};

type Position = { top?: number; bottom?: number; left: number; minWidth: number };

const DESKTOP_QUERY = "(min-width: 768px)";
const MENU_MAX_HEIGHT = 288; // px, tinggi maksimum list di popover desktop

export default function FilterSelect({
  label,
  value,
  options,
  onChange,
  searchable = false,
  active = false,
  icon,
  size = "sm",
  shape = "pill",
  variant = "chip",
  placeholder,
  id,
  className,
}: FilterSelectProps) {
  const [open, setOpen] = useState(false);
  const [entered, setEntered] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [pos, setPos] = useState<Position | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const uid = useId();

  // Desktop = popover, mobile = bottom sheet
  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_QUERY);
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  const selected = options.find((o) => o.value === value);

  const measure = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const spaceBelow = window.innerHeight - r.bottom;
    const openUp = spaceBelow < 240 && r.top > spaceBelow;
    const minWidth = Math.max(r.width, 200);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - minWidth - 8));
    setPos(
      openUp
        ? { bottom: window.innerHeight - r.top + 6, left, minWidth }
        : { top: r.bottom + 6, left, minWidth },
    );
  }, []);

  const openMenu = () => {
    setQuery("");
    setActiveIndex(Math.max(0, options.findIndex((o) => o.value === value)));
    measure();
    setOpen(true);
  };

  const close = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const choose = (next: string) => {
    onChange(next);
    close();
  };

  useEffect(() => {
    if (!open) {
      setEntered(false);
      return;
    }

    const raf = requestAnimationFrame(() => setEntered(true));
    // Di desktop fokus langsung ke kotak cari; di mobile fokus ke list supaya keyboard tidak langsung muncul
    (searchable && isDesktop ? searchRef.current : listRef.current)?.focus({ preventScroll: true });

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    if (isDesktop) {
      window.addEventListener("resize", measure);
      window.addEventListener("scroll", measure, true);
    } else {
      document.body.style.overflow = "hidden";
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, isDesktop, searchable, close, measure]);

  // Jaga item yang aktif tetap kelihatan saat navigasi keyboard
  useEffect(() => {
    if (!open) return;
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex]);

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = filtered[activeIndex];
      if (opt) choose(opt.value);
    }
  };

  const panel = (
    <div onKeyDown={onKeyDown}>
      {searchable && (
        <div className="relative px-2 pb-1 pt-2">
          <Search
            size={14}
            className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2"
            style={{ color: "var(--lk-text-faint)" }}
          />
          <input
            ref={searchRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder={`Cari ${label.toLowerCase()}...`}
            aria-label={`Cari ${label.toLowerCase()}`}
            className="h-10 w-full rounded-lg border pl-8 pr-3 text-sm outline-none"
            style={{
              borderColor: "var(--lk-border)",
              background: "var(--lk-surface-raised)",
              color: "var(--lk-text)",
            }}
          />
        </div>
      )}

      <div
        ref={listRef}
        id={`${uid}-list`}
        role="listbox"
        aria-label={label}
        tabIndex={searchable ? -1 : 0}
        aria-activedescendant={filtered[activeIndex] ? `${uid}-opt-${activeIndex}` : undefined}
        className="overflow-y-auto p-1.5 outline-none"
        style={{ maxHeight: isDesktop ? MENU_MAX_HEIGHT : "min(55vh, 24rem)" }}
      >
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm" style={{ color: "var(--lk-text-muted)" }}>
            Tidak ada hasil
          </p>
        ) : (
          filtered.map((opt, i) => {
            const isSelected = opt.value === value;
            const isActive = i === activeIndex;
            return (
              <button
                key={`${opt.value}-${i}`}
                id={`${uid}-opt-${i}`}
                type="button"
                role="option"
                aria-selected={isSelected}
                data-index={i}
                tabIndex={-1}
                onClick={() => choose(opt.value)}
                onMouseEnter={() => setActiveIndex(i)}
                className="flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-sm md:min-h-9"
                style={{
                  background: isActive ? "var(--lk-surface-raised)" : "transparent",
                  color: isSelected ? "var(--lk-primary)" : "var(--lk-text)",
                  fontWeight: isSelected ? 600 : 500,
                  WebkitTapHighlightColor: "transparent",
                }}
              >
                <span className="truncate">{opt.label}</span>
                {isSelected && <Check size={16} strokeWidth={2.5} className="shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  const popover = pos && (
    <>
      <div className="fixed inset-0 z-[100]" onClick={close} />
      <div
        className="fixed z-[101] overflow-hidden rounded-xl border shadow-lg"
        style={{
          top: pos.top,
          bottom: pos.bottom,
          left: pos.left,
          minWidth: pos.minWidth,
          maxWidth: "calc(100vw - 16px)",
          background: "var(--lk-surface)",
          borderColor: "var(--lk-border)",
        }}
      >
        {panel}
      </div>
    </>
  );

  const sheet = (
    <div className="fixed inset-0 z-[100]">
      <div
        className="absolute inset-0 bg-black/40"
        style={{ opacity: entered ? 1 : 0, transition: "opacity 200ms ease" }}
        onClick={close}
      />
      <div
        className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t"
        style={{
          background: "var(--lk-surface)",
          borderColor: "var(--lk-border)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          transform: entered ? "translateY(0)" : "translateY(100%)",
          transition: "transform 220ms cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <div
          className="mx-auto mt-2.5 h-1 w-9 rounded-full"
          style={{ background: "var(--lk-border)" }}
        />
        <p className="px-4 pb-1 pt-3 text-sm font-semibold" style={{ color: "var(--lk-text)" }}>
          {label}
        </p>
        {panel}
      </div>
    </div>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        id={id}
        aria-label={variant === "chip" ? label : undefined}
        onClick={open ? close : openMenu}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            openMenu();
          }
        }}
        className={
          variant === "field"
            ? `input-base ${className ?? ""}`
            : `inline-flex shrink-0 items-center justify-between gap-1.5 border pl-3.5 pr-3 text-sm font-medium ${
                size === "md" ? "h-10" : "h-9"
              } ${shape === "soft" ? "rounded-lg" : "rounded-full"} ${className ?? ""}`
        }
        style={
          variant === "field"
            ? {
                // Layout lewat inline style supaya tidak kalah dengan CSS global .input-base
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "0.5rem",
                width: "100%",
                textAlign: "left",
                cursor: "pointer",
                color: selected ? "var(--lk-text)" : "var(--lk-text-muted)",
                WebkitTapHighlightColor: "transparent",
              }
            : {
                minHeight: size === "md" ? "2.5rem" : "2.25rem",
                borderColor: active ? "var(--lk-primary)" : "var(--lk-border)",
                background: active ? "var(--lk-primary-dim)" : "var(--lk-surface-raised)",
                color: "var(--lk-text)",
                WebkitTapHighlightColor: "transparent",
              }
        }
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {icon ? (
            <span className="shrink-0" style={{ color: "var(--lk-text-faint)" }}>
              {icon}
            </span>
          ) : null}
          <span className="truncate">{selected?.label ?? placeholder ?? label}</span>
        </span>
        <ChevronDown
          size={14}
          style={{
            color: "var(--lk-text-faint)",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 150ms ease",
          }}
        />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(isDesktop ? popover : sheet, document.body)
        : null}
    </>
  );
}