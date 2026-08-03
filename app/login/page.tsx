import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SubmitButton from "@/components/ui/submit-button";

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
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-4 dark:bg-slate-950">
      {/* Background Blobs for Glassmorphism Effect */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[40%] w-[40%] rounded-full bg-blue-500/20 blur-[100px]" />
        <div className="absolute -bottom-[10%] -right-[10%] h-[40%] w-[40%] rounded-full bg-rose-500/20 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-[400px]">
        <section className="overflow-hidden rounded-[2rem] border border-white/60 bg-white/70 p-8 shadow-[0_8px_40px_rgb(0,0,0,0.08)] backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-900/70 dark:shadow-[0_8px_40px_rgb(0,0,0,0.4)]">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-blue-400 text-white shadow-lg shadow-blue-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Selamat Datang Kembali</h1>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Masuk untuk melanjutkan jurnal keuanganmu
            </p>
          </div>

          {params?.message && (
            <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700 backdrop-blur-md dark:border-emerald-900/50 dark:bg-emerald-950/40 dark:text-emerald-400">
              {params.message}
            </div>
          )}

          {params?.error && (
            <div className="mb-6 rounded-2xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-sm text-rose-700 backdrop-blur-md dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400">
              {params.error}
            </div>
          )}

          <form action={login} className="space-y-5">
            <input type="hidden" name="next" value={nextPath} />

            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                Alamat Email
              </label>
              <input
                type="email"
                name="email"
                placeholder="nama@email.com"
                className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 text-[15px] outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-white dark:focus:border-blue-500 dark:focus:bg-slate-800"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[13px] font-semibold text-slate-700 dark:text-slate-300">
                Kata Sandi
              </label>
              <input
                type="password"
                name="password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white/50 px-4 py-3 text-[15px] outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700/50 dark:bg-slate-800/50 dark:text-white dark:focus:border-blue-500 dark:focus:bg-slate-800"
                required
              />
            </div>

            <SubmitButton className="mt-2 w-full rounded-xl bg-blue-600 px-4 py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-blue-700 active:bg-blue-800" pendingText="Memeriksa Data...">
              Masuk
            </SubmitButton>
          </form>

          <p className="mt-8 text-center text-[13px] text-slate-500 dark:text-slate-400">
            Belum punya akun?{" "}
            <Link href={`/signup?next=${encodeURIComponent(nextPath)}`} className="font-semibold text-blue-600 hover:underline dark:text-blue-400">
              Daftar Sekarang
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}
