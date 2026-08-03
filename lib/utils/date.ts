export const APP_TIME_ZONE = "Asia/Jakarta";

export function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function getDatePartsInTimeZone(date: Date, timeZone = APP_TIME_ZONE) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const year = Number(parts.find((part) => part.type === "year")?.value ?? "0");
  const month = Number(parts.find((part) => part.type === "month")?.value ?? "0");
  const day = Number(parts.find((part) => part.type === "day")?.value ?? "0");

  return { year, month, day };
}

export function isMonthValue(value: string) {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(value);
}

export function isDateValue(value: string) {
  if (!/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return false;
  const date = new Date(Date.UTC(y, m - 1, d));
  return (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m - 1 &&
    date.getUTCDate() === d
  );
}

export function getCurrentMonth() {
  const now = new Date();
  const { year, month } = getDatePartsInTimeZone(now);
  return `${year}-${pad2(month)}`;
}

export function getCurrentDate() {
  const now = new Date();
  const { year, month, day } = getDatePartsInTimeZone(now);
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

export function getMonthRange(month: string) {
  if (!isMonthValue(month)) {
    return getMonthRange(getCurrentMonth());
  }

  const [year, monthNum] = month.split("-").map(Number);
  const nextYear = monthNum === 12 ? year + 1 : year;
  const nextMonth = monthNum === 12 ? 1 : monthNum + 1;

  return {
    start: `${year}-${pad2(monthNum)}-01`,
    end: `${nextYear}-${pad2(nextMonth)}-01`,
  };
}

export function getPreviousMonth(month: string) {
  if (!isMonthValue(month)) {
    return getCurrentMonth();
  }

  const [year, monthNum] = month.split("-").map(Number);
  const prevYear = monthNum === 1 ? year - 1 : year;
  const prevMonth = monthNum === 1 ? 12 : monthNum - 1;
  return `${prevYear}-${pad2(prevMonth)}`;
}

export function getRecentMonths(count: number, fromMonth = getCurrentMonth()) {
  if (!Number.isFinite(count) || count <= 0) return [];

  const safeFromMonth = isMonthValue(fromMonth) ? fromMonth : getCurrentMonth();
  const [year, month] = safeFromMonth.split("-").map(Number);
  const anchor = new Date(Date.UTC(year, month - 1, 1));
  const months: string[] = [];

  for (let offset = count - 1; offset >= 0; offset -= 1) {
    const current = new Date(Date.UTC(anchor.getUTCFullYear(), anchor.getUTCMonth() - offset, 1));
    months.push(`${current.getUTCFullYear()}-${pad2(current.getUTCMonth() + 1)}`);
  }

  return months;
}
