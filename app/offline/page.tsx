"use client";

import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  const handleRefresh = () => {
    window.location.href = "/";
  };

  return (
    <div className="flex min-h-screen min-h-svh min-h-dvh flex-col items-center justify-center p-4 text-center">
      <div className="section-card max-w-sm flex flex-col items-center p-6 sm:p-8">
        <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/30 dark:text-[#f87171]">
          <WifiOff size={28} />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Koneksi Terputus
        </h1>

        <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Sepertinya perangkat Anda sedang offline. Periksa kembali koneksi internet Anda agar data keuangan Anda dapat disinkronkan dengan database cloud.
        </p>

        <div className="mt-4 soft-inset w-full text-xs text-slate-600 dark:text-slate-400 font-medium">
          Data offline Anda aman di memori lokal.
        </div>

        <button
          type="button"
          onClick={handleRefresh}
          className="btn-primary mt-6 w-full gap-2 px-5 py-3 text-sm font-semibold"
        >
          <RefreshCw size={14} className="animate-spin-hover" />
          Hubungkan Kembali
        </button>
      </div>
    </div>
  );
}
