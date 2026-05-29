"use client";

import { useDisplayCurrency } from "@/hooks/use-display-currency";

type CurrencyAmountProps = {
  amountIDR: number;
  className?: string;
  sign?: "" | "+" | "-";
  absolute?: boolean;
};

export default function CurrencyAmount({
  amountIDR,
  className = "",
  sign = "",
  absolute = false,
}: CurrencyAmountProps) {
  const { formatFromIDR } = useDisplayCurrency();
  const safeAmount = Number.isFinite(amountIDR) ? amountIDR : 0;
  const displayAmount = absolute ? Math.abs(safeAmount) : safeAmount;

  return (
    <span className={className}>
      {sign}
      {formatFromIDR(displayAmount)}
    </span>
  );
}

