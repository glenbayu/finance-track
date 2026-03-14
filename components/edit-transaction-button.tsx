import Link from "next/link";
import { Pencil } from "lucide-react";

type Props = {
  id: string;
};

export default function EditTransactionButton({ id }: Props) {
  return (
    <Link
      href={`/transactions/${id}/edit`}
      aria-label="Edit transaksi"
      title="Edit transaksi"
      className="btn-info-icon"
    >
      <Pencil size={14} />
    </Link>
  );
}
