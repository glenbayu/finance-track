export type CurrencyCode =
  | "IDR"
  | "USD"
  | "JPY"
  | "EUR"
  | "SGD"
  | "AUD"
  | "MYR";

export const SUPPORTED_CURRENCIES: CurrencyCode[] = [
  "IDR",
  "USD",
  "JPY",
  "EUR",
  "SGD",
  "AUD",
  "MYR",
];

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  IDR: "Rp",
  USD: "$",
  JPY: "¥",
  EUR: "€",
  SGD: "S$",
  AUD: "A$",
  MYR: "RM",
};

function isSupportedCurrency(value: string): value is CurrencyCode {
  return (SUPPORTED_CURRENCIES as string[]).includes(value);
}

export function normalizeCurrencyCode(value: unknown): CurrencyCode {
  if (typeof value !== "string") return "IDR";
  const upper = value.toUpperCase();
  return isSupportedCurrency(upper) ? upper : "IDR";
}

export function getCurrencySymbol(currency: CurrencyCode) {
  return CURRENCY_SYMBOLS[currency];
}

export function formatCurrency(amount: number, currency: CurrencyCode) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "IDR" || currency === "JPY" ? 0 : 2,
  }).format(amount);
}

export function convertFromIDR(
  amountIDR: number,
  targetCurrency: CurrencyCode,
  rateFromIDRToTarget: number,
) {
  if (targetCurrency === "IDR") return amountIDR;
  return amountIDR * rateFromIDRToTarget;
}

