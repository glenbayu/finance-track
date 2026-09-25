"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import InteractiveDotPanel from "@/components/ui/interactive-dot-panel";
import QuickAddTemplateCard from "@/components/quick-add/quick-add-template-card";
import QuickAddConfirmationModal from "@/components/quick-add/quick-add-confirmation-modal";
import QuickAddToast from "@/components/quick-add/quick-add-toast";
import type { QuickAddTemplate } from "@/lib/transactions/quick-add";
import { isDateValue } from "@/lib/utils/date";

type QuickAddTransactionProps = {
  templates?: QuickAddTemplate[];
  today: string;
  createFromTemplateAction: (input: {
    templateId: string;
    transactionDate?: string;
  }) => Promise<{
    ok: boolean;
    error?: string;
    transactionId?: string;
  }>;
  undoFromTemplateAction: (input: {
    transactionId: string;
  }) => Promise<{
    ok: boolean;
    error?: string;
  }>;
};

export default function QuickAddTransaction({
  templates = [],
  today,
  createFromTemplateAction,
  undoFromTemplateAction,
}: QuickAddTransactionProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<QuickAddTemplate | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(today);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isSubmittingTemplate, startSubmittingTemplate] = useTransition();
  const [isUndoPending, startUndo] = useTransition();
  const [toastState, setToastState] = useState<{
    open: boolean;
    transactionId: string | null;
    message: string;
  }>({
    open: false,
    transactionId: null,
    message: "Transaksi berhasil ditambahkan",
  });

  const mobileTemplates = templates.slice(0, 4);
  const desktopTemplates = templates.slice(0, 6);
  const normalizedDate = isDateValue(selectedDate) ? selectedDate : today;

  const openConfirmation = (template: QuickAddTemplate) => {
    setSelectedTemplate(template);
    setSelectedDate(today);
    setIsConfirmOpen(true);
    setFeedbackMessage("");
  };

  const handleConfirmAdd = () => {
    if (!selectedTemplate) return;
    startSubmittingTemplate(async () => {
      const result = await createFromTemplateAction({
        templateId: selectedTemplate.id,
        transactionDate: normalizedDate,
      });
      if (!result.ok || !result.transactionId) {
        setFeedbackMessage(result.error ?? "Gagal menambahkan transaksi dari template.");
        return;
      }

      setIsConfirmOpen(false);
      setSelectedTemplate(null);
      setToastState({
        open: true,
        transactionId: result.transactionId,
        message: "Transaksi berhasil ditambahkan",
      });
      setFeedbackMessage("");
    });
  };

  const handleUndo = () => {
    if (!toastState.transactionId) return;
    startUndo(async () => {
      const result = await undoFromTemplateAction({
        transactionId: toastState.transactionId as string,
      });
      if (!result.ok) {
        setFeedbackMessage(result.error ?? "Gagal membatalkan transaksi.");
        return;
      }

      setToastState((current) => ({
        ...current,
        open: false,
        transactionId: null,
      }));
      setFeedbackMessage("Transaksi terakhir berhasil dibatalkan.");
    });
  };

  return (
    <InteractiveDotPanel className="section-card">
      <div className="flex w-full items-center justify-between gap-3 text-left">
        <div>
          <h2 className="text-xl font-semibold">Tambah Cepat</h2>
          <p className="text-sm" style={{ color: "var(--lk-text-muted)" }}>
            Catat transaksi dari template yang sudah kamu siapkan.
          </p>
        </div>
      </div>
      <div className="mt-4 border-t border-[color:var(--stroke)] pt-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold" style={{ color: "var(--lk-text)" }}>Template Cepat</p>
        </div>

        {templates.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl py-6 text-center" style={{ backgroundColor: "var(--lk-bg)", border: "1px dashed var(--lk-border)" }}>
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--lk-text)" }}>Belum ada template</p>
              <p className="mt-0.5 text-xs max-w-[200px]" style={{ color: "var(--lk-text-muted)" }}>
                Buat template untuk catat transaksi rutin dengan satu ketuk.
              </p>
            </div>
            <Link
              href="/settings/templates"
              className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold transition-opacity hover:opacity-80"
              style={{ backgroundColor: "var(--lk-primary-dim)", color: "var(--lk-primary-light)" }}
            >
              + Buat Template Pertama
            </Link>
          </div>

        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:hidden">
              {mobileTemplates.map((template) => (
                <QuickAddTemplateCard
                  key={template.id}
                  template={template}
                  variant="compact"
                  className="min-w-0"
                  onSelect={openConfirmation}
                />
              ))}
            </div>
            <div className="hidden grid-cols-2 gap-2 lg:grid">
              {desktopTemplates.map((template) => (
                <QuickAddTemplateCard
                  key={template.id}
                  template={template}
                  variant="default"
                  onSelect={openConfirmation}
                />
              ))}
            </div>
          </>
        )}
        {feedbackMessage ? (
          <p role="status" className="mt-2 text-sm text-[var(--lk-text-muted)]">{feedbackMessage}</p>
        ) : null}
      </div>

      <QuickAddConfirmationModal
        isOpen={isConfirmOpen}
        template={selectedTemplate}
        dateValue={normalizedDate}
        onDateChange={setSelectedDate}
        onClose={() => {
          if (isSubmittingTemplate) return;
          setIsConfirmOpen(false);
          setSelectedTemplate(null);
        }}
        onConfirm={handleConfirmAdd}
        isSubmitting={isSubmittingTemplate}
        errorMessage={feedbackMessage}
      />

      <QuickAddToast
        isOpen={toastState.open}
        message={toastState.message}
        onUndo={toastState.transactionId ? handleUndo : undefined}
        onClose={() =>
          setToastState((current) => ({ ...current, open: false, transactionId: null }))
        }
        isUndoPending={isUndoPending}
      />
    </InteractiveDotPanel>
  );
}
