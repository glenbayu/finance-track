import { BadgeCheck, User } from "lucide-react";

type ProfileCardProps = {
  email: string;
};

export default function ProfileCard({ email }: ProfileCardProps) {
  return (
    <article className="section-card">
      <div className="flex items-start gap-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--surface-soft)] text-slate-700 dark:text-slate-200">
          <User size={18} />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Profile</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Akun ini digunakan untuk menyimpan data keuangan pribadi kamu.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="soft-inset">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Email
          </p>
          <p className="mt-1 truncate font-semibold text-slate-900 dark:text-slate-100">
            {email}
          </p>
        </div>

        <div className="soft-inset flex items-center justify-between gap-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">Status akun</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/35 dark:text-emerald-300">
            <BadgeCheck size={13} />
            Active
          </span>
        </div>
      </div>
    </article>
  );
}

