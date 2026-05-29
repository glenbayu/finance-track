"use client";

import { useEffect } from "react";
import { CheckCircle2 } from "lucide-react";

type QuickAddToastProps = {
  isOpen: boolean;
  message: string;
  undoLabel?: string;
  onUndo?: () => void;
  onClose: () => void;
  autoCloseMs?: number;
  isUndoPending?: boolean;
};

export default function QuickAddToast({
  isOpen,
  message,
  undoLabel = "Undo",
  onUndo,
  onClose,
  autoCloseMs = 6500,
  isUndoPending = false,
}: QuickAddToastProps) {
  useEffect(() => {
    if (!isOpen) return;
    const timer = window.setTimeout(onClose, autoCloseMs);
    return () => window.clearTimeout(timer);
  }, [isOpen, onClose, autoCloseMs]);

  if (!isOpen) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[120] flex justify-center px-4 lg:bottom-6">
      <div className="pointer-events-auto w-full max-w-md rounded-2xl border border-[color:var(--stroke)] bg-[color:var(--surface)]/96 p-3 shadow-[0_20px_42px_-24px_rgba(20,20,20,0.5)] backdrop-blur">
        <div className="flex items-start gap-2.5">
          <span className="mt-0.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950/45 dark:text-emerald-300">
            <CheckCircle2 size={16} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{message}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Kamu bisa batalkan aksi ini dalam beberapa detik.
            </p>
          </div>
          {onUndo ? (
            <button
              type="button"
              onClick={onUndo}
              disabled={isUndoPending}
              className="btn-secondary h-9 px-3 text-xs disabled:opacity-60"
            >
              {isUndoPending ? "Undo..." : undoLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
