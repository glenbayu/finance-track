import type { CurrencyCode } from "@/lib/currency";

export type QuickAddTemplateType = "income" | "expense";

export const QUICK_ADD_TEMPLATE_NAME_MAX = 40;
export const QUICK_ADD_TEMPLATE_NOTE_MAX = 120;

export const QUICK_ADD_TEMPLATE_ICON_OPTIONS = [
  "Utensils",
  "Coffee",
  "Fuel",
  "Car",
  "ShoppingBag",
  "ReceiptText",
  "Home",
  "Heart",
  "Gift",
  "Gamepad2",
  "Briefcase",
  "Wallet",
  "PiggyBank",
  "MoreHorizontal",
] as const;

export type QuickAddTemplateIcon = (typeof QUICK_ADD_TEMPLATE_ICON_OPTIONS)[number];

export const QUICK_ADD_TEMPLATE_COLOR_OPTIONS = [
  "emerald",
  "teal",
  "blue",
  "amber",
  "rose",
  "violet",
  "slate",
] as const;

export type QuickAddTemplateColor = (typeof QUICK_ADD_TEMPLATE_COLOR_OPTIONS)[number];

export type QuickAddTemplate = {
  id: string;
  user_id?: string;
  name: string;
  type: QuickAddTemplateType;
  category_id: string | null;
  amount: number | null;
  note: string | null;
  icon: QuickAddTemplateIcon;
  color: QuickAddTemplateColor;
  is_active: boolean;
  sort_order: number;
  use_count: number;
  last_used_at: string | null;
  created_at?: string;
  category_name: string | null;
};

function isTemplateType(value: string): value is QuickAddTemplateType {
  return value === "income" || value === "expense";
}

function isTemplateIcon(value: string): value is QuickAddTemplateIcon {
  return (QUICK_ADD_TEMPLATE_ICON_OPTIONS as readonly string[]).includes(value);
}

function isTemplateColor(value: string): value is QuickAddTemplateColor {
  return (QUICK_ADD_TEMPLATE_COLOR_OPTIONS as readonly string[]).includes(value);
}

export function normalizeTemplateType(value: unknown): QuickAddTemplateType {
  if (typeof value !== "string") return "expense";
  return isTemplateType(value) ? value : "expense";
}

export function normalizeTemplateIcon(value: unknown): QuickAddTemplateIcon {
  if (typeof value !== "string") return "ReceiptText";
  return isTemplateIcon(value) ? value : "ReceiptText";
}

export function normalizeTemplateColor(value: unknown): QuickAddTemplateColor {
  if (typeof value !== "string") return "teal";
  return isTemplateColor(value) ? value : "teal";
}

export function normalizeTemplateName(value: unknown) {
  return String(value ?? "").trim().slice(0, QUICK_ADD_TEMPLATE_NAME_MAX);
}

export function normalizeTemplateNote(value: unknown) {
  const note = String(value ?? "").trim().slice(0, QUICK_ADD_TEMPLATE_NOTE_MAX);
  return note.length > 0 ? note : null;
}

export function normalizeTemplateAmount(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed > 0 ? parsed : null;
}

export function normalizeTemplateSortOrder(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
}

export function normalizeTemplateCategoryId(value: unknown) {
  const categoryId = String(value ?? "").trim();
  return categoryId.length > 0 ? categoryId : null;
}

type CategoryRelation =
  | {
      name?: string | null;
    }
  | Array<{
      name?: string | null;
    }>
  | null;

export function mapQuickAddTemplateRow(
  row: Record<string, unknown>,
): QuickAddTemplate {
  const rawCategory = row.categories as CategoryRelation;
  const category = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;

  return {
    id: String(row.id ?? ""),
    user_id: row.user_id ? String(row.user_id) : undefined,
    name: normalizeTemplateName(row.name),
    type: normalizeTemplateType(row.type),
    category_id: normalizeTemplateCategoryId(row.category_id),
    amount: normalizeTemplateAmount(row.amount),
    note: normalizeTemplateNote(row.note),
    icon: normalizeTemplateIcon(row.icon),
    color: normalizeTemplateColor(row.color),
    is_active: Boolean(row.is_active ?? false),
    sort_order: normalizeTemplateSortOrder(row.sort_order),
    use_count: Math.max(0, Number(row.use_count ?? 0)),
    last_used_at: row.last_used_at ? String(row.last_used_at) : null,
    created_at: row.created_at ? String(row.created_at) : undefined,
    category_name: category?.name ? String(category.name) : null,
  };
}

export function byTemplateSort(
  a: Pick<QuickAddTemplate, "sort_order" | "created_at">,
  b: Pick<QuickAddTemplate, "sort_order" | "created_at">,
) {
  const sortDiff = a.sort_order - b.sort_order;
  if (sortDiff !== 0) return sortDiff;
  return String(a.created_at ?? "").localeCompare(String(b.created_at ?? ""));
}

export function formatTemplateTypeLabel(type: QuickAddTemplateType) {
  return type === "income" ? "Pemasukan" : "Pengeluaran";
}

export function idrHelperText(currency: CurrencyCode) {
  if (currency === "IDR") return "Nominal disimpan dalam Rupiah (IDR).";
  return "Nominal tetap disimpan dalam Rupiah (IDR), tampilan bisa dikonversi.";
}
