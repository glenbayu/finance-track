"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import {
  AMOUNT_PRIVACY_STORAGE_KEY,
  MASKED_AMOUNTS_EVENT,
} from "@/lib/preferences";

function parseStoredValue(value: string | null) {
  if (value === "1" || value === "true") return true;
  if (value === "0" || value === "false") return false;
  return false;
}

function writeValue(next: boolean) {
  window.localStorage.setItem(
    AMOUNT_PRIVACY_STORAGE_KEY,
    next ? "true" : "false",
  );
  window.dispatchEvent(new Event(MASKED_AMOUNTS_EVENT));
}

export function useAmountPrivacy() {
  const subscribe = useCallback((callback: () => void) => {
    if (typeof window === "undefined") return () => {};

    const handler = () => callback();
    window.addEventListener("storage", handler);
    window.addEventListener(MASKED_AMOUNTS_EVENT, handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener(MASKED_AMOUNTS_EVENT, handler);
    };
  }, []);

  const getSnapshot = useCallback(() => {
    try {
      return parseStoredValue(
        window.localStorage.getItem(AMOUNT_PRIVACY_STORAGE_KEY),
      );
    } catch {
      return false;
    }
  }, []);

  const isHiddenByDefault = useSyncExternalStore(
    subscribe,
    getSnapshot,
    () => false,
  );

  useEffect(() => {
    try {
      const currentRaw = window.localStorage.getItem(AMOUNT_PRIVACY_STORAGE_KEY);
      if (currentRaw === null) {
        window.localStorage.setItem(AMOUNT_PRIVACY_STORAGE_KEY, "false");
      }
    } catch {}
  }, []);

  const setHiddenByDefault = useCallback((next: boolean) => {
    try {
      writeValue(next);
    } catch {}
  }, []);

  const toggleHiddenByDefault = useCallback(() => {
    try {
      writeValue(!getSnapshot());
    } catch {}
  }, [getSnapshot]);

  return {
    isHiddenByDefault,
    setHiddenByDefault,
    toggleHiddenByDefault,
  };
}

