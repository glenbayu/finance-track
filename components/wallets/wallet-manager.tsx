"use client";

import { useState, useMemo } from "react";
import FormSelect from "@/components/ui/form-select";
import SubmitButton from "@/components/ui/submit-button";
import CurrencyAmount from "@/components/ui/currency-amount";
import Link from "next/link";
import { Plus, Edit2, Trash2, Wallet, Landmark, HandCoins, X, ArrowRightLeft, SlidersHorizontal } from "lucide-react";
import ConfirmationModal from "@/components/ui/confirmation-modal";

type WalletRow = {
  id: string;
  name: string;
  type: string;
  usageCount: number;
  balance: number;
};

type WalletManagerProps = {
  wallets: WalletRow[];
  createAction: (formData: FormData) => Promise<void>;
  editAction: (formData: FormData) => Promise<void>;
  deleteAction: (formData: FormData) => Promise<void>;
  adjustAction: (formData: FormData) => Promise<void>;
};

const WALLET_TYPES = [
  { value: "cash", label: "Cash / Tunai" },
  { value: "bank", label: "Bank & E-Wallet" },
  { value: "receivable", label: "Saldo Tertahan / Piutang" },
];

function getWalletIcon(type: string) {
  switch (type) {
    case "cash":
      return <Wallet size={20} className="text-emerald-600 dark:text-emerald-400" />;
    case "bank":
      return <Landmark size={20} className="text-blue-600 dark:text-blue-400" />;
    case "receivable":
      return <HandCoins size={20} className="text-amber-600 dark:text-amber-400" />;
    default:
      return <Wallet size={20} className="text-slate-600 dark:text-slate-400" />;
  }
}

function formatRupiahInput(value: string) {
  const numeric = value.replace(/\D/g, "");
  if (!numeric) return "";
  return new Intl.NumberFormat("id-ID").format(Number(numeric));
}

