"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

type ThemeToggleButtonProps = {
  className?: string;
  showLabel?: boolean;
  fixed?: boolean;
};

const THEME_KEY = "theme";
const THEME_EVENT = "finance-theme-change";

function normalizeTheme(value: string | null): Theme {
  return value === "dark" ? "dark" : "light";
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
}: ThemeToggleButtonProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    return normalizeTheme(window.localStorage.getItem(THEME_KEY));
  });

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== THEME_KEY) return;
      setTheme(normalizeTheme(event.newValue));
    };
    const onThemeEvent = (event: Event) => {
      const custom = event as CustomEvent<{ theme: Theme }>;
      const nextTheme = normalizeTheme(custom.detail?.theme ?? null);
      setTheme(nextTheme);
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(THEME_EVENT, onThemeEvent as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(THEME_EVENT, onThemeEvent as EventListener);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "light" ? "dark" : "light";
    const root = document.documentElement;
    root.classList.add("theme-transition");
    applyTheme(nextTheme);
    setTheme(nextTheme);

    window.setTimeout(() => {
      root.classList.remove("theme-transition");
    }, 320);
  };

  const label = theme === "dark" ? "Dark" : "Light";

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
      {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
      {showLabel ? <span>{label}</span> : <span className="sr-only">{label}</span>}
    </button>
  );
}
