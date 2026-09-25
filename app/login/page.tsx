import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SubmitButton from "@/components/ui/submit-button";
import PasswordInput from "@/components/auth/password-input";

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
      style={{
        background: "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(15,118,110,0.18) 0%, transparent 60%), var(--lk-bg)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Subtle grid pattern overlay */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "linear-gradient(var(--lk-border) 1px, transparent 1px), linear-gradient(90deg, var(--lk-border) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          opacity: 0.25,
          pointerEvents: "none",
        }}
      />

      <div className="w-full max-w-[420px]" style={{ position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg"
            style={{
              background: "linear-gradient(135deg, var(--lk-primary) 0%, var(--lk-primary-hover) 100%)",
              boxShadow: "0 8px 32px rgba(15,118,110,0.35)",
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--lk-text)", fontFamily: "var(--font-display, inherit)" }}>Finance Journal</h1>
          <p className="mt-1.5 text-sm" style={{ color: "var(--lk-text-muted)" }}>
            Masuk ke akun kamu
          </p>
        </div>

        <div
          className="rounded-2xl p-7 shadow-xl"
          style={{
            backgroundColor: "var(--lk-surface)",
            border: "1px solid var(--lk-border-strong)",
            backdropFilter: "blur(8px)",
          }}
        >
          {params?.message && (
            <div
              className="mb-5 rounded-xl px-4 py-3 text-sm"
              style={{ backgroundColor: "var(--lk-income-bg)", color: "var(--lk-income)", border: "1px solid rgba(117,218,168,0.2)" }}
            >
              {params.message}
            </div>
          )}

          {params?.error && (
            <div
              className="mb-5 rounded-xl px-4 py-3 text-sm"
              style={{ backgroundColor: "var(--lk-expense-bg)", color: "var(--lk-expense)", border: "1px solid rgba(255,180,171,0.2)" }}
            >
              {params.error}
            </div>
          )}

          <form action={login} className="space-y-5">
            <input type="hidden" name="next" value={nextPath} />

            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold" style={{ color: "var(--lk-text-muted)" }}>
                Alamat Email
              </label>
              <input
                aria-label="Alamat email"
                type="email"
                name="email"
                autoComplete="email"
                id="email"
                placeholder="nama@email.com"
                className="input-base placeholder:[font:inherit]"
                required
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label htmlFor="password" className="text-xs font-semibold" style={{ color: "var(--lk-text-muted)" }}>
                  Kata Sandi
                </label>
              </div>
              <PasswordInput />
            </div>

            <SubmitButton className="btn-primary mt-1 w-full py-2.5 text-sm font-semibold rounded-xl" pendingText="Memeriksa...">
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

        <p className="mt-4 text-center text-[11px]" style={{ color: "var(--lk-text-faint)" }}>
          Finance Journal · v0.1.0
        </p>
      </div>
    </main>
  );
}
