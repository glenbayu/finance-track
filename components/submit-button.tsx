"use client";

import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

type SubmitButtonProps = {
  children: ReactNode;
  className?: string;
  pendingText?: string;
  pendingContent?: ReactNode;
  disabled?: boolean;
};

export default function SubmitButton({
  children,
  className = "btn-primary",
  pendingText,
  pendingContent,
  disabled,
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      className={className}
      disabled={pending || disabled}
      aria-disabled={pending || disabled}
      aria-busy={pending}
    >
      {pending
        ? pendingContent ?? (
            <span className="inline-flex items-center gap-2">
              <LoaderCircle size={16} className="animate-spin" />
              {pendingText ?? "Memproses..."}
            </span>
          )
        : children}
    </button>
  );
}
