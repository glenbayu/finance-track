"use client";

import { useId, type ReactNode } from "react";

type FormSelectOption = { value: string; label: string; disabled?: boolean };
type FormSelectProps = {
  name: string;
  id?: string;
  label?: string;
  value?: string;
  defaultValue?: string;
  options: FormSelectOption[];
  onValueChange?: (nextValue: string) => void;
  required?: boolean;
  placeholder?: string;
  icon?: ReactNode;
  disabled?: boolean;
};

const fieldLabels: Record<string, string> = {
  type: "Jenis", category_id: "Kategori", wallet_id: "Dompet",
  destination_wallet_id: "Dompet tujuan", target_id: "Kategori tujuan",
  target_category_id: "Kategori tujuan", source_id: "Dompet asal",
  icon: "Ikon", color: "Warna", sort: "Urutan", currency: "Mata uang",
};

/** Native keyboard, touch, validation and form-reset behavior on every viewport. */
export default function FormSelect({ name, id, label, value, defaultValue, options, onValueChange, required, placeholder, disabled }: FormSelectProps) {
  const generatedId = useId();
  return (
    <select id={id ?? generatedId} name={name} value={value} defaultValue={value === undefined ? defaultValue : undefined}
      onChange={(event) => onValueChange?.(event.currentTarget.value)}
      className="input-base w-full min-w-0" required={required} disabled={disabled}
      aria-label={label ?? fieldLabels[name] ?? placeholder ?? name.replaceAll("_", " ")}>
      {placeholder && !options.some((option) => option.value === "") && <option value="" disabled>{placeholder}</option>}
      {options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
    </select>
  );
}
