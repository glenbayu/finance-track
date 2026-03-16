import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SubmitButton from "@/components/submit-button";

type SignupPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

async function signup(formData: FormData) {
  "use server";

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    redirect(`/signup?error=${encodeURIComponent("Email dan password wajib diisi.")}`);
  }

  if (password.length < 6) {
    redirect(`/signup?error=${encodeURIComponent("Password minimal 6 karakter.")}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    redirect(`/signup?error=${encodeURIComponent(error.message)}`);
  }

  if (data.session) {
    redirect("/");
  }

  redirect("/login?message=Akun berhasil dibuat. Silakan login.");
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = await searchParams;

  return (
    <main className="page-shell">
      <div className="page-container max-w-md">
        <section className="hero-panel">
          <h1 className="text-3xl font-bold">Daftar</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Buat akun baru untuk mulai mencatat keuangan.
          </p>

          {params?.error ? (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              {params.error}
            </p>
          ) : null}

          <form action={signup} className="mt-6 space-y-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="you@email.com"
                className="input-base"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Password
              </label>
              <input
                type="password"
                name="password"
                placeholder="Minimal 6 karakter"
                className="input-base"
                minLength={6}
                required
              />
            </div>

            <SubmitButton className="btn-primary w-full py-3" pendingText="Membuat akun...">
              Buat Akun
            </SubmitButton>
          </form>

          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            Sudah punya akun?{" "}
            <Link href="/login" className="font-semibold text-slate-800 underline dark:text-slate-100">
              Login
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
