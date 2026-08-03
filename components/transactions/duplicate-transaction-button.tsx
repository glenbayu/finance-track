import Link from "next/link";
import { Copy } from "lucide-react";

type DuplicateTransactionButtonProps = {
  id: string;
  className?: string;
  label?: string;
};

export default function DuplicateTransactionButton({
  id,
  className,
  label = "Duplikat",
}: DuplicateTransactionButtonProps) {
  return (
    <Link
      href={`/transactions/new?duplicateId=${encodeURIComponent(id)}`}
      aria-label="Duplikat transaksi"
      title="Duplikat transaksi"
      className={className || "btn-secondary h-8 gap-1 px-2 text-xs"}
    >
      <Copy size={13} className={label ? "mr-1.5 inline-block" : ""} />
      {label}
    </Link>
  );
}
