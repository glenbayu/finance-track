"use client";

import { useState } from "react";

type BudgetAmountInputProps = {
  name?: string;
  defaultValue?: number;
  required?: boolean;
  placeholder?: string;
  className?: string;
};

function formatRupiahInput(value: string) {
  const numeric = value.replace(/\D/g, "");
  if (!numeric) return "";
  return new Intl.NumberFormat("id-ID").format(Number(numeric));
}

export default function BudgetAmountInput({
  name = "amount",
  defaultValue = 0,
  required = true,
  placeholder = "Contoh: 1.000.000",
  className = "input-base",
}: BudgetAmountInputProps) {
  const [display, setDisplay] = useState(() => {
    if (!Number.isFinite(defaultValue) || defaultValue <= 0) return "";
    return formatRupiahInput(String(Math.round(defaultValue)));
  });

  return (
    <>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={(event) => setDisplay(formatRupiahInput(event.currentTarget.value))}
        placeholder={placeholder}
        className={className}
        required={required}
      />
      <input type="hidden" name={name} value={display.replace(/\D/g, "")} />
    </>
  );
}
