"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import {
  convertFromIDR,
  CurrencyCode,
  formatCurrency,
  SUPPORTED_CURRENCIES,
  normalizeCurrencyCode,
} from "@/lib/currency";
import { getRateFromIDRToCurrency } from "@/lib/exchange-rates";

const STORAGE_KEY = "finance-track-display-currency";
const CURRENCY_EVENT = "ft_display_currency";
const RATE_EVENT = "ft_exchange_rates";

type RateSnapshot = {
  rateFromIDR: number;
  lastUpdated: string | null;
  isRateLoading: boolean;
  isFallbackToIDR: boolean;
};

const IDR_RATE_SNAPSHOT: RateSnapshot = {
  rateFromIDR: 1,
  lastUpdated: null,
  isRateLoading: false,
  isFallbackToIDR: false,
};

const DEFAULT_NON_IDR_RATE_SNAPSHOT: RateSnapshot = {
  rateFromIDR: 1,
  lastUpdated: null,
  isRateLoading: false,
  isFallbackToIDR: false,
};

const rateSnapshots = new Map<CurrencyCode, RateSnapshot>();
SUPPORTED_CURRENCIES.forEach((currency) => {
  rateSnapshots.set(
    currency,
    currency === "IDR"
      ? IDR_RATE_SNAPSHOT
      : { ...DEFAULT_NON_IDR_RATE_SNAPSHOT },
  );
});

const pendingRequests = new Map<CurrencyCode, Promise<void>>();

function dispatchEventSafe(eventName: string) {
  try {
    window.dispatchEvent(new Event(eventName));
  } catch {}
}

function getStoredCurrency() {
  try {
    return normalizeCurrencyCode(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return "IDR";
  }
}

function getRateSnapshot(currency: CurrencyCode): RateSnapshot {
  return rateSnapshots.get(currency) ?? IDR_RATE_SNAPSHOT;
}

async function ensureRate(currency: CurrencyCode) {
  if (currency === "IDR") return;

  if (pendingRequests.has(currency)) {
    return pendingRequests.get(currency);
  }

  const current = getRateSnapshot(currency);
  if (current.isRateLoading) return;

  rateSnapshots.set(currency, {
    ...current,
    isRateLoading: true,
  });
  dispatchEventSafe(RATE_EVENT);

  const task = getRateFromIDRToCurrency(currency)
    .then((result) => {
      rateSnapshots.set(currency, {
        rateFromIDR: result.rate,
        lastUpdated: result.lastUpdated,
        isRateLoading: false,
        isFallbackToIDR: result.fallbackToIDR,
      });
    })
    .catch(() => {
      rateSnapshots.set(currency, {
        rateFromIDR: 1,
        lastUpdated: null,
        isRateLoading: false,
        isFallbackToIDR: true,
      });
    })
    .finally(() => {
      pendingRequests.delete(currency);
      dispatchEventSafe(RATE_EVENT);
    });

  pendingRequests.set(currency, task);
  return task;
}

export function setDisplayCurrencyPreference(nextCurrency: CurrencyCode) {
  try {
    window.localStorage.setItem(STORAGE_KEY, nextCurrency);
  } catch {}
  dispatchEventSafe(CURRENCY_EVENT);
}

export function useDisplayCurrency() {
  const subscribe = useCallback((callback: () => void) => {
    if (typeof window === "undefined") return () => {};

    const handler = () => callback();
    window.addEventListener("storage", handler);
    window.addEventListener(CURRENCY_EVENT, handler);
    window.addEventListener(RATE_EVENT, handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener(CURRENCY_EVENT, handler);
      window.removeEventListener(RATE_EVENT, handler);
    };
  }, []);

  const currency = useSyncExternalStore<CurrencyCode>(
    subscribe,
    () => getStoredCurrency(),
    () => "IDR",
  );

  const rateState = useSyncExternalStore<RateSnapshot>(
    subscribe,
    () => getRateSnapshot(currency),
    () => IDR_RATE_SNAPSHOT,
  );

  useEffect(() => {
    void ensureRate(currency);
  }, [currency]);

  const effectiveCurrency: CurrencyCode =
    currency === "IDR" || rateState.isFallbackToIDR ? "IDR" : currency;
  const effectiveRate =
    effectiveCurrency === "IDR" ? 1 : rateState.rateFromIDR;

  const formatFromIDR = useCallback(
    (amountIDR: number) => {
      const converted = convertFromIDR(
        amountIDR,
        effectiveCurrency,
        effectiveRate,
      );
      return formatCurrency(converted, effectiveCurrency);
    },
    [effectiveCurrency, effectiveRate],
  );

  return useMemo(
    () => ({
      currency,
      effectiveCurrency,
      rateFromIDR: effectiveRate,
      isRateLoading: currency === "IDR" ? false : rateState.isRateLoading,
      lastUpdated: rateState.lastUpdated,
      isFallbackToIDR: rateState.isFallbackToIDR,
      setCurrency: setDisplayCurrencyPreference,
      formatFromIDR,
    }),
    [currency, effectiveCurrency, effectiveRate, rateState, formatFromIDR],
  );
}
