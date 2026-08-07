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
    <main
      className="flex min-h-screen items-center justify-center p-4"
      style={{ backgroundColor: "var(--lk-bg)" }}
    >
      <div className="w-full max-w-[380px]">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg"
            style={{ backgroundColor: "var(--lk-primary)" }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--lk-text)" }}>Finance Journal</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--lk-text-muted)" }}>
            Masuk ke akun kamu
          </p>
        </div>

        <div
          className="rounded-lg p-6"
          style={{
            backgroundColor: "var(--lk-surface)",
            border: "1px solid var(--lk-border-strong)",
          }}
        >
          {params?.message && (
            <div
              className="mb-5 rounded-md px-4 py-3 text-sm"
              style={{ backgroundColor: "var(--lk-income-bg)", color: "var(--lk-income)", border: "1px solid rgba(117,218,168,0.2)" }}
            >
              {params.message}
            </div>
          )}

          {params?.error && (
            <div
              className="mb-5 rounded-md px-4 py-3 text-sm"
              style={{ backgroundColor: "var(--lk-expense-bg)", color: "var(--lk-expense)", border: "1px solid rgba(255,180,171,0.2)" }}
            >
              {params.error}
            </div>
          )}

          <form action={login} className="space-y-4">
            <input type="hidden" name="next" value={nextPath} />

            <div>
              <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--lk-text-muted)" }}>
                Alamat Email
              </label>
              <input
                type="email"
                name="email"
                id="email"
                placeholder="nama@email.com"
                className="input-base"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--lk-text-muted)" }}>
                Kata Sandi
              </label>
              <input
                type="password"
                name="password"
                id="password"
                placeholder="••••••••"
                className="input-base"
                required
              />
            </div>

            <SubmitButton className="btn-primary mt-2 w-full py-2.5 text-sm font-semibold rounded-md" pendingText="Memeriksa...">
              Masuk
            </SubmitButton>
          </form>

          <p className="mt-6 text-center text-xs" style={{ color: "var(--lk-text-muted)" }}>
            Belum punya akun?{" "}
            <Link
              href={`/signup?next=${encodeURIComponent(nextPath)}`}
              className="font-semibold hover:underline"
              style={{ color: "var(--lk-primary-light)" }}
            >
              Daftar Sekarang
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

