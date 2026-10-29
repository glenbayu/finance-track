import { getCurrentDate, isDateValue } from "@/lib/utils/date";

/**
 * Returns the current business date when no date is supplied.
 * Invalid non-empty dates are rejected instead of silently becoming today.
 */
export function normalizeTransactionDate(value?: string): string | null {
  const raw = String(value ?? "").trim();
  if (!raw) return getCurrentDate();
  return isDateValue(raw) ? raw : null;
}
