"use client";

import { useState, useMemo } from "react";
import FormSelect from "@/components/ui/form-select";
import SubmitButton from "@/components/ui/submit-button";
import CurrencyAmount from "@/components/ui/currency-amount";
import Link from "next/link";
import { Plus, Edit2, Trash2, Wallet, Landmark, HandCoins, X, ArrowRightLeft, SlidersHorizontal, ChevronRight } from "lucide-react";
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
        <h3 className="mb-2 px-4 text-[13px] font-semibold tracking-wider uppercase" style={{ color: "var(--lk-text-muted)" }}>
          {title} ({list.length})
        </h3>
        <div className="overflow-hidden rounded-lg shadow-sm" style={{ backgroundColor: "var(--lk-surface)", border: "1px solid var(--lk-border-strong)" }}>
          {list.map((wallet) => (
            <details key={wallet.id} className="group hover-bg-surface-hover" style={{ borderBottom: "1px solid var(--lk-border)" }}>
              <summary className="flex cursor-pointer items-center justify-between gap-4 p-4 outline-none list-none [&::-webkit-details-marker]:hidden">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: "var(--lk-bg)" }}>
                    {getWalletIcon(wallet.type)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold" style={{ color: "var(--lk-text)" }}>{wallet.name}</p>
                    <p className="truncate text-xs mt-0.5" style={{ color: "var(--lk-text-muted)" }}>
                      {wallet.usageCount > 0 ? `${wallet.usageCount} transaksi` : "Belum dipakai"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <div className="text-[15px] font-bold" style={{ color: wallet.balance < 0 ? "var(--lk-expense)" : "var(--lk-text)" }}>
                    <CurrencyAmount amountIDR={wallet.balance} />
                  </div>
                  <div className="transition-transform group-open:rotate-90" style={{ color: "var(--lk-text-muted)" }}>
                    <ChevronRight size={18} />
                  </div>
                </div>
              </summary>
              
              
              <div className="mx-4 mb-4 mt-1 flex flex-wrap gap-2 rounded-lg px-4 pb-4 pt-3" style={{ backgroundColor: "var(--lk-bg)", borderTop: "1px solid var(--lk-border)" }}>
                <Link 
                  href={`/transactions/new?type=transfer&source_id=${wallet.id}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-[13px] font-semibold transition-colors hover:opacity-80"
                  style={{ backgroundColor: "var(--lk-income-dim)", color: "var(--lk-income)" }}
                >
                  <ArrowRightLeft size={14} /> Pindah
                </Link>
                <button
                  type="button"
                  onClick={() => openAdjustModal(wallet)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2.5 text-[13px] font-semibold transition-colors hover:opacity-80"
                  style={{ backgroundColor: "var(--lk-surface)", color: "var(--lk-text)", border: "1px solid var(--lk-border)" }}
                >
                  <SlidersHorizontal size={14} /> Sesuaikan
                </button>
                <div className="flex w-full sm:w-auto items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openEditModal(wallet)}
                    className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-md px-3 py-2.5 text-[13px] font-semibold transition-colors hover:opacity-80"
                    style={{ backgroundColor: "var(--lk-surface)", color: "var(--lk-text)", border: "1px solid var(--lk-border)" }}
                  >
                    <Edit2 size={16} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setWalletToDelete(wallet)}
                    className="flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-md px-3 py-2.5 text-[13px] font-semibold transition-colors hover:opacity-80"
                    style={{ backgroundColor: "var(--lk-expense-dim)", color: "var(--lk-expense)" }}
                  >
                    <Trash2 size={16} /> Hapus
                  </button>
                </div>
              </div>
            </details>
          ))}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-12 items-start">
        {/* Kolom Kiri: Header & Tambah Dompet Baru */}
        <div className="lg:col-span-4">
          <div className="rounded-lg p-5 shadow-sm mx-2 sm:mx-0" style={{ backgroundColor: "var(--lk-surface)", border: "1px solid var(--lk-border-strong)" }}>
            <div className="flex flex-col gap-2 pb-4">
              <h2 className="text-[17px] font-semibold" style={{ color: "var(--lk-text)" }}>Daftar Dompet & Rekening</h2>
              <p className="text-[13px]" style={{ color: "var(--lk-text-muted)" }}>
                Pusat kontrol sebaran saldo Anda.
              </p>
            </div>
            <button onClick={openCreateModal} className="btn-primary flex w-full justify-center items-center gap-2 py-3 rounded-md text-[14px]">
              <Plus size={16} /> Tambah Dompet Baru
            </button>
          </div>
        </div>

        {/* Kolom Kanan: Daftar Dompet Aktif */}
        <div className="lg:col-span-8 space-y-6">
          <div>
            {renderWalletList("Cash / Tunai", groupedWallets.cash)}
            {renderWalletList("Bank & E-Wallet", groupedWallets.bank)}
            {renderWalletList("Saldo Tertahan / Piutang", groupedWallets.receivable)}
            {renderWalletList("Lainnya", groupedWallets.other)}
            
            {wallets.length === 0 && (
              <div className="text-center py-10" style={{ color: "var(--lk-text-muted)" }}>
                <Wallet size={48} className="mx-auto mb-3 opacity-20" />
                <p>Belum ada dompet.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal-overlay z-[100] flex items-center justify-center">
          <div className="modal-card relative w-full max-w-md" role="dialog" aria-modal="true">
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 hover-opacity"
              style={{ color: "var(--lk-text-muted)" }}
            >
              <X size={20} />
            </button>
            <h3 className="mb-4 text-lg font-bold" style={{ color: "var(--lk-text)" }}>
              {editingWallet ? "Edit Dompet" : "Tambah Dompet Baru"}
            </h3>
            
            {errorMsg && (
              <div className="mb-4 rounded p-3 text-sm" style={{ backgroundColor: "var(--lk-expense-dim)", color: "var(--lk-expense)", border: "1px solid var(--lk-expense)" }}>
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
              className="absolute right-4 top-4 hover-opacity"
              style={{ color: "var(--lk-text-muted)" }}
            >
              <X size={20} />
            </button>
            <h3 className="mb-1 text-lg font-bold" style={{ color: "var(--lk-text)" }}>
              Sesuaikan Saldo
            </h3>
            <p className="mb-4 text-sm" style={{ color: "var(--lk-text-muted)" }}>
              Koreksi saldo <strong>{walletToAdjust?.name}</strong> tanpa mempengaruhi laporan pengeluaran.
            </p>
            
            {errorMsg && (
              <div className="mb-4 rounded p-3 text-sm" style={{ backgroundColor: "var(--lk-expense-dim)", color: "var(--lk-expense)", border: "1px solid var(--lk-expense)" }}>
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
        icon={<div className="flex h-12 w-12 items-center justify-center rounded-full" style={{ backgroundColor: "var(--lk-expense-dim)", color: "var(--lk-expense)" }}><Trash2 size={24} /></div>}
      >
        {walletToDelete?.usageCount && walletToDelete.usageCount > 0 ? (
          <div className="mb-6 rounded-lg p-4" style={{ backgroundColor: "#fffbeb", color: "#b45309" }}>
            <p className="text-sm font-medium">Dompet tidak dapat dihapus</p>
            <p className="mt-1 text-xs">Dompet ini sedang digunakan dalam {walletToDelete.usageCount} transaksi. Harap pindahkan atau hapus transaksi tersebut terlebih dahulu.</p>
          </div>
        ) : (
          <p className="mb-6 text-sm" style={{ color: "var(--lk-text-muted)" }}>Tindakan ini tidak dapat dibatalkan.</p>
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
              <SubmitButton className="w-full text-white rounded-md py-2.5 font-semibold transition-colors hover:opacity-80 bg-[var(--lk-expense)]" pendingText="Menghapus...">
                Hapus
              </SubmitButton>
            </form>
          )}
        </div>
      </ConfirmationModal>
    </>
  );
}