export default function WalletManager({ wallets, createAction, editAction, deleteAction, adjustAction }: WalletManagerProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<WalletRow | null>(null);
  const [walletToDelete, setWalletToDelete] = useState<WalletRow | null>(null);
  
  // Adjust balance modal states
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [walletToAdjust, setWalletToAdjust] = useState<WalletRow | null>(null);
  const [adjustAmountDisplay, setAdjustAmountDisplay] = useState("");
  
  const [errorMsg, setErrorMsg] = useState("");

  const groupedWallets = useMemo(() => {
    const groups: Record<string, WalletRow[]> = {
      cash: [],
      bank: [],
      receivable: [],
      other: [],
    };
    wallets.forEach((w) => {
      if (w.type === "cash" || w.type === "bank" || w.type === "receivable") {
        groups[w.type].push(w);
      } else {
        groups.other.push(w);
      }
    });
    return groups;
  }, [wallets]);

  const openCreateModal = () => {
    setEditingWallet(null);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const openEditModal = (wallet: WalletRow) => {
    setEditingWallet(wallet);
    setErrorMsg("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingWallet(null);
    setErrorMsg("");
  };

  const openAdjustModal = (wallet: WalletRow) => {
    setWalletToAdjust(wallet);
    setAdjustAmountDisplay(formatRupiahInput(String(Math.abs(wallet.balance))));
    setErrorMsg("");
    setIsAdjustModalOpen(true);
  };

  const closeAdjustModal = () => {
    setIsAdjustModalOpen(false);
    setWalletToAdjust(null);
    setErrorMsg("");
  };

  const handleSubmit = async (formData: FormData) => {
    setErrorMsg("");
    try {
      if (editingWallet) {
        formData.append("id", editingWallet.id);
        await editAction(formData);
      } else {
        await createAction(formData);
      }
      closeModal();
    } catch (error: any) {
      setErrorMsg(error.message || "Terjadi kesalahan");
    }
  };

  const handleAdjustSubmit = async (formData: FormData) => {
    setErrorMsg("");
    try {
      if (walletToAdjust) {
        formData.append("id", walletToAdjust.id);
        formData.append("current_balance", String(walletToAdjust.balance));
        await adjustAction(formData);
      }
      closeAdjustModal();
    } catch (error: any) {
      setErrorMsg(error.message || "Terjadi kesalahan");
    }
  };

  const renderWalletList = (title: string, list: WalletRow[]) => {
    if (list.length === 0) return null;
    return (
      <div className="mb-6">
        <h3 className="mb-3 text-sm font-semibold text-slate-600 dark:text-slate-300">{title} ({list.length})</h3>
        <div className="space-y-3">
          {list.map((wallet) => (
            <div key={wallet.id} className="soft-inset flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                  {getWalletIcon(wallet.type)}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 dark:text-slate-100">{wallet.name}</p>
                  <div className={`mt-1 text-xl font-bold ${wallet.balance < 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                    <CurrencyAmount amountIDR={wallet.balance} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {wallet.usageCount > 0 ? `${wallet.usageCount} transaksi` : "Belum dipakai"}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 md:border-t-0 md:pt-0 dark:border-slate-800">
                <Link 
                  href={`/transactions/new?type=transfer&source_id=${wallet.id}`}
                  className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition-colors dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50"
                >
                  <ArrowRightLeft size={14} /> Pindah Saldo
                </Link>
                <button
                  type="button"
                  onClick={() => openAdjustModal(wallet)}
                  className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <SlidersHorizontal size={14} /> Sesuaikan Saldo
                </button>
                <div className="ml-auto flex items-center gap-1 md:ml-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(wallet)}
                    className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-slate-800 dark:hover:text-slate-100 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalletToDelete(wallet)}
                    className="rounded-lg p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="section-card flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-xl font-semibold">Daftar Dompet</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Pusat kontrol sebaran saldo Anda.
            </p>
          </div>
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Tambah Dompet
          </button>
        </div>

        <div>
          {renderWalletList("Cash / Tunai", groupedWallets.cash)}
          {renderWalletList("Bank & E-Wallet", groupedWallets.bank)}
          {renderWalletList("Saldo Tertahan / Piutang", groupedWallets.receivable)}
          {renderWalletList("Lainnya", groupedWallets.other)}
          
          {wallets.length === 0 && (
            <div className="text-center py-10 text-slate-500 dark:text-slate-400">
              <Wallet size={48} className="mx-auto mb-3 opacity-20" />
              <p>Belum ada dompet.</p>
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay z-[100] flex items-center justify-center">
          <div className="modal-card relative w-full max-w-md" role="dialog" aria-modal="true">
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-slate-100">
              {editingWallet ? "Edit Dompet" : "Tambah Dompet Baru"}
            </h3>
            
            {errorMsg && (
              <div className="mb-4 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/25 dark:text-rose-300">
                {errorMsg}
              </div>
            )}

            <form action={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Nama Dompet</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingWallet?.name || ""}
                  placeholder="Contoh: BCA, OVO, Dompet Fisik"
                  className="input-base"
                  required
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Tipe Dompet</label>
                <FormSelect
                  name="type"
                  defaultValue={editingWallet?.type || "cash"}
                  options={WALLET_TYPES}
                  required
                />
              </div>

              <div className="pt-2">
                <SubmitButton className="btn-primary w-full py-3" pendingText="Menyimpan...">
                  {editingWallet ? "Simpan Perubahan" : "Simpan Dompet"}
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {isAdjustModalOpen && (
        <div className="modal-overlay z-[100] flex items-center justify-center">
          <div className="modal-card relative w-full max-w-md" role="dialog" aria-modal="true">
            <button
              onClick={closeAdjustModal}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X size={20} />
            </button>
            <h3 className="mb-1 text-lg font-bold text-slate-900 dark:text-slate-100">
              Sesuaikan Saldo
            </h3>
            <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
              Koreksi saldo <strong>{walletToAdjust?.name}</strong> tanpa mempengaruhi laporan pengeluaran.
            </p>
            
            {errorMsg && (
              <div className="mb-4 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/25 dark:text-rose-300">
                {errorMsg}
              </div>
            )}

            <form action={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">Saldo Riil (Saat ini)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="Contoh: 1.000.000"
                  value={adjustAmountDisplay}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "");
                    setAdjustAmountDisplay(formatRupiahInput(raw));
                  }}
                  className="input-base text-lg font-bold"
                  required
                />
                <input
                  type="hidden"
                  name="balance"
                  value={adjustAmountDisplay.replace(/\D/g, "")}
                />
              </div>

              <div className="pt-2">
                <SubmitButton className="btn-primary w-full py-3" pendingText="Menyesuaikan...">
                  Simpan Saldo Aktual
                </SubmitButton>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!walletToDelete}
        onClose={() => setWalletToDelete(null)}
        title="Hapus Dompet"
        description={`Apakah Anda yakin ingin menghapus dompet "${walletToDelete?.name}"?`}
        icon={<div className="flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400"><Trash2 size={24} /></div>}
      >
        {walletToDelete?.usageCount && walletToDelete.usageCount > 0 ? (
          <div className="mb-6 rounded-lg bg-amber-50 p-4 text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
            <p className="text-sm font-medium">Dompet tidak dapat dihapus</p>
            <p className="mt-1 text-xs">Dompet ini sedang digunakan dalam {walletToDelete.usageCount} transaksi. Harap pindahkan atau hapus transaksi tersebut terlebih dahulu.</p>
          </div>
        ) : (
          <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">Tindakan ini tidak dapat dibatalkan.</p>
        )}
        
        <div className="flex gap-3">
          <button type="button" onClick={() => setWalletToDelete(null)} className="btn-secondary flex-1">
            Batal
          </button>
          {!walletToDelete?.usageCount && (
            <form action={async () => {
              if (walletToDelete) {
                const fd = new FormData();
                fd.append("id", walletToDelete.id);
                await deleteAction(fd);
                setWalletToDelete(null);
              }
            }} className="flex-1">
              <SubmitButton className="btn-primary w-full bg-rose-600 hover:bg-rose-700 dark:text-white" pendingText="Menghapus...">
                Hapus
              </SubmitButton>
            </form>
          )}
        </div>
      </ConfirmationModal>
    </>
  );
}
