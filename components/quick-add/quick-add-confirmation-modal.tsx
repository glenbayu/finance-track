"use client";

import Link from "next/link";
import { useMemo } from "react";
import ConfirmationModal from "@/components/ui/confirmation-modal";
import CurrencyAmount from "@/components/ui/currency-amount";
import TemplateIcon from "@/components/quick-add/template-icon";
import { formatTemplateTypeLabel, type QuickAddTemplate } from "@/lib/quick-add";
import { CalendarDays } from "lucide-react";

type QuickAddConfirmationModalProps = {
  isOpen: boolean;
  template: QuickAddTemplate | null;
  dateValue: string;
  onDateChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting?: boolean;
};

export default function QuickAddConfirmationModal({
  isOpen,
  template,
  dateValue,
  onDateChange,
  onClose,
  onConfirm,
  isSubmitting = false,
}: QuickAddConfirmationModalProps) {
  const editHref = useMemo(() => {
    if (!template) return "/transactions/new";
    return `/transactions/new?templateId=${encodeURIComponent(template.id)}`;
  }, [template]);

  if (!template) return null;

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      title="Konfirmasi Quick Add"
      description="Cek detail transaksi dari template sebelum ditambahkan."
      icon={
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[color:var(--surface-soft)] text-slate-700 dark:text-slate-200">
          <CalendarDays size={20} />
        </span>
      }
    >
      <div className="space-y-3">
        <div className="soft-inset">
          <div className="flex items-start gap-2.5">
            <TemplateIcon icon={template.icon} color={template.color} />
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-slate-900 dark:text-slate-100">
                {template.name}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {formatTemplateTypeLabel(template.type)} - {template.category_name ?? "Tanpa kategori"}
              </p>
            </div>
          </div>
          <div className="mt-3 space-y-1 text-sm">
            <p className={template.type === "income" ? "text-emerald-600" : "text-rose-600"}>
              <span className="font-medium">Nominal: </span>
              {template.amount ? <CurrencyAmount amountIDR={template.amount} /> : "Belum diisi"}
            </p>
            <p className="text-slate-600 dark:text-slate-300">
              <span className="font-medium">Catatan: </span>
              {template.note || "Tidak ada catatan"}
            </p>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
            Tanggal transaksi
          </label>
          <input
            type="date"
            value={dateValue}
            onChange={(event) => onDateChange(event.currentTarget.value)}
            className="input-base"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Nominal template disimpan sebagai Rupiah (IDR).
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onClose} className="btn-secondary h-10 px-4">
          Batal
        </button>
        <Link href={editHref} className="btn-secondary h-10 px-4" onClick={onClose}>
          Edit dulu
        </Link>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="btn-primary h-10 px-4 disabled:opacity-60"
        >
          {isSubmitting ? "Menambahkan..." : "Tambah Transaksi"}
        </button>
      </div>
    </ConfirmationModal>
  );
}
