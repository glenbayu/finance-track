"use client";

import { Eye, EyeOff, Moon, Sun } from "lucide-react";
import { useSyncExternalStore } from "react";
import { useAmountPrivacy } from "@/hooks/use-amount-privacy";

type Theme = "light" | "dark";
const THEME_KEY = "theme";
const THEME_EVENT = "finance-theme-change";

function subscribeTheme(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(THEME_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(THEME_EVENT, cb);
  };
}
function getThemeSnapshot(): Theme {
  if (typeof window === "undefined") return "light";
  return window.localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const isDark = theme === "dark";
  document.documentElement.classList.toggle("dark", isDark);
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  window.localStorage.setItem(THEME_KEY, theme);
  window.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { theme } }));
}

type AppearanceCardProps = {
  flat?: boolean;
};

export default function AppearanceCard({ flat = false }: AppearanceCardProps) {
  const { isHiddenByDefault, toggleHiddenByDefault } = useAmountPrivacy();
  const theme = useSyncExternalStore(subscribeTheme, getThemeSnapshot, () => "light" as Theme);
  const isDark = theme === "dark";

  const toggleTheme = () => {
    const next: Theme = isDark ? "light" : "dark";
    const root = document.documentElement;
    root.classList.add("theme-transition");
    applyTheme(next);
    window.setTimeout(() => root.classList.remove("theme-transition"), 320);
  };

  const content = (
    <div
      className={`divide-y ${flat ? "" : "overflow-hidden rounded-lg shadow-sm"}`}
      style={
        !flat
          ? { backgroundColor: "var(--lk-surface)", border: "1px solid var(--lk-border-strong)" }
          : { borderColor: "var(--lk-border)" }
      }
    >
      {/* Theme Toggle */}
      <div
        className="settings-preference-row flex items-center justify-between gap-4 p-4"
        style={{ borderBottom: "1px solid var(--lk-border)" }}
      >
        <div>
          <p className="text-[15px] font-medium" style={{ color: "var(--lk-text)" }}>
            Tema tampilan
          </p>
          <p className="text-xs" style={{ color: "var(--lk-text-muted)" }}>
            Atur tampilan antarmuka.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          aria-pressed={isDark}
          className="shrink-0 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-80"
          style={{
            backgroundColor: isDark ? "var(--lk-primary-dim)" : "var(--lk-bg)",
            color: isDark ? "var(--lk-primary-light)" : "var(--lk-text)",
            border: isDark ? "none" : "1px solid var(--lk-border)",
          }}
        >
          {isDark ? <Moon size={14} /> : <Sun size={14} />}
          {isDark ? "Gelap" : "Terang"}
        </button>
      </div>

      {/* Privacy Toggle */}
      <div
        className="settings-preference-row flex items-center justify-between gap-4 p-4"
        style={{ borderBottom: "1px solid var(--lk-border)" }}
      >
        <div className="min-w-0">
          <p className="text-[15px] font-medium" style={{ color: "var(--lk-text)" }}>
            Sembunyikan Nominal
          </p>
          <p className="text-xs" style={{ color: "var(--lk-text-muted)" }}>
            Nominal dan grafik disamarkan. Nilai dalam formulir tetap terlihat saat diedit.
          </p>
        </div>
        <button
          type="button"
          onClick={toggleHiddenByDefault}
          className="shrink-0 flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-80"
          style={{
            backgroundColor: isHiddenByDefault ? "var(--lk-income-dim)" : "var(--lk-bg)",
            color: isHiddenByDefault ? "var(--lk-income)" : "var(--lk-text)",
            border: isHiddenByDefault ? "none" : "1px solid var(--lk-border)",
          }}
          aria-pressed={isHiddenByDefault}
        >
          {isHiddenByDefault ? <EyeOff size={14} /> : <Eye size={14} />}
          {isHiddenByDefault ? "Aktif" : "Nonaktif"}
        </button>
      </div>
    </div>
  );

  if (flat) return content;

  return (
    <section>
      <h3
        className="mb-2 px-4 text-[13px] font-semibold tracking-wider uppercase"
        style={{ color: "var(--lk-text-muted)" }}
      >
        Tampilan
      </h3>
      {content}
    </section>
  );
}

