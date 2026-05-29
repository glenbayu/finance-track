"use client";

import { convertFromIDR, getCurrencySymbol } from "@/lib/currency";
import { useDisplayCurrency } from "@/hooks/use-display-currency";

type CurrencyAmountProps = {
  amountIDR: number;
  className?: string;
  sign?: "" | "+" | "-";
  absolute?: boolean;
  compact?: boolean;
};

export default function CurrencyAmount({
  amountIDR,
  className = "",
  sign = "",
  absolute = false,
  compact = false,
}: CurrencyAmountProps) {
  const { formatFromIDR, effectiveCurrency, rateFromIDR } = useDisplayCurrency();
  const safeAmount = Number.isFinite(amountIDR) ? amountIDR : 0;
  const displayAmount = absolute ? Math.abs(safeAmount) : safeAmount;
  const fullText = formatFromIDR(displayAmount);

  if (compact) {
    const converted = convertFromIDR(displayAmount, effectiveCurrency, rateFromIDR);
    const compactNumber = new Intl.NumberFormat("id-ID", {
      notation: "compact",
      compactDisplay: "short",
      maximumFractionDigits: 1,
    })
      .format(converted)
      .replace(/\s+/g, "");
    const symbol = getCurrencySymbol(effectiveCurrency);

    return (
      <span className={className} title={fullText}>
        {sign}
        {symbol}
        {compactNumber}
      </span>
    );
  }

  return (
    <span className={className}>
      {sign}
      {fullText}
    </span>
  );
}
