import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

function sanitizeNext(nextValue?: string) {
  if (!nextValue) return "/";
  if (!nextValue.startsWith("/") || nextValue.startsWith("//")) return "/";
  return nextValue;
}

async function login(formData: FormData) {
  "use server";

  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const nextPath = sanitizeNext(String(formData.get("next") || "/"));

  if (!email || !password) {
    redirect(`/login?error=${encodeURIComponent("Email dan password wajib diisi.")}&next=${encodeURIComponent(nextPath)}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    redirect(`/login?error=${encodeURIComponent("Email atau password tidak valid.")}&next=${encodeURIComponent(nextPath)}`);
  }

  redirect(nextPath);
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = sanitizeNext(params?.next);

  return (
    <main className="page-shell">
      <div className="page-container max-w-md">
        <section className="hero-panel">
          <h1 className="text-3xl font-bold">Login</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Masuk untuk mengakses finance tracker kamu.
          </p>

          {params?.message ? (
            <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">
              {params.message}
            </p>
          ) : null}

          {params?.error ? (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300">
              {params.error}
            </p>
          ) : null}

          <form action={login} className="mt-6 space-y-4">
            <input type="hidden" name="next" value={nextPath} />

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
                placeholder="••••••••"
                className="input-base"
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full py-3">
              Login
            </button>
          </form>

          <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
            Belum punya akun?{" "}
            <Link href="/signup" className="font-semibold text-slate-800 underline dark:text-slate-100">
              Daftar
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
