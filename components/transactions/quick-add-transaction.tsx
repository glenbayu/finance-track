"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import FormSelect from "@/components/ui/form-select";
import SubmitButton from "@/components/ui/submit-button";
import InteractiveDotPanel from "@/components/ui/interactive-dot-panel";
import QuickAddTemplateCard from "@/components/quick-add/quick-add-template-card";
import QuickAddConfirmationModal from "@/components/quick-add/quick-add-confirmation-modal";
import QuickAddToast from "@/components/quick-add/quick-add-toast";
import { ChevronDown } from "lucide-react";
import type { QuickAddTemplate } from "@/lib/quick-add";
import { isDateValue } from "@/lib/date";

type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
};

type QuickAddTransactionProps = {
  categories: Category[];
  action: (formData: FormData) => void | Promise<void>;
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

function formatRupiahInput(value: string) {
  const numeric = value.replace(/\D/g, "");

  if (!numeric) return "";

  return new Intl.NumberFormat("id-ID").format(Number(numeric));
}

export default function QuickAddTransaction({
  categories,
  action,
  templates = [],
  today,
  createFromTemplateAction,
  undoFromTemplateAction,
}: QuickAddTransactionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [type, setType] = useState<"income" | "expense">("expense");
  const [categoryId, setCategoryId] = useState("");
  const [amountDisplay, setAmountDisplay] = useState("");
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

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => category.type === type);
  }, [categories, type]);
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
      <button
        type="button"
        onClick={() => setIsExpanded((current) => !current)}
        aria-expanded={isExpanded}
        className="flex w-full items-center justify-between gap-3 text-left"
      >
        <div>
          <h2 className="text-xl font-semibold">Quick Add</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Catat transaksi cepat tanpa buka form lengkap.
          </p>
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-500 dark:text-slate-400 transition-transform ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>
      <div className="mt-4 border-t border-[color:var(--stroke)] pt-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Template Cepat</p>
        </div>

        {templates.length === 0 ? (
          <div className="soft-inset">
            <p className="text-sm text-slate-600 dark:text-slate-300">Belum ada template aktif.</p>
            <Link href="/settings/templates" className="mt-2 inline-flex text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              + Add template
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
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{feedbackMessage}</p>
        ) : null}
      </div>

      {isExpanded ? (
        <form action={action} className="mt-4 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium">Tipe</label>
            <FormSelect
              name="type"
              value={type}
              onValueChange={(nextValue) => {
                setType(nextValue as "income" | "expense");
                setCategoryId("");
              }}
              options={[
                { value: "expense", label: "Pengeluaran" },
                { value: "income", label: "Pemasukan" },
              ]}
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Jumlah</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Contoh: 50.000"
              value={amountDisplay}
              onChange={(e) => {
                const raw = e.target.value.replace(/\D/g, "");
                setAmountDisplay(formatRupiahInput(raw));
              }}
              className="input-base"
              required
            />
            <input
              type="hidden"
              name="amount"
              value={amountDisplay.replace(/\D/g, "")}
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">Kategori</label>
            <FormSelect
              name="category_id"
              value={categoryId}
              onValueChange={setCategoryId}
              options={[
                { value: "", label: "Pilih kategori", disabled: true },
                ...filteredCategories.map((category) => ({
                  value: category.id,
                  label: category.name,
                })),
              ]}
              required
              placeholder="Pilih kategori"
            />
          </div>

          <SubmitButton
            className="btn-primary w-full py-3 text-base"
            pendingText="Menyimpan..."
          >
            Simpan Cepat
          </SubmitButton>
        </form>
      ) : null}

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
