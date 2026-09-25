import Link from "next/link";
import {
  Settings,
  Sparkles,
  Tags,
  Target,
  Wallet,
  ChevronRight,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import AppShell from "@/components/layout/app-shell";
import LogoutButton from "@/components/auth/logout-button";
import { requireUser } from "@/lib/supabase/auth";
import EditProfileModal from "@/components/more/edit-profile-modal";
import ThemeRow from "@/components/more/theme-row";

export default async function MorePage() {
  const { user } = await requireUser();
  const email = user?.email || "pengguna@example.com";
  const fullName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    email.split("@")[0];
  const initial = fullName.charAt(0).toUpperCase();

  const joinedDate = user?.created_at
    ? new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(new Date(user.created_at))
    : null;

  const dataManagementGroup = [
    {
      href: "/wallets",
      label: "Dompet & Rekening",
      desc: "Kelola saldo & dompet kamu",
      icon: Wallet,
      iconBg: "linear-gradient(135deg, #f59e0b, #d97706)",
    },
    {
      href: "/categories",
      label: "Kategori Transaksi",
      desc: "Atur label pengeluaran & pemasukan",
      icon: Tags,
      iconBg: "linear-gradient(135deg, #10b981, #059669)",
    },
    {
      href: "/budgets",
      label: "Anggaran (Budgets)",
      desc: "Pantau & batasi pengeluaran bulanan",
      icon: Target,
      iconBg: "linear-gradient(135deg, #3b82f6, #2563eb)",
    },
    {
      href: "/settings/templates",
      label: "Quick Add Templates",
      desc: "Template transaksi cepat favoritmu",
      icon: Sparkles,
      iconBg: "linear-gradient(135deg, #a855f7, #7c3aed)",
    },
  ];

  const preferencesGroup = [
    {
      href: "/settings",
      label: "Pengaturan Lanjutan",
      desc: "Preferensi tampilan & data",
      icon: Settings,
      iconBg: "linear-gradient(135deg, #64748b, #475569)",
    },
  ];

  return (
    <AppShell
      className="bg-[var(--lk-bg)]"
      activeNav="more"
      maxWidth="4xl"
      eyebrow="Ruang Pribadi"
      title="Akun Saya"
      description="Kelola profil dan pengaturan aplikasi."
    >
      <div className="mx-auto max-w-lg space-y-4 pb-12">

        {/* ── Profile Card (Modern iOS style) ── */}
        <section
          style={{
            borderRadius: "1rem",
            border: "1px solid var(--lk-border)",
            background: "var(--lk-surface)",
            padding: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.875rem", minWidth: 0 }}>
              {/* Avatar */}
              <div
                style={{
                  width: "3.25rem",
                  height: "3.25rem",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #6366f1, #a855f7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "1.35rem",
                  fontWeight: 800,
                  color: "#fff",
                  boxShadow: "0 2px 8px rgba(99,102,241,0.25)",
                  userSelect: "none",
                  flexShrink: 0,
                }}
              >
                {initial}
              </div>

              {/* Name & Email */}
              <div style={{ minWidth: 0 }}>
                <h2
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    color: "var(--lk-text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    letterSpacing: "-0.01em",
                  }}
                >
                  {fullName}
                </h2>
                <p
                  style={{
                    fontSize: "0.78rem",
                    color: "var(--lk-text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginTop: "0.05rem",
                  }}
                >
                  {email}
                </p>
              </div>
            </div>

            <EditProfileModal
              currentName={fullName}
              email={user.email || ""}
              emailVerified={Boolean(user.email_confirmed_at)}
              joinedAt={user.created_at}
            />
          </div>

          {/* Badges */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              marginTop: "0.85rem",
              paddingTop: "0.75rem",
              borderTop: "1px solid var(--lk-border)",
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.3rem",
                borderRadius: "9999px",
                background: "var(--lk-income-bg)",
                color: "var(--lk-income)",
                padding: "0.2rem 0.6rem",
                fontSize: "0.68rem",
                fontWeight: 700,
              }}
            >
              <ShieldCheck size={11} />
              Akun Aktif
            </span>
            {joinedDate && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.3rem",
                  fontSize: "0.7rem",
                  color: "var(--lk-text-faint)",
                  fontWeight: 500,
                }}
              >
                <Calendar size={11} />
                Bergabung {joinedDate}
              </span>
            )}
          </div>
        </section>

        {/* ── Data Keuangan Group ── */}
        <section>
          <p
            style={{
              marginBottom: "0.4rem",
              paddingLeft: "0.25rem",
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--lk-text-faint)",
            }}
          >
            Data Keuangan
          </p>
          <div
            style={{
              borderRadius: "1rem",
              border: "1px solid var(--lk-border)",
              background: "var(--lk-surface)",
              overflow: "hidden",
            }}
          >
            {dataManagementGroup.map((item, i) => {
              const Icon = item.icon;
              const isLast = i === dataManagementGroup.length - 1;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.875rem",
                    padding: "0.8rem 1rem",
                    borderBottom: isLast ? "none" : "1px solid var(--lk-border)",
                    transition: "background-color 120ms ease",
                    textDecoration: "none",
                    WebkitTapHighlightColor: "transparent",
                  }}
                  className="more-menu-row"
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: "2.35rem",
                      height: "2.35rem",
                      borderRadius: "0.55rem",
                      background: item.iconBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                    }}
                  >
                    <Icon size={17} strokeWidth={2} color="#fff" />
                  </div>

                  {/* Text */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "var(--lk-text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.label}
                    </p>
                    <p
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--lk-text-muted)",
                        marginTop: "0.05rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.desc}
                    </p>
                  </div>

                  <ChevronRight size={16} style={{ color: "var(--lk-text-faint)", flexShrink: 0 }} />
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Preferensi Group ── */}
        <section>
          <p
            style={{
              marginBottom: "0.4rem",
              paddingLeft: "0.25rem",
              fontSize: "0.68rem",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--lk-text-faint)",
            }}
          >
            Preferensi
          </p>
          <div
            style={{
              borderRadius: "1rem",
              border: "1px solid var(--lk-border)",
              background: "var(--lk-surface)",
              overflow: "hidden",
            }}
          >
            <ThemeRow />
            {preferencesGroup.map((item, i) => {
              const Icon = item.icon;
              const isLast = i === preferencesGroup.length - 1;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.875rem",
                    padding: "0.8rem 1rem",
                    borderTop: "1px solid var(--lk-border)",
                    borderBottom: isLast ? "none" : "1px solid var(--lk-border)",
                    transition: "background-color 120ms ease",
                    textDecoration: "none",
                    WebkitTapHighlightColor: "transparent",
                  }}
                  className="more-menu-row"
                >
                  <div
                    style={{
                      width: "2.35rem",
                      height: "2.35rem",
                      borderRadius: "0.55rem",
                      background: item.iconBg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                    }}
                  >
                    <Icon size={17} strokeWidth={2} color="#fff" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "var(--lk-text)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.label}
                    </p>
                    <p
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--lk-text-muted)",
                        marginTop: "0.05rem",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {item.desc}
                    </p>
                  </div>
                  <ChevronRight size={16} style={{ color: "var(--lk-text-faint)", flexShrink: 0 }} />
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Logout Section ── */}
        <section>
          <div
            style={{
              borderRadius: "1rem",
              border: "1px solid color-mix(in srgb, var(--lk-expense) 20%, var(--lk-border))",
              background: "var(--lk-surface)",
              overflow: "hidden",
            }}
          >
            <LogoutButton
              className="more-logout-row"
            />
          </div>
        </section>

        {/* ── Footer ── */}
        <p
          style={{
            textAlign: "center",
            fontSize: "0.7rem",
            color: "var(--lk-text-faint)",
            fontWeight: 500,
            paddingTop: "0.25rem",
            paddingBottom: "0.5rem",
          }}
        >
          Finance Journal · v0.1.0
        </p>
      </div>
    </AppShell>
  );
}
