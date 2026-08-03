"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import ExpenseChart from "./expense-chart";

const DynamicExpenseChart = dynamic(() => import("./expense-chart"), {
  ssr: false,
  loading: () => <div className="h-[220px] sm:h-[300px] w-full bg-slate-100/50 dark:bg-slate-900/20 rounded-full animate-pulse mx-auto max-w-[220px] sm:max-w-[300px]" />
});

export default function DynamicExpenseChartWrapper(props: ComponentProps<typeof ExpenseChart>) {
  return <DynamicExpenseChart {...props} />;
}
