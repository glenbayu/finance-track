import Link from "next/link";
import AppShell from "@/components/layout/app-shell";
import QuickAddTemplateForm from "@/components/quick-add/quick-add-template-form";
import TemplateIcon from "@/components/quick-add/template-icon";
import CurrencyAmount from "@/components/ui/currency-amount";
import {
  createQuickAddTemplate,
  deleteQuickAddTemplate,
  reorderQuickAddTemplate,
  toggleQuickAddTemplate,
  updateQuickAddTemplate,
} from "@/app/settings/templates/actions";
import {
  byTemplateSort,
  formatTemplateTypeLabel,
  mapQuickAddTemplateRow,
  type QuickAddTemplate,
} from "@/lib/quick-add";
import { formatDate } from "@/lib/format";
import { requireUser } from "@/lib/supabase/auth";
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from "lucide-react";

function formatLastUsed(value: string | null) {
  if (!value) return "Belum pernah dipakai";
  return formatDate(value);
}

export default async function SettingsTemplatesPage() {
  const { supabase, user } = await requireUser();

  const [categoriesResult, templatesResult] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, type")
      .or(`user_id.eq.${user.id},user_id.is.null`)
      .is("archived_at", null)
      .order("name", { ascending: true }),
    supabase
      .from("quick_add_templates")
      .select(`
        id,
        user_id,
        name,
        type,
        category_id,
        amount,
        note,
        icon,
        color,
        is_active,
        sort_order,
        use_count,
        last_used_at,
        created_at,
        categories (
          name
        )
      `)
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  if (categoriesResult.error) {
    throw new Error(`Gagal memuat kategori: ${categoriesResult.error.message}`);
  }

  if (templatesResult.error) {
    throw new Error(`Gagal memuat template: ${templatesResult.error.message}`);
  }

  const categories = categoriesResult.data ?? [];
  const templates = ((templatesResult.data ?? []) as Record<string, unknown>[])
    .map(mapQuickAddTemplateRow)
    .sort(byTemplateSort);

  const totalTemplates = templates.length;
  const activeTemplates = templates.filter((item) => item.is_active).length;
  const mostUsedTemplate = [...templates].sort((a, b) => b.use_count - a.use_count)[0] ?? null;
  const recentlyUsedTemplate =
    [...templates]
      .filter((item) => item.last_used_at)
      .sort((a, b) => new Date(String(b.last_used_at)).getTime() - new Date(String(a.last_used_at)).getTime())[0] ??
    null;

  return (
    <AppShell
      className="journal-dashboard"
      activeNav="settings"
      title="Quick Add Templates"
      description="Kelola shortcut transaksi yang sering kamu pakai."
    >
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <article className="stat-card">
          <p className="text-sm text-slate-500 dark:text-slate-400">Template aktif</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">{activeTemplates}</p>
        </article>
        <article className="stat-card">
          <p className="text-sm text-slate-500 dark:text-slate-400">Total template</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-100">{totalTemplates}</p>
        </article>
        <article className="stat-card">
          <p className="text-sm text-slate-500 dark:text-slate-400">Template terpopuler</p>
          <p className="mt-2 truncate text-lg font-semibold text-slate-900 dark:text-slate-100">
            {mostUsedTemplate ? `${mostUsedTemplate.name} (${mostUsedTemplate.use_count}x)` : "-"}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Terakhir dipakai:{" "}
            {recentlyUsedTemplate
              ? `${recentlyUsedTemplate.name} - ${formatLastUsed(recentlyUsedTemplate.last_used_at)}`
              : "Belum ada"}
          </p>
        </article>
      </section>

      <section className="section-card mt-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold">Buat Template Baru</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Template ini hanya mengisi form transaksi. Transaksi tetap harus kamu simpan manual.
            </p>
          </div>
        </div>
        <QuickAddTemplateForm
          mode="create"
          categories={categories}
          action={createQuickAddTemplate}
          submitLabel="Simpan Template"
          pendingText="Menyimpan..."
        />
      </section>

      <section className="section-card mt-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <h2 className="text-xl font-semibold">Daftar Template</h2>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Urutkan sesuai prioritas kamu
          </span>
        </div>

        {templates.length === 0 ? (
          <div className="mt-4">
            <h3 className="text-lg font-semibold">Belum ada template.</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Buat template pertama agar input transaksi rutin jadi lebih cepat.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["Makan", "Bensin", "Kopi", "Parkir", "Gaji"].map((name) => (
                <span key={name} className="chip-neutral">
                  {name}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 xl:grid-cols-2 xl:items-start">
            {templates.map((template, index) => (
              <TemplateItemCard
                key={template.id}
                template={template}
                categories={categories}
                index={index}
                total={templates.length}
              />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

type CategoryOption = {
  id: string;
  name: string;
  type: "income" | "expense";
};

type TemplateItemCardProps = {
  template: QuickAddTemplate;
  categories: CategoryOption[];
  index: number;
  total: number;
};

function TemplateItemCard({ template, categories, index, total }: TemplateItemCardProps) {
  return (
    <article className="soft-inset self-start h-fit">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <TemplateIcon icon={template.icon} color={template.color} />
            <div>
              <p className="truncate text-lg font-semibold">{template.name}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {template.category_name ?? "Tanpa kategori"} - {formatTemplateTypeLabel(template.type)}
              </p>
            </div>
          </div>
          {template.note ? (
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{template.note}</p>
          ) : null}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {template.amount ? (
              <span className="chip-neutral">
                <CurrencyAmount amountIDR={template.amount} />
              </span>
            ) : (
              <span className="chip-neutral">Tanpa nominal default</span>
            )}
            <span className={template.is_active ? "chip-income" : "chip-neutral"}>
              {template.is_active ? "Aktif" : "Nonaktif"}
            </span>
            <span className="chip-neutral">Dipakai {template.use_count}x</span>
          </div>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Last used: {formatLastUsed(template.last_used_at)}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <form action={reorderQuickAddTemplate}>
          <input type="hidden" name="template_id" value={template.id} />
          <input type="hidden" name="direction" value="up" />
          <button
            type="submit"
            disabled={index === 0}
            className="btn-secondary h-10 w-full justify-center gap-1 disabled:opacity-50"
          >
            <ArrowUp size={14} />
            Naik
          </button>
        </form>
        <form action={reorderQuickAddTemplate}>
          <input type="hidden" name="template_id" value={template.id} />
          <input type="hidden" name="direction" value="down" />
          <button
            type="submit"
            disabled={index === total - 1}
            className="btn-secondary h-10 w-full justify-center gap-1 disabled:opacity-50"
          >
            <ArrowDown size={14} />
            Turun
          </button>
        </form>
        <form action={toggleQuickAddTemplate}>
          <input type="hidden" name="template_id" value={template.id} />
          <input type="hidden" name="next_active" value={template.is_active ? "false" : "true"} />
          <button type="submit" className="btn-secondary h-10 w-full justify-center">
            {template.is_active ? "Nonaktifkan" : "Aktifkan"}
          </button>
        </form>
        <form action={deleteQuickAddTemplate}>
          <input type="hidden" name="template_id" value={template.id} />
          <button type="submit" className="btn-secondary h-10 w-full justify-center gap-1 text-rose-600 dark:text-rose-300">
            <Trash2 size={14} />
            Hapus
          </button>
        </form>
      </div>

      <details className="mt-4 group">
        <summary className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <Pencil size={14} />
          Edit template
        </summary>
        <div className="mt-4 border-t border-[color:var(--stroke)] pt-4">
          <QuickAddTemplateForm
            mode="edit"
            categories={categories}
            action={updateQuickAddTemplate}
            submitLabel="Update Template"
            pendingText="Menyimpan..."
            initialValue={template}
          />
        </div>
      </details>

      <div className="mt-4">
        <Link
          href={`/transactions/new?templateId=${encodeURIComponent(template.id)}`}
          className="btn-secondary h-10 px-4"
        >
          <Plus size={14} />
          Gunakan Template
        </Link>
      </div>
    </article>
  );
}
