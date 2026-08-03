"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import ReportsCharts from "./reports-charts";

const DynamicReportsCharts = dynamic(() => import("./reports-charts"), {
  ssr: false,
  loading: () => (
    <>
      <div className="section-card h-[380px] animate-pulse lg:col-span-7 bg-slate-100/50 dark:bg-slate-900/20" />
      <div className="section-card h-[380px] animate-pulse lg:col-span-5 bg-slate-100/50 dark:bg-slate-900/20" />
      <div className="section-card h-[340px] animate-pulse lg:col-span-7 bg-slate-100/50 dark:bg-slate-900/20" />
      <div className="section-card h-[340px] animate-pulse lg:col-span-5 bg-slate-100/50 dark:bg-slate-900/20" />
    </>
  )
});

export default function DynamicReportsChartsWrapper(props: ComponentProps<typeof ReportsCharts>) {
  return <DynamicReportsCharts {...props} />;
}
