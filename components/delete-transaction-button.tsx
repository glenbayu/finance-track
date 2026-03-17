"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AlertTriangle, LoaderCircle, Trash2 } from "lucide-react";
import ConfirmationModal from "@/components/confirmation-modal";

type DeleteTransactionButtonProps = {
  id: string;
  action: (formData: FormData) => void | Promise<void>;
};

function ConfirmDeleteButton({
  formId,
  isSubmitting,
}: {
  formId: string;
  isSubmitting: boolean;
}) {
  return (
    <button
      type="submit"
      form={formId}
      className="inline-flex w-full items-center justify-center rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300 sm:w-auto"
      disabled={isSubmitting}
    >
      {isSubmitting ? (
        <span className="inline-flex items-center gap-2">
          <LoaderCircle size={16} className="animate-spin" />
          Menghapus...
        </span>
      ) : (
        "Hapus"
      )}
    </button>
  );
}

export default function DeleteTransactionButton({
  id,
  action,
}: DeleteTransactionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const formId = useId();

  const closeModal = () => {
    setIsOpen(false);
    setIsSubmitting(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    cancelButtonRef.current?.focus();
  }, [isOpen]);

  return (
    <form
      id={formId}
      action={action}
      className="contents"
      onSubmit={() => {
        Promise.resolve().then(() => setIsSubmitting(true));
      }}
    >
      <input type="hidden" name="id" value={id} />

      <button
        type="button"
        aria-label="Hapus transaksi"
        title="Hapus transaksi"
        className="btn-danger-icon"
        onClick={() => setIsOpen(true)}
        disabled={isSubmitting}
      >
        <Trash2 size={14} />
      </button>

      <ConfirmationModal
        isOpen={isOpen}
        onClose={closeModal}
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
            onClick={closeModal}
            disabled={isSubmitting}
          >
            Batal
          </button>
          <ConfirmDeleteButton
            formId={formId}
            isSubmitting={isSubmitting}
          />
        </div>
      </ConfirmationModal>
    </form>
  );
}
