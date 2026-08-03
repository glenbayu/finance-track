"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import MonthlyExpenseTrend from "./monthly-expense-trend";

const DynamicMonthlyExpenseTrend = dynamic(() => import("./monthly-expense-trend"), {
  ssr: false,
  loading: () => <div className="h-[250px] w-full md:h-[280px] bg-slate-100/50 dark:bg-slate-900/20 rounded-xl animate-pulse" />
});

export default function DynamicMonthlyExpenseTrendWrapper(props: ComponentProps<typeof MonthlyExpenseTrend>) {
  return <DynamicMonthlyExpenseTrend {...props} />;
}
