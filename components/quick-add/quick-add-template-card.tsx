"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import CurrencyAmount from "@/components/ui/currency-amount";
import TemplateIcon from "@/components/quick-add/template-icon";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { formatTemplateTypeLabel, type QuickAddTemplate } from "@/lib/quick-add";

type QuickAddTemplateCardProps = {
  template: QuickAddTemplate;
  variant?: "compact" | "default" | "detail";
  onSelect?: (template: QuickAddTemplate) => void;
  className?: string;
};

export default function QuickAddTemplateCard({
  template,
  variant = "default",
  onSelect,
  className = "",
}: QuickAddTemplateCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isCompact = variant === "compact";
  const href = `/transactions/new?templateId=${encodeURIComponent(template.id)}`;
  
  const handleSelect = () => {
    if (onSelect) {
      onSelect(template);
      return;
    }

    startTransition(() => {
      router.push(href);
    });
  };

  const cardClassName = `soft-inset relative min-w-0 overflow-hidden transition ${
    isPending ? "scale-[0.98] ring-2 ring-emerald-500/20" : "hover:brightness-[0.99]"
  } ${
    isCompact ? "h-[84px] p-3" : "p-3.5"
  } ${className}`.trim();

  const content = (
    <div className={`flex min-w-0 items-start gap-2 transition-opacity ${isPending ? "opacity-40" : "opacity-100"}`}>
      <TemplateIcon
        icon={template.icon}
        color={template.color}
        size={isCompact ? 14 : 16}
        className={isCompact ? "h-8 w-8 rounded-lg" : ""}
      />
      <div className="min-w-0 w-full">
        <p className={`truncate font-semibold text-slate-900 dark:text-slate-100 ${isCompact ? "text-[13px]" : "text-sm"}`}>
          {template.name}
        </p>
        {isCompact ? (
          <>
            <p className="mt-0.5 hidden truncate text-[11px] text-slate-500 dark:text-slate-400 sm:block">
              {template.category_name ?? "Tanpa kategori"}
            </p>
            <p className="mt-0.5 hidden truncate text-[10px] text-slate-500 dark:text-slate-400 sm:block">
              {formatTemplateTypeLabel(template.type)}
            </p>
          </>
        ) : (
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
            {template.category_name ?? "Tanpa kategori"} - {formatTemplateTypeLabel(template.type)}
          </p>
        )}
        {!isCompact && template.note ? (
          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
            {template.note}
          </p>
        ) : null}
        {template.amount ? (
          <p className={`mt-1 block max-w-full truncate font-semibold leading-tight text-slate-700 dark:text-slate-200 ${isCompact ? "text-[13px]" : "text-sm"}`}>
            <CurrencyAmount amountIDR={template.amount} compact={isCompact} />
          </p>
        ) : null}
      </div>
    </div>
  );

  return (
    <button
      type="button"
      onClick={handleSelect}
      disabled={isPending}
      className={`${cardClassName} w-full text-left cursor-pointer`}
      aria-busy={isPending}
    >
      {content}
      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/10 backdrop-blur-[1px] dark:bg-black/10">
          <LoadingSpinner size={isCompact ? "sm" : "md"} className="text-emerald-600 dark:text-emerald-400" />
        </div>
      )}
    </button>
  );
}
