"use client";

import { useRef, useState, type ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import ConfirmationModal from "@/components/ui/confirmation-modal";

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "title"> & {
  title: string;
  description: string;
};

/** Confirms before replaying the original submit button, preserving formAction and validation. */
export default function ConfirmSubmitButton({ title, description, children, disabled, ...props }: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const approved = useRef(false);
  const [open, setOpen] = useState(false);
  const { pending } = useFormStatus();
  return <>
    <button {...props} type="submit" ref={ref} disabled={disabled || pending} aria-busy={pending}
      onClick={(event) => {
        if (approved.current) { approved.current = false; return; }
        event.preventDefault();
        setOpen(true);
      }}>{pending ? "Memproses…" : children}</button>
    <ConfirmationModal isOpen={open} onClose={() => setOpen(false)} title={title} description={description}>
      <div className="flex flex-wrap gap-3">
        <button type="button" data-dialog-initial className="btn-secondary flex-1" onClick={() => setOpen(false)}>Batal</button>
        <button type="button" className="btn-secondary flex-1 text-[var(--lk-expense)]" onClick={() => {
          approved.current = true;
          ref.current?.click();
          approved.current = false;
          setOpen(false);
        }}>Lanjutkan</button>
      </div>
    </ConfirmationModal>
  </>;
}
