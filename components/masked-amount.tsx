"use client";

import { Eye, EyeOff } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

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
  const [isHidden, setIsHidden] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      setIsHidden(stored === "1");
    } catch {
      setIsHidden(false);
    }
    setHasLoaded(true);
  }, [storageKey]);

  useEffect(() => {
    if (!hasLoaded) return;
    try {
      window.localStorage.setItem(storageKey, isHidden ? "1" : "0");
    } catch {}
  }, [hasLoaded, isHidden, storageKey]);

  const value = useMemo<MaskedAmountContextValue>(
    () => ({
      isHidden,
      toggle: () => setIsHidden((prev) => !prev),
    }),
    [isHidden],
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
