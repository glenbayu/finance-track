"use client";

import { Eye, EyeOff } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useSyncExternalStore } from "react";

type MaskedAmountContextValue = {
  isHidden: boolean;
  toggle: () => void;
};

const MaskedAmountContext = createContext<MaskedAmountContextValue | null>(null);

export function useMaskedAmounts() {
  return useContext(MaskedAmountContext);
}

type MaskedAmountProviderProps = {
  children: React.ReactNode;
  storageKey?: string;
};

export function MaskedAmountProvider({
  children,
  storageKey = "ft_hide_amounts",
}: MaskedAmountProviderProps) {
  const subscribe = useCallback((callback: () => void) => {
    if (typeof window === "undefined") return () => {};

    const handler = () => callback();
    window.addEventListener("storage", handler);
    window.addEventListener("ft_masked_amounts", handler);

    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("ft_masked_amounts", handler);
    };
  }, []);

  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(storageKey) === "1";
    } catch {
      return false;
    }
  }, [storageKey]);

  const isHidden = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const toggle = useCallback(() => {
    const nextHidden = !getSnapshot();
    try {
      window.localStorage.setItem(storageKey, nextHidden ? "1" : "0");
    } catch {}
    window.dispatchEvent(new Event("ft_masked_amounts"));
  }, [getSnapshot, storageKey]);

  const value = useMemo<MaskedAmountContextValue>(
    () => ({
      isHidden,
      toggle,
    }),
    [isHidden, toggle],
  );

  return (
    <MaskedAmountContext.Provider value={value}>
      {children}
    </MaskedAmountContext.Provider>
  );
}

type MaskedAmountProps = {
  value: string;
  maskedText?: string;
  valueClassName?: string;
  buttonClassName?: string;
  showToggle?: boolean;
  showLabel?: string;
  hideLabel?: string;
  showTitle?: string;
  hideTitle?: string;
};

export default function MaskedAmount({
  value,
  maskedText = "***",
  valueClassName = "",
  buttonClassName = "btn-secondary h-9 w-9 px-0",
  showToggle = true,
  showLabel = "Tampilkan nominal",
  hideLabel = "Sembunyikan nominal",
  showTitle = "Tampilkan",
  hideTitle = "Sembunyikan",
}: MaskedAmountProps) {
  const context = useMaskedAmounts();
  const isHidden = context?.isHidden ?? false;
  const toggleHidden = context?.toggle;

  return (
    <div className={showToggle ? "flex items-center justify-between gap-3" : undefined}>
      <p className={valueClassName}>{isHidden ? maskedText : value}</p>
      {showToggle ? (
        <button
          type="button"
          onClick={toggleHidden}
          className={buttonClassName}
          aria-label={isHidden ? showLabel : hideLabel}
          title={isHidden ? showTitle : hideTitle}
          disabled={!toggleHidden}
        >
          {isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      ) : null}
    </div>
  );
}
