"use client";

import type { ReactNode } from "react";
import Dialog from "@/components/ui/dialog";

type ConfirmationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  icon?: ReactNode;
  children: ReactNode;
};

export default function ConfirmationModal({ isOpen, onClose, title, description, icon, children }: ConfirmationModalProps) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={title} description={description}>
      {icon && <div className="mb-4" aria-hidden="true">{icon}</div>}
      {children}
    </Dialog>
  );
}
