import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SubmitButton from "@/components/ui/submit-button";

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
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
          </div>
          <h1 className="text-xl font-bold" style={{ color: "var(--lk-text)" }}>Daftar Akun Baru</h1>
          <p className="mt-1 text-sm" style={{ color: "var(--lk-text-muted)" }}>
            Buat akun untuk mencatat keuanganmu
          </p>
        </div>

        <div
          className="rounded-lg p-6"
          style={{
            backgroundColor: "var(--lk-surface)",
            border: "1px solid var(--lk-border-strong)",
          }}
        >
          {params?.error && (
            <div
              className="mb-5 rounded-md px-4 py-3 text-sm"
              style={{ backgroundColor: "var(--lk-expense-bg)", color: "var(--lk-expense)", border: "1px solid rgba(255,180,171,0.2)" }}
            >
              {params.error}
            </div>
          )}

          <form action={signup} className="space-y-4">
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
                placeholder="Minimal 6 karakter"
                className="input-base"
                minLength={6}
                required
              />
            </div>

            <SubmitButton className="btn-primary mt-2 w-full py-2.5 text-sm font-semibold rounded-md" pendingText="Membuat Akun...">
              Buat Akun
            </SubmitButton>
          </form>

          <p className="mt-6 text-center text-xs" style={{ color: "var(--lk-text-muted)" }}>
            Sudah punya akun?{" "}
            <Link
              href="/login"
              className="font-semibold hover:underline"
              style={{ color: "var(--lk-primary-light)" }}
            >
              Login Sekarang
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
