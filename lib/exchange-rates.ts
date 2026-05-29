import { CurrencyCode, SUPPORTED_CURRENCIES } from "@/lib/currency";

type RateResult = {
  rate: number;
  lastUpdated: string | null;
  source: string;
  fallbackToIDR: boolean;
};

type FrankfurterResponse = {
  base?: string;
  date?: string;
  rates?: Record<string, number>;
};

const CACHE_TTL_MS = 30 * 60 * 1000;
const API_ENDPOINT = "https://api.frankfurter.dev/v1/latest";
const API_SOURCE = "frankfurter.dev";

let cachedAt = 0;
let cachedLastUpdated: string | null = null;
let cachedRates: Record<CurrencyCode, number> | null = null;
let pendingPromise: Promise<Record<CurrencyCode, number> | null> | null = null;

function buildFallbackRates() {
  return SUPPORTED_CURRENCIES.reduce<Record<CurrencyCode, number>>((acc, code) => {
    acc[code] = code === "IDR" ? 1 : 0;
    return acc;
  }, {} as Record<CurrencyCode, number>);
}

async function fetchRatesFromProvider() {
  const symbols = ["IDR", "USD", "JPY", "EUR", "SGD", "AUD", "MYR"].join(",");
  const url = `${API_ENDPOINT}?base=EUR&symbols=${symbols}`;
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    throw new Error(`Failed to fetch rates: ${response.status}`);
  }

  const payload = (await response.json()) as FrankfurterResponse;
  const ratesFromEUR = payload.rates ?? {};
  const idrPerEUR = Number(ratesFromEUR.IDR ?? 0);

  if (!Number.isFinite(idrPerEUR) || idrPerEUR <= 0) {
    throw new Error("Invalid IDR rate from provider.");
  }

  const nextRates = buildFallbackRates();

  SUPPORTED_CURRENCIES.forEach((currency) => {
    if (currency === "IDR") {
      nextRates[currency] = 1;
      return;
    }

    if (currency === "EUR") {
      // Cross-rate formula:
      // provider gives 1 EUR = X IDR, and 1 EUR = 1 EUR.
      // so 1 IDR in EUR = 1 / X.
      nextRates[currency] = 1 / idrPerEUR;
      return;
    }

    const targetPerEUR = Number(ratesFromEUR[currency] ?? 0);
    if (!Number.isFinite(targetPerEUR) || targetPerEUR <= 0) {
      nextRates[currency] = 0;
      return;
    }

    // Cross-rate formula:
    // provider gives 1 EUR = targetPerEUR (target currency)
    // and 1 EUR = idrPerEUR (IDR).
    // therefore 1 IDR = targetPerEUR / idrPerEUR target currency.
    nextRates[currency] = targetPerEUR / idrPerEUR;
  });

  cachedLastUpdated = payload.date ?? null;
  return nextRates;
}

async function getCachedOrFetchRates() {
  const now = Date.now();
  if (cachedRates && now - cachedAt < CACHE_TTL_MS) {
    return cachedRates;
  }

  if (pendingPromise) {
    return pendingPromise;
  }

  pendingPromise = fetchRatesFromProvider()
    .then((rates) => {
      cachedRates = rates;
      cachedAt = Date.now();
      return rates;
    })
    .catch(() => null)
    .finally(() => {
      pendingPromise = null;
    });

  return pendingPromise;
}

export async function getRateFromIDRToCurrency(
  targetCurrency: CurrencyCode,
): Promise<RateResult> {
  if (targetCurrency === "IDR") {
    return {
      rate: 1,
      lastUpdated: null,
      source: API_SOURCE,
      fallbackToIDR: false,
    };
  }

  const allRates = await getCachedOrFetchRates();
  const rate = allRates?.[targetCurrency] ?? 0;

  if (!Number.isFinite(rate) || rate <= 0) {
    return {
      rate: 1,
      lastUpdated: cachedLastUpdated,
      source: API_SOURCE,
      fallbackToIDR: true,
    };
  }

  return {
    rate,
    lastUpdated: cachedLastUpdated,
    source: API_SOURCE,
    fallbackToIDR: false,
  };
}

