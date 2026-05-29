"use client";

import { useMemo, useState } from "react";
import FormSelect from "@/components/ui/form-select";
import SubmitButton from "@/components/ui/submit-button";
import TemplateIcon from "@/components/quick-add/template-icon";
import {
  QUICK_ADD_TEMPLATE_COLOR_OPTIONS,
  QUICK_ADD_TEMPLATE_ICON_OPTIONS,
  QUICK_ADD_TEMPLATE_NAME_MAX,
  QUICK_ADD_TEMPLATE_NOTE_MAX,
  normalizeTemplateColor,
  normalizeTemplateIcon,
  normalizeTemplateType,
  type QuickAddTemplateColor,
  type QuickAddTemplateIcon,
  type QuickAddTemplateType,
} from "@/lib/quick-add";

type CategoryOption = {
  id: string;
  name: string;
  type: "income" | "expense";
};

type QuickAddTemplateFormProps = {
  mode: "create" | "edit";
  categories: CategoryOption[];
  action: (formData: FormData) => void | Promise<void>;
  submitLabel: string;
  pendingText: string;
  initialValue?: {
    id?: string;
    name?: string;
    type?: QuickAddTemplateType;
    category_id?: string | null;
    amount?: number | null;
    note?: string | null;
    icon?: QuickAddTemplateIcon | null;
    color?: QuickAddTemplateColor | null;
    is_active?: boolean;
  };
};

function formatRupiahInput(value: string) {
  const numeric = value.replace(/\D/g, "");
  if (!numeric) return "";
  return new Intl.NumberFormat("id-ID").format(Number(numeric));
}

export default function QuickAddTemplateForm({
  mode,
  categories,
  action,
  submitLabel,
  pendingText,
  initialValue,
}: QuickAddTemplateFormProps) {
  const defaultType = normalizeTemplateType(initialValue?.type);
  const defaultCategory = initialValue?.category_id ?? "";
  const defaultIcon = normalizeTemplateIcon(initialValue?.icon);
  const defaultColor = normalizeTemplateColor(initialValue?.color);

  const [type, setType] = useState<QuickAddTemplateType>(defaultType);
  const [categoryId, setCategoryId] = useState(defaultCategory);
  const [icon, setIcon] = useState<QuickAddTemplateIcon>(defaultIcon);
  const [color, setColor] = useState<QuickAddTemplateColor>(defaultColor);
  const [amountDisplay, setAmountDisplay] = useState(
    initialValue?.amount ? formatRupiahInput(String(initialValue.amount)) : "",
  );

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.type === type),
    [categories, type],
  );

  return (
    <form action={action} className="space-y-4">
      {mode === "edit" ? (
        <input type="hidden" name="template_id" value={initialValue?.id ?? ""} />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold">Nama Template</label>
          <input
            name="name"
            defaultValue={initialValue?.name ?? ""}
            maxLength={QUICK_ADD_TEMPLATE_NAME_MAX}
            className="input-base"
            placeholder="Contoh: Bensin motor"
            required
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold">Tipe</label>
          <FormSelect
            name="type"
            value={type}
            onValueChange={(nextValue) => {
              const nextType = normalizeTemplateType(nextValue);
              setType(nextType);
              if (!categories.some((item) => item.id === categoryId && item.type === nextType)) {
                setCategoryId("");
              }
            }}
            options={[
              { value: "expense", label: "Pengeluaran" },
              { value: "income", label: "Pemasukan" },
            ]}
            required
          />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold">Kategori (opsional)</label>
          <FormSelect
            name="category_id"
            value={categoryId}
            onValueChange={setCategoryId}
            options={[
              { value: "", label: "Tanpa kategori" },
              ...filteredCategories.map((category) => ({
                value: category.id,
                label: category.name,
              })),
            ]}
            placeholder="Tanpa kategori"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold">Nominal Default (opsional)</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Contoh: 25.000"
            value={amountDisplay}
            onChange={(event) => {
              const raw = event.target.value.replace(/\D/g, "");
              setAmountDisplay(formatRupiahInput(raw));
            }}
            className="input-base"
          />
          <input type="hidden" name="amount" value={amountDisplay.replace(/\D/g, "")} />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Nominal template disimpan dalam Rupiah dan hanya digunakan untuk mengisi form transaksi.
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold">Icon</label>
          <FormSelect
            name="icon"
            value={icon}
            onValueChange={(nextValue) => setIcon(normalizeTemplateIcon(nextValue))}
            options={QUICK_ADD_TEMPLATE_ICON_OPTIONS.map((item) => ({
              value: item,
              label: item,
            }))}
            required
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold">Warna</label>
          <FormSelect
            name="color"
            value={color}
            onValueChange={(nextValue) => setColor(normalizeTemplateColor(nextValue))}
            options={QUICK_ADD_TEMPLATE_COLOR_OPTIONS.map((item) => ({
              value: item,
              label: item[0].toUpperCase() + item.slice(1),
            }))}
            required
          />
        </div>
      </div>

      <div className="soft-inset flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TemplateIcon icon={icon} color={color} />
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Preview icon</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Dipakai di dashboard dan shortcut.</p>
          </div>
        </div>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          <input
            type="checkbox"
            name="is_active"
            defaultChecked={initialValue?.is_active ?? true}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          Aktif
        </label>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold">Catatan Default (opsional)</label>
        <textarea
          name="note"
          defaultValue={initialValue?.note ?? ""}
          maxLength={QUICK_ADD_TEMPLATE_NOTE_MAX}
          rows={3}
          className="input-base textarea-base resize-none"
          placeholder="Contoh: Isi bensin pertalite"
        />
      </div>

      <SubmitButton className="btn-primary h-11 px-4" pendingText={pendingText}>
        {submitLabel}
      </SubmitButton>
    </form>
  );
}
