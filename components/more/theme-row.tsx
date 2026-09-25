"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Sun, Moon } from "lucide-react";

type Theme = "light" | "dark";

const THEME_KEY = "theme";
const THEME_EVENT = "finance-theme-change";
const KNOB = 28; // px, semua tombol toggle ukurannya sama

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
  const root = document.documentElement;
  root.classList.add("theme-transition");
  root.classList.toggle("dark", isDark);
  root.style.colorScheme = isDark ? "dark" : "light";
  window.localStorage.setItem(THEME_KEY, theme);
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme } }));

  window.setTimeout(() => {
    root.classList.remove("theme-transition");
  }, 320);
}

export default function ThemeRow() {
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, getServerThemeSnapshot);

  const isDark = theme === "dark";
  const isLight = theme !== "dark";

  const setTheme = (nextTheme: Theme) => {
    applyTheme(nextTheme);
  };

  const knobStyle = (active: boolean): React.CSSProperties => ({
    // Ukuran dikunci dari semua sisi supaya aturan global
    // (mis. button { min-height: 44px }) tidak bisa bikin tombol melar.
    boxSizing: "border-box",
    width: KNOB,
    height: KNOB,
    minWidth: KNOB,
    minHeight: KNOB,
    maxWidth: KNOB,
    maxHeight: KNOB,
    padding: 0,
    margin: 0,
    border: "none",
    borderRadius: "50%",
    display: "grid",
    placeItems: "center",
    flexShrink: 0,
    cursor: "pointer",
    lineHeight: 0,
    background: active ? "var(--lk-primary, #0f766e)" : "transparent",
    color: active ? "#fff" : "var(--lk-text-faint)",
    transition: "background-color 150ms ease, color 150ms ease",
    WebkitTapHighlightColor: "transparent",
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.875rem",
        padding: "0.8rem 1rem", // sama persis dengan row Link di page.tsx
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: "2.35rem",
          height: "2.35rem",
          borderRadius: "0.55rem",
          background: "linear-gradient(135deg, #0ea5e9, #0284c7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
        }}
      >
        <Monitor size={17} strokeWidth={2} color="#fff" />
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: "var(--lk-text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          Mode Tampilan
        </p>
        <p
          style={{
            fontSize: "0.72rem",
            color: "var(--lk-text-muted)",
            marginTop: "0.05rem",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          Terang atau gelap sesuai selera
        </p>
      </div>

      {/* Toggle */}
      <div
        role="group"
        aria-label="Mode tampilan"
        onClick={() => applyTheme(isDark ? "light" : "dark")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 2,
          padding: 3,
          borderRadius: 9999,
          border: "1px solid var(--lk-border)",
          background: "var(--lk-bg)",
          flexShrink: 0,
          cursor: "pointer",
        }}
      >
        <button
          type="button"
          className="theme-knob"
          aria-label={isLight ? "Beralih ke mode gelap" : "Mode terang"}
          aria-pressed={isLight}
          onClick={(e) => {
            e.stopPropagation();
            applyTheme(isLight ? "dark" : "light");
          }}
          style={knobStyle(isLight)}
        >
          <Sun size={14} />
        </button>
        <button
          type="button"
          className="theme-knob"
          aria-label={isDark ? "Beralih ke mode terang" : "Mode gelap"}
          aria-pressed={isDark}
          onClick={(e) => {
            e.stopPropagation();
            applyTheme(isDark ? "light" : "dark");
          }}
          style={knobStyle(isDark)}
        >
          <Moon size={14} />
        </button>
      </div>
    </div>
  );
}