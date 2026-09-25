"use client";

import { useActionState, useRef, useState } from "react";
import { Edit2 } from "lucide-react";
import { toast } from "sonner";
import Dialog from "@/components/ui/dialog";
import SubmitButton from "@/components/ui/submit-button";
import { updateProfile } from "@/app/(app)/more/actions";
import { PROFILE_NAME_MAX_LENGTH, validateProfileName } from "@/lib/profile";
import styles from "./edit-profile-modal.module.css";

type EditProfileModalProps = {
  currentName: string;
  email: string;
  emailVerified: boolean;
  joinedAt: string;
  className?: string;
};

export default function EditProfileModal({ currentName, email, emailVerified, joinedAt, className }: EditProfileModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(currentName);
  const [nameError, setNameError] = useState<string>();
  const [errorMsg, setErrorMsg] = useState("");
  const [touched, setTouched] = useState(false);
  const submitting = useRef(false);
  const nameInput = useRef<HTMLInputElement>(null);
  const joinedDate = new Date(joinedAt);
  const joinedLabel = Number.isNaN(joinedDate.getTime()) ? null : new Intl.DateTimeFormat("id-ID", {
    day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta",
  }).format(joinedDate);

  const handleUpdate = async (formData: FormData) => {
    if (submitting.current) return;
    const validationError = validateProfileName(name);
    setTouched(true);
    setNameError(validationError);
    setErrorMsg("");
    if (validationError) {
      nameInput.current?.focus();
      return;
    }
    submitting.current = true;
    try {
      const result = await updateProfile(formData);
      if (!result.ok) {
        if (result.field === "name") {
          setNameError(result.error);
          nameInput.current?.focus();
        } else setErrorMsg(result.error);
        return;
      }
      setName(result.name);
      setIsOpen(false);
      toast.success("Profil berhasil diperbarui.");
    } catch {
      setErrorMsg("Profil belum tersimpan. Periksa koneksi lalu coba lagi.");
    } finally {
      submitting.current = false;
    }
  };

  const [, submitProfile, pending] = useActionState(async (_previous: null, formData: FormData) => {
    await handleUpdate(formData);
    return null;
  }, null);

  return <>
    <button
      type="button"
      onClick={() => {
        setName(currentName);
        setNameError(undefined);
        setTouched(false);
        setErrorMsg("");
        setIsOpen(true);
      }}
      className={className ?? "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[var(--lk-border-strong)] bg-[var(--lk-surface-raised)] text-xs font-semibold text-[var(--lk-text)] hover:bg-[var(--lk-surface-hover)] transition-colors shrink-0"}
    >
      <Edit2 size={13} aria-hidden="true" />
      <span>Edit Profil</span>
    </button>
    {isOpen && <Dialog isOpen={isOpen} closeDisabled={pending} onClose={() => { if (!submitting.current) setIsOpen(false); }}
      title="Edit Profil" description="Atur nama yang tampil di aplikasi dan periksa informasi akun kamu.">
      <form action={submitProfile} noValidate className={`${styles.form} space-y-6`} aria-busy={pending}>
        {errorMsg && <div role="alert" className="ui-alert ui-alert--error">{errorMsg}</div>}
        <div>
          <label htmlFor="profile-name" className="mb-2 block text-sm font-medium">Nama tampilan <span className="font-normal text-[var(--lk-text-muted)]">(wajib)</span></label>
          <input ref={nameInput} id="profile-name" type="text" name="name" autoComplete="name"
            value={name} required aria-required="true" maxLength={PROFILE_NAME_MAX_LENGTH} readOnly={pending}
            placeholder="Contoh: Rani Putri" className="input-base placeholder:[font:inherit]"
            aria-invalid={Boolean(nameError)} aria-describedby="profile-name-help"
            onBlur={() => { setTouched(true); setNameError(validateProfileName(name)); }}
            onChange={(event) => {
              setName(event.target.value);
              if (touched) setNameError(validateProfileName(event.target.value));
            }} />
          <p id="profile-name-help" aria-live="polite" className={`mt-2 min-h-5 text-sm ${nameError ? "text-[var(--lk-expense)]" : "text-[var(--lk-text-muted)]"}`}>
            {nameError || "Boleh nama lengkap atau panggilan. Maksimal 80 karakter."}
          </p>
        </div>
        <section aria-labelledby="profile-account-title" className="space-y-4 border-t border-[var(--lk-border)] pt-5">
          <h3 id="profile-account-title" className="text-sm font-semibold">Informasi akun</h3>
          <div>
            <label htmlFor="profile-email" className="mb-2 block text-sm font-medium">Email login</label>
            <input id="profile-email" type="email" value={email} readOnly autoComplete="email"
              className="input-base" aria-describedby="profile-email-help" />
            <p id="profile-email-help" className="mt-2 text-sm text-[var(--lk-text-muted)]">Email terkait dengan akses akun. Perubahannya memerlukan alur verifikasi terpisah yang belum tersedia.</p>
          </div>
          <dl className="space-y-3 text-sm">
            <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
              <dt className="text-[var(--lk-text-muted)]">Verifikasi email</dt>
              <dd>{emailVerified ? "Terverifikasi" : "Belum terverifikasi"}</dd>
            </div>
            {joinedLabel && <div className="flex flex-wrap justify-between gap-x-4 gap-y-1">
              <dt className="text-[var(--lk-text-muted)]">Bergabung sejak</dt><dd>{joinedLabel}</dd>
            </div>}
          </dl>
        </section>
        <div>
          {pending && <p role="status" className="mb-3 text-sm text-[var(--lk-text-muted)]">Sedang menyimpan profil. Tunggu hingga selesai.</p>}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button type="button" className="btn-secondary" disabled={pending} onClick={() => setIsOpen(false)}>Batal</button>
            <SubmitButton className="btn-primary" disabled={pending} pendingText="Menyimpan...">Simpan Perubahan</SubmitButton>
          </div>
        </div>
      </form>
    </Dialog>}
  </>;
}
