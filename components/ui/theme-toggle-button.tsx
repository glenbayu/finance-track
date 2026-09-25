"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

type ThemeToggleButtonProps = {
  className?: string;
  showLabel?: boolean;
  fixed?: boolean;
  variant?: "pill" | "switch" | "segmented";
};

const THEME_KEY = "theme";
const THEME_EVENT = "finance-theme-change";

function normalizeTheme(value: string | null): Theme {
  return value === "dark" ? "dark" : "light";
}

function subscribeTheme(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(THEME_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(THEME_EVENT, callback);
  };
}

function getThemeSnapshot(): Theme {
  if (typeof window === "undefined") return "light";
  return normalizeTheme(window.localStorage.getItem(THEME_KEY));
}

function getServerThemeSnapshot(): Theme {
  return "light";
}

function applyTheme(theme: Theme) {
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  window.localStorage.setItem(THEME_KEY, theme);
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme } }));
}

export default function ThemeToggleButton({
  className = "btn-secondary",
  showLabel = true,
  fixed = false,
  variant = "switch",
}: ThemeToggleButtonProps) {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    const root = document.documentElement;
    root.classList.add("theme-transition");
    applyTheme(nextTheme);

    window.setTimeout(() => {
      root.classList.remove("theme-transition");
    }, 320);
  };

  const isDark = theme === "dark";
  const label = isDark ? "Gelap" : "Terang";

  // ── Dual-Icon Capsule Switch (100% symmetric geometry) ──
  if (variant === "switch" || variant === "segmented") {
    return (
      <button
        type="button"
        role="switch"
        aria-checked={isDark}
        onClick={toggleTheme}
        aria-label={`Mode tampilan saat ini: ${label}. Ketuk untuk beralih mode.`}
        title={`Tema: ${label}`}
        style={{
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          width: "58px",
          height: "32px",
          borderRadius: "9999px",
          border: isDark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.10)",
          backgroundColor: isDark ? "var(--lk-surface-raised)" : "#f1f5f9",
          boxShadow: isDark
            ? "inset 0 1px 2px rgba(0,0,0,0.3)"
            : "inset 0 1px 2px rgba(0,0,0,0.06)",
          padding: "3px",
          cursor: "pointer",
          flexShrink: 0,
          WebkitTapHighlightColor: "transparent",
          outline: "none",
          transition: "background-color 240ms ease, border-color 240ms ease",
        }}
      >
        {/* Slot Left (Sun) — 26x26 */}
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "26px",
            height: "26px",
            color: isDark ? "var(--lk-text-faint)" : "transparent",
            transition: "color 180ms ease",
            pointerEvents: "none",
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <Sun size={14} strokeWidth={2.2} />
        </span>

        {/* Slot Right (Moon) — 26x26 */}
        <span
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "26px",
            height: "26px",
            color: isDark ? "transparent" : "#94a3b8",
            transition: "color 180ms ease",
            pointerEvents: "none",
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          <Moon size={13} strokeWidth={2.2} />
        </span>

        {/* Sliding Active Colored Knob (26x26, slides 26px) */}
        <span
          style={{
            position: "absolute",
            top: "3px",
            left: "3px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "26px",
            height: "26px",
            borderRadius: "50%",
            backgroundColor: isDark ? "var(--lk-primary)" : "#2563eb",
            color: "#ffffff",
            boxShadow: isDark
              ? "0 2px 6px rgba(20, 184, 166, 0.4), 0 1px 2px rgba(0,0,0,0.25)"
              : "0 2px 6px rgba(37, 99, 235, 0.4), 0 1px 2px rgba(0,0,0,0.15)",
            transform: isDark ? "translateX(26px)" : "translateX(0)",
            transition: "transform 240ms cubic-bezier(0.16, 1, 0.3, 1), background-color 240ms ease",
            pointerEvents: "none",
          }}
          aria-hidden="true"
        >
          {isDark ? (
            <Moon size={13} strokeWidth={2.4} />
          ) : (
            <Sun size={14} strokeWidth={2.4} />
          )}
        </span>
      </button>
    );
  }

  // ── Default pill button ──
  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`${className} ${fixed ? "fixed right-4 top-4 z-50" : ""}`}
      style={
        fixed
          ? {
              top: "calc(1rem + env(safe-area-inset-top))",
              right: "calc(1rem + env(safe-area-inset-right))",
            }
          : undefined
      }
      aria-label={`Tema saat ini ${label}. Ketuk untuk ganti tema.`}
      title={`Tema: ${label}`}
    >
      {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
      {showLabel ? <span>{label}</span> : <span className="sr-only">{label}</span>}
    </button>
  );
}