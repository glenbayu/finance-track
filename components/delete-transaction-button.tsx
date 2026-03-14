"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import ConfirmationModal from "@/components/confirmation-modal";

type DeleteTransactionButtonProps = {
  id: string;
  action: (formData: FormData) => void | Promise<void>;
};

function ConfirmDeleteButton({ formId }: { formId: string }) {
  return (
    <button
      type="submit"
      form={formId}
      className="inline-flex w-full items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300 sm:w-auto"
    >
      Hapus
    </button>
  );
}

export default function DeleteTransactionButton({
  id,
  action,
}: DeleteTransactionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const formId = useId();

  useEffect(() => {
    if (!isOpen) return;
    cancelButtonRef.current?.focus();
  }, [isOpen]);

  return (
    <form id={formId} action={action} className="contents">
      <input type="hidden" name="id" value={id} />

      <button
        type="button"
        aria-label="Hapus transaksi"
        title="Hapus transaksi"
        className="btn-danger-icon"
        onClick={() => setIsOpen(true)}
      >
        <Trash2 size={14} />
      </button>

      <ConfirmationModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Hapus transaksi?"
        description="Tindakan ini tidak bisa dibatalkan."
        icon={
          <div className="inline-flex rounded-full bg-red-100 p-2 text-red-600 dark:bg-red-950/60 dark:text-red-300">
            <AlertTriangle size={18} />
          </div>
        }
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelButtonRef}
            type="button"
            className="btn-secondary w-full sm:w-auto"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </button>
          <ConfirmDeleteButton formId={formId} />
        </div>
      </ConfirmationModal>
    </form>
  );
}
