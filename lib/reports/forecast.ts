import { getCurrentMonth, isMonthValue, pad2 } from "@/lib/date";

export type ForecastConfidence = "low" | "medium-low" | "medium" | "insufficient";

export type MonthlyExpensePoint = {
  month: string;
  amount: number;
};

export type ForecastResult = {
  forecastAmount: number | null;
  monthCount: number;
  confidence: ForecastConfidence;
  method: string;
  monthsUsed: MonthlyExpensePoint[];
  reason?: string;
};

export type CategoryForecastResult = {
  category: string;
  forecastAmount: number;
  share: number;
  confidence: ForecastConfidence;
  activeMonthCount: number;
};

const WEIGHTS_3 = [0.5, 0.3, 0.2];
const WEIGHTS_4 = [0.4, 0.3, 0.2, 0.1];
const WEIGHTS_5 = [0.34, 0.26, 0.18, 0.13, 0.09];
const WEIGHTS_6 = [0.3, 0.24, 0.18, 0.12, 0.1, 0.06];

function monthToUtcDate(month: string) {
  if (!isMonthValue(month)) return new Date(Date.UTC(1970, 0, 1));
  const [year, monthNum] = month.split("-").map(Number);
  return new Date(Date.UTC(year, monthNum - 1, 1));
}

export function addMonths(month: string, step: number) {
  const date = monthToUtcDate(month);
  date.setUTCMonth(date.getUTCMonth() + step);
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`;
}

export function isCompleteMonth(month: string, referenceMonth = getCurrentMonth()) {
  if (!isMonthValue(month)) return false;
  return month < referenceMonth;
}

export function getForecastConfidence(monthCount: number): ForecastConfidence {
  if (monthCount < 2) return "insufficient";
  if (monthCount === 2) return "low";
  if (monthCount <= 5) return "medium-low";
  return "medium";
}

export function getCategoryForecastConfidence(activeMonthCount: number): ForecastConfidence {
  if (activeMonthCount <= 1) return "low";
  if (activeMonthCount === 2) return "medium-low";
  return "medium";
}

function getWeights(count: number) {
  if (count <= 0) return [];
  if (count === 1) return [1];
  if (count === 2) return [0.5, 0.5];
  if (count === 3) return WEIGHTS_3;
  if (count === 4) return WEIGHTS_4;
  if (count === 5) return WEIGHTS_5;
  return WEIGHTS_6;
}

export function calculateWeightedForecast(monthlyValues: MonthlyExpensePoint[]): ForecastResult {
  const monthCount = monthlyValues.length;

  if (monthCount < 2) {
    return {
      forecastAmount: null,
      monthCount,
      confidence: "insufficient",
      method: "Belum cukup data",
      monthsUsed: monthlyValues,
      reason: "Butuh minimal 2 bulan lengkap untuk membuat estimasi.",
    };
  }

  if (monthCount === 2) {
    const avg = (monthlyValues[0].amount + monthlyValues[1].amount) / 2;
    return {
      forecastAmount: avg,
      monthCount,
      confidence: "low",
      method: "Simple average (2 bulan)",
      monthsUsed: monthlyValues,
    };
  }

  const latestFirst = [...monthlyValues].reverse();
  const weights = getWeights(monthCount);
  const weighted = latestFirst.reduce((sum, item, index) => {
    const weight = weights[index] ?? 0;
    return sum + item.amount * weight;
  }, 0);

  return {
    forecastAmount: weighted,
    monthCount,
    confidence: getForecastConfidence(monthCount),
    method: `Weighted moving average (${monthCount} bulan)`,
    monthsUsed: monthlyValues,
  };
}

export function calculateCategoryForecast(input: {
  totalForecastAmount: number | null;
  monthsWindow: string[];
  categoryByMonth: Map<string, Map<string, number>>;
}) {
  const { totalForecastAmount, monthsWindow, categoryByMonth } = input;
  const results: CategoryForecastResult[] = [];

  categoryByMonth.forEach((monthMap, category) => {
    const monthlyValues = monthsWindow.map((month) => ({
      month,
      amount: monthMap.get(month) ?? 0,
    }));
    const activeMonthCount = monthlyValues.filter((item) => item.amount > 0).length;
    const forecast = calculateWeightedForecast(monthlyValues);
    if (forecast.forecastAmount === null || forecast.forecastAmount <= 0) return;

    results.push({
      category,
      forecastAmount: forecast.forecastAmount,
      share: 0,
      confidence: getCategoryForecastConfidence(activeMonthCount),
      activeMonthCount,
    });
  });

  const rawTotal = results.reduce((sum, item) => sum + item.forecastAmount, 0);
  const targetTotal = totalForecastAmount ?? 0;
  const scale = rawTotal > 0 && targetTotal > 0 ? targetTotal / rawTotal : 1;

  const normalized = results
    .map((item) => {
      const adjustedAmount = item.forecastAmount * scale;
      return {
        ...item,
        forecastAmount: adjustedAmount,
      };
    })
    .sort((a, b) => b.forecastAmount - a.forecastAmount);

  const sumNormalized = normalized.reduce((sum, item) => sum + item.forecastAmount, 0);

  return normalized.map((item) => ({
    ...item,
    share: sumNormalized > 0 ? item.forecastAmount / sumNormalized : 0,
  }));
}

export function getCompleteMonthWindow(referenceMonth: string, requestedCount = 6) {
  const safeReference = isMonthValue(referenceMonth) ? referenceMonth : getCurrentMonth();
  const months: string[] = [];
  for (let i = requestedCount; i >= 1; i -= 1) {
    months.push(addMonths(safeReference, -i));
  }
  return months;
}
