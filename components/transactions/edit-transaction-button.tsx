import Link from "next/link";
import { Pencil } from "lucide-react";

type Props = {
  id: string;
  className?: string;
  label?: string;
};

export default function EditTransactionButton({ id, className, label }: Props) {
  return (
    <Link
      href={`/transactions/${id}/edit`}
      aria-label="Edit transaksi"
      title="Edit transaksi"
      className={className || "btn-info-icon"}
    >
      <Pencil size={14} className={label ? "mr-1.5 inline-block" : ""} />
      {label}
    </Link>
  );
}
