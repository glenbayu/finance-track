"use client";

import MaskedAmount from "@/components/ui/masked-amount";
import { useDisplayCurrency } from "@/hooks/use-display-currency";

type MaskedCurrencyAmountProps = {
  amountIDR: number;
  maskedText?: string;
  valueClassName?: string;
  buttonClassName?: string;
  showToggle?: boolean;
  showLabel?: string;
  hideLabel?: string;
  showTitle?: string;
  hideTitle?: string;
};

export default function MaskedCurrencyAmount({
  amountIDR,
  ...props
}: MaskedCurrencyAmountProps) {
  const { formatFromIDR } = useDisplayCurrency();
  const safeAmount = Number.isFinite(amountIDR) ? amountIDR : 0;

  return <MaskedAmount value={formatFromIDR(safeAmount)} {...props} />;
}

