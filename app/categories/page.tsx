import { revalidatePath } from "next/cache";
import Link from "next/link";
import LogoutButton from "@/components/logout-button";
import SubmitButton from "@/components/submit-button";
import { requireUser } from "@/lib/supabase/auth";
import { LayoutDashboard } from "lucide-react";

async function createCategory(formData: FormData) {
  "use server";

  const { supabase, user } = await requireUser();

  const name = String(formData.get("name") || "").trim();
  const type = formData.get("type") as "income" | "expense";

  if (!name || !type) {
    throw new Error("Nama kategori dan tipe wajib diisi.");
  }

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name,
    type,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/categories");
  revalidatePath("/");
  revalidatePath("/transactions/new");
  revalidatePath("/transactions");
}

async function deleteCategory(formData: FormData) {
  "use server";

  const { supabase, user } = await requireUser();
  const id = String(formData.get("id") || "");

  if (!id) {
    throw new Error("ID kategori tidak valid.");
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/categories");
  revalidatePath("/");
  revalidatePath("/transactions/new");
  revalidatePath("/transactions");
}

export default async function CategoriesPage() {
  const { supabase, user } = await requireUser();

  const { data: categories, error } = await supabase
    .from("categories")
    .select("id, user_id, name, type, created_at")
    .or(`user_id.eq.${user.id},user_id.is.null`)
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  return (
    <main className="page-shell">
      <div className="page-container max-w-5xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Kategori</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-300">
              Kelola kategori pemasukan dan pengeluaran.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/"
              aria-label="Dashboard"
              title="Dashboard"
              className="btn-secondary h-10 w-[50px] shrink-0"
            >
              <LayoutDashboard size={16} />
              <span className="sr-only">Dashboard</span>
            </Link>
            <Link href="/transactions/new" className="btn-primary">
              + Transaksi
            </Link>
            <LogoutButton className="btn-secondary gap-2" />
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:items-start">
          <div className="section-card">
            <h2 className="text-xl font-semibold">Tambah Kategori</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Tambah kategori baru sesuai kebutuhan lo.
            </p>

            <form action={createCategory} className="mt-5 space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Nama kategori
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="Contoh: Saham"
                  className="input-base"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Tipe</label>
                <select
                  name="type"
                  className="input-base select-base"
                  required
                  defaultValue="expense"
                >
                  <option value="expense">Pengeluaran</option>
                  <option value="income">Pemasukan</option>
                </select>
              </div>

              <SubmitButton className="btn-primary w-full py-3" pendingText="Menyimpan...">
                Simpan Kategori
              </SubmitButton>
            </form>
          </div>

          <div className="section-card">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Daftar Kategori</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Semua kategori yang tersedia di aplikasi.
                </p>
              </div>
            </div>

            {error ? (
              <p className="text-red-600">Error: {error.message}</p>
            ) : !categories || categories.length === 0 ? (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                <p>Belum ada kategori.</p>
                <p className="mt-1">
                  Tambah kategori pertama di panel “Tambah Kategori”.
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <Link href="/transactions/new" className="btn-primary">
                    + Tambah Transaksi
                  </Link>
                  <Link href="/" className="btn-secondary">
                    Ke Dashboard
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="soft-inset flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{category.name}</p>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {category.type === "income"
                          ? "Kategori pemasukan"
                          : "Kategori pengeluaran"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {category.user_id ? (
                        <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          Punya kamu
                        </span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                          Default
                        </span>
                      )}
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          category.type === "income"
                            ? "bg-green-100 text-green-700 dark:bg-green-950/50 dark:text-green-300"
                            : "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300"
                        }`}
                      >
                        {category.type === "income" ? "Pemasukan" : "Pengeluaran"}
                      </span>

                      {category.user_id === user.id ? (
                        <form action={deleteCategory}>
                          <input type="hidden" name="id" value={category.id} />
                          <SubmitButton
                            className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300 dark:hover:bg-red-600"
                            pendingText="Menghapus..."
                          >
                            Hapus
                          </SubmitButton>
                        </form>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
