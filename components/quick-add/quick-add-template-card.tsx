import Link from "next/link";
import CurrencyAmount from "@/components/ui/currency-amount";
import TemplateIcon from "@/components/quick-add/template-icon";
import { formatTemplateTypeLabel, type QuickAddTemplate } from "@/lib/quick-add";

type QuickAddTemplateCardProps = {
  template: QuickAddTemplate;
  compact?: boolean;
  onSelect?: (template: QuickAddTemplate) => void;
};

export default function QuickAddTemplateCard({
  template,
  compact = false,
  onSelect,
}: QuickAddTemplateCardProps) {
  const href = `/transactions/new?templateId=${encodeURIComponent(template.id)}`;
  const className = `soft-inset transition hover:brightness-[0.99] ${
    compact ? "p-3" : "p-3.5"
  }`;
  const content = (
    <div className="flex items-start gap-2.5">
      <TemplateIcon icon={template.icon} color={template.color} />
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
          {template.name}
        </p>
        <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
          {template.category_name ?? "Tanpa kategori"} - {formatTemplateTypeLabel(template.type)}
        </p>
        {template.amount ? (
          <p className="mt-1 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <CurrencyAmount amountIDR={template.amount} />
          </p>
        ) : null}
      </div>
    </div>
  );

  if (onSelect) {
    return (
      <button
        type="button"
        onClick={() => onSelect(template)}
        className={`${className} w-full text-left`}
      >
        {content}
      </button>
    );
  }

  return (
    <Link
      href={href}
      className={className}
    >
      {content}
    </Link>
  );
}
