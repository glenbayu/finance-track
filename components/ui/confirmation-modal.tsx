"use client";

import { useEffect, useId, type ReactNode } from "react";
import { createPortal } from "react-dom";

type ConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon?: ReactNode;
  children: ReactNode;
};

export default function ConfirmationModal({
  isOpen,
  onClose,
  title,
  description,
  icon,
  children,
}: ConfirmationModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, onClose]);

  if (!portalTarget || !isOpen) return null;

  return createPortal(
    <div
      className="modal-overlay z-[100]"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="modal-card relative"
      >
        {icon ? <div className="mb-4">{icon}</div> : null}
        <h3 id={titleId} className="text-lg font-bold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <p id={descriptionId} className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          {description}
        </p>
        <div className="mt-6">{children}</div>
      </div>
    </div>,
    portalTarget,
  );
}
