"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

function getThemeFromDocument(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  const transitionTimeoutRef = useRef<number | null>(null);
  const [theme, setTheme] = useState<Theme>(() => getThemeFromDocument());

  useEffect(() => {
    if (!isClient) return;

    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    window.localStorage.setItem("theme", theme);
  }, [theme, isClient]);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
      }
    };
  }, []);

  const handleThemeToggle = () => {
    if (!isClient) return;

    const root = document.documentElement;
    root.classList.add("theme-transition");

    if (transitionTimeoutRef.current) {
      window.clearTimeout(transitionTimeoutRef.current);
    }

    setTheme((prev) => (prev === "light" ? "dark" : "light"));

    transitionTimeoutRef.current = window.setTimeout(() => {
      root.classList.remove("theme-transition");
      transitionTimeoutRef.current = null;
    }, 320);
  };

  return (
    <>
      {children}

      {isClient ? (
        <button
          type="button"
          onClick={handleThemeToggle}
          className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 text-sm shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
          aria-label="Toggle theme"
        >
          {theme === "light" ? <Moon size={14} /> : <Sun size={14} />}
          <span>{theme === "light" ? "Dark" : "Light"}</span>
        </button>
      ) : null}
    </>
  );
}
