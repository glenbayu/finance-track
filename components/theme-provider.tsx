"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
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
  const [theme, setTheme] = useState<Theme>(() => getThemeFromDocument());

  useEffect(() => {
    if (!isClient) return;

    const isDark = theme === "dark";
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    window.localStorage.setItem("theme", theme);
  }, [theme, isClient]);

  return (
    <>
      {children}

      {isClient ? (
        <button
          type="button"
          onClick={() =>
            setTheme((prev) => (prev === "light" ? "dark" : "light"))
          }
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
