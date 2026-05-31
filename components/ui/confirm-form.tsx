"use client";

import type { ReactNode } from "react";

type ConfirmFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  message: string;
  children: ReactNode;
  className?: string;
};

/**
 * A form wrapper that shows a browser confirm dialog before submitting.
 * Used for destructive server actions (delete, merge, etc).
 */
export default function ConfirmForm({
  action,
  message,
  children,
  className,
}: ConfirmFormProps) {
  return (
    <form
      action={action}
      className={className}
      onSubmit={(e) => {
        if (!window.confirm(message)) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </form>
  );
}
