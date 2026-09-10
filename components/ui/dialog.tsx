"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type DialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  closeDisabled?: boolean;
};

/** Native top-layer dialog: independent of shell transforms and navigation stacking. */
export default function Dialog({ isOpen, onClose, title, description, children, closeDisabled = false }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!isOpen || !dialog) return;
    const invoker = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    const initial = dialog.querySelector<HTMLElement>("[data-dialog-initial], input:not([type=hidden]):not(:disabled), select:not(:disabled), textarea:not(:disabled)");
    (initial ?? dialog.querySelector<HTMLElement>("h2"))?.focus({ preventScroll: true });
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (invoker?.isConnected) invoker.focus({ preventScroll: true });
    };
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") return null;
  return createPortal(
    <dialog ref={ref} className="app-dialog" aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => { event.preventDefault(); if (!closeDisabled) onClose(); }}
      onClick={(event) => {
        if (closeDisabled || event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose();
      }}>
      <h2 id={titleId} tabIndex={-1} className="pr-12 text-lg font-semibold">{title}</h2>
      {description && <div id={descriptionId} className="mt-2 text-sm text-[var(--lk-text-muted)]">{description}</div>}
      <div className="mt-6">{children}</div>
      <button type="button" onClick={onClose} disabled={closeDisabled} className="dialog-close" aria-label="Tutup dialog" title="Tutup">
        <X size={20} aria-hidden="true" />
      </button>
    </dialog>, document.body,
  );
}
