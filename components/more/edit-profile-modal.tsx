"use client";

import { useState } from "react";
import { Edit2, X } from "lucide-react";
import SubmitButton from "@/components/ui/submit-button";
import { updateProfile } from "@/app/(app)/more/actions";

export default function EditProfileModal({ currentName }: { currentName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const handleUpdate = async (formData: FormData) => {
    setErrorMsg("");
    try {
      await updateProfile(formData);
      setIsOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memperbarui profil.");
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-200 transition-colors dark:bg-blue-500/20 dark:text-blue-400 dark:hover:bg-blue-500/30"
      >
        <Edit2 size={12} />
        Edit Profil
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm dark:bg-slate-900/80 p-4">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors dark:hover:text-slate-200"
            >
              <X size={20} />
            </button>
            <h3 className="mb-2 text-lg font-bold text-slate-900 dark:text-white">
              Edit Profil
            </h3>
            <p className="mb-6 text-sm text-slate-500 dark:text-slate-400">
              Ubah nama panggilan yang akan ditampilkan.
            </p>
            
            {errorMsg && (
              <div className="mb-4 rounded-lg bg-rose-50 p-3 text-sm text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20">
                {errorMsg}
              </div>
            )}

            <form action={handleUpdate} className="space-y-4">
              <div>
                <input
                  type="text"
                  name="name"
                  defaultValue={currentName}
                  placeholder="Nama Lengkap..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-400"
                  required
                />
              </div>
              <SubmitButton className="btn-primary w-full py-3 rounded-xl font-semibold" pendingText="Menyimpan...">
                Simpan Perubahan
              </SubmitButton>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
