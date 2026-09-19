"use client";

import React, { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Sliders,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner"; // <-- Notifikasi Toast
import { useApp } from "@/context/AppContext";
import { Wallet, WalletCategory } from "@/types";
import {
  formatRupiah,
  formatMoneyInput,
  parseSmartMoneyInput,
} from "@/utils/formatters";
import { IconRenderer } from "@/components/common/IconRenderer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export const WalletsView: React.FC = () => {
  const {
    wallets,
    addWallet,
    editWallet,
    deleteWallet,
    reconcileWalletBalance,
    hideBalances,
    user,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete modal state
  const [deletingWallet, setDeletingWallet] = useState<Wallet | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [category, setCategory] = useState<WalletCategory>("bank");
  const [balanceInput, setBalanceInput] = useState("");
  const [color, setColor] = useState("#2563eb");
  const [iconName, setIconName] = useState("CreditCard");
  const [institution, setInstitution] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  // Reconcile modal state
  const [reconcileWallet, setReconcileWallet] = useState<Wallet | null>(null);
  const [reconcileAmountInput, setReconcileAmountInput] = useState("");
  const [reconcileNote, setReconcileNote] = useState("");
  const [isReconciling, setIsReconciling] = useState(false);

  const colorOptions = [
    "#2563eb", // Blue
    "#0d9488", // Teal
    "#10b981", // Emerald
    "#f59e0b", // Amber
    "#ec4899", // Pink
    "#8b5cf6", // Violet
    "#ef4444", // Red
    "#06b6d4", // Cyan
    "#64748b", // Slate
  ];

  const iconOptions = [
    { name: "CreditCard", label: "Kartu Bank" },
    { name: "Building2", label: "Bank Pusat" },
    { name: "Smartphone", label: "E-Wallet" },
    { name: "Banknote", label: "Uang Tunai" },
    { name: "TrendingUp", label: "Investasi" },
    { name: "Coins", label: "Koin" },
    { name: "ShieldCheck", label: "Tabungan Aman" },
  ];

  const openCreateModal = () => {
    setEditingWallet(null);
    setName("");
    setCategory("bank");
    setBalanceInput("");
    setColor("#2563eb");
    setIconName("CreditCard");
    setInstitution("");
    setAccountNumber("");
    setIsModalOpen(true);
  };

  const openEditModal = (w: Wallet) => {
    setEditingWallet(w);
    setName(w.name);
    setCategory(w.category);
    setBalanceInput(formatMoneyInput(w.balance));
    setColor(w.color);
    setIconName(w.iconName);
    setInstitution(w.institution || "");
    setAccountNumber(w.accountNumber || "");
    setIsModalOpen(true);
  };

  // 1. Simpan Tambah / Edit Dompet (Async dengan Notifikasi)
  const handleSaveWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const numericBalance = parseSmartMoneyInput(balanceInput);

      if (editingWallet) {
        await editWallet(editingWallet.id, {
          name: name.trim(),
          category,
          balance: numericBalance,
          color,
          iconName,
          institution: institution.trim(),
          accountNumber: accountNumber.trim(),
        });
        toast.success(`Akun "${name.trim()}" berhasil diperbarui!`);
      } else {
        await addWallet({
          name: name.trim(),
          category,
          balance: numericBalance,
          color,
          iconName,
          institution: institution.trim(),
          accountNumber: accountNumber.trim(),
        });
        toast.success(`Akun "${name.trim()}" berhasil ditambahkan!`);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Gagal menyimpan dompet ke server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Hapus Dompet (Async dengan Notifikasi)
  const handleConfirmDelete = async () => {
    if (!deletingWallet || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteWallet(deletingWallet.id);
      toast.info(`Dompet "${deletingWallet.name}" telah dihapus.`);
      setDeletingWallet(null);
    } catch (err: any) {
      toast.error("Gagal menghapus dompet dari server.");
    } finally {
      setIsDeleting(false);
    }
  };

  const openReconcileModal = (w: Wallet) => {
    setReconcileWallet(w);
    setReconcileAmountInput(formatMoneyInput(w.balance));
    setReconcileNote("");
  };

  // 3. Simpan Penyesuaian Saldo (Async dengan Notifikasi)
  const handleSaveReconcile = async () => {
    if (!reconcileWallet || isReconciling) return;
    setIsReconciling(true);
    try {
      const newBal = parseSmartMoneyInput(reconcileAmountInput);
      await reconcileWalletBalance(reconcileWallet.id, newBal, reconcileNote);
      toast.success(`Saldo ${reconcileWallet.name} berhasil disesuaikan!`);
      setReconcileWallet(null);
    } catch (err: any) {
      toast.error("Gagal menyesuaikan saldo di server.");
    } finally {
      setIsReconciling(false);
    }
  };

  return (
    <div className="space-y-4 pb-28 animate-fadeIn">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
            Multi-Dompet & Rekening
          </h2>
          <p className="text-xs text-stone-400">
            Kelola saldo kas, rekening bank, e-wallet, dan investasi
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          size="sm"
          className="gap-1.5 font-bold text-xs bg-teal-600 hover:bg-teal-500 text-white"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Tambah Akun</span>
        </Button>
      </div>

      {/* Wallets List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {wallets.map((w) => (
          <Card
            key={w.id}
            className="p-4 flex flex-col justify-between relative overflow-hidden bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800"
          >
            {/* Top Accent Line */}
            <div
              className="absolute top-0 left-0 right-0 h-1.5"
              style={{ backgroundColor: w.color }}
            />

            <div>
              <div className="flex items-center justify-between mb-3 mt-1">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs"
                    style={{ backgroundColor: w.color }}
                  >
                    <IconRenderer name={w.iconName} size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
                      {w.name}
                    </h3>
                    <Badge
                      variant="outline"
                      className="text-[10px] py-0 px-1.5 mt-0.5 font-medium"
                    >
                      {w.category === "cash"
                        ? "Uang Tunai"
                        : w.category === "bank"
                          ? "Rekening Bank"
                          : w.category === "ewallet"
                            ? "E-Wallet"
                            : "Investasi"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openReconcileModal(w)}
                    className="h-8 w-8 text-stone-400 hover:text-teal-600 hover:bg-stone-100 dark:hover:bg-stone-800"
                    title="Sesuaikan Saldo Riil (Reconcile)"
                  >
                    <Sliders className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditModal(w)}
                    className="h-8 w-8 text-stone-400 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800"
                    title="Edit Dompet"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  {wallets.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingWallet(w)}
                      className="h-8 w-8 text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Hapus Dompet"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div className="mt-2">
                <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">
                  Saldo Saat Ini
                </span>
                <p className="text-xl font-black font-mono text-stone-900 dark:text-white mt-0.5">
                  {formatRupiah(w.balance, hideBalances, user.baseCurrency)}
                </p>
              </div>
            </div>

            <div className="pt-3 mt-3 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between text-xs text-stone-500">
              <span className="font-semibold">
                {w.institution || "Independen"}
              </span>
              {w.accountNumber && (
                <span className="font-mono text-[11px] bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded-md text-stone-400">
                  {w.accountNumber}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Modal Tambah / Edit Dompet */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
              {editingWallet ? "Edit Akun Dompet" : "Tambah Dompet Baru"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveWallet} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-stone-400">
                Nama Dompet / Akun
              </label>
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: BCA Prioritas, GoPay Utama, Kas Tunai..."
                className="text-xs font-semibold h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-stone-400">
                  Kategori
                </label>
                <Select
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as WalletCategory)
                  }
                >
                  <option value="bank">Rekening Bank</option>
                  <option value="ewallet">E-Wallet</option>
                  <option value="cash">Uang Tunai</option>
                  <option value="investment">Investasi</option>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-stone-400">
                  Saldo (Rp)
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={balanceInput}
                  onChange={(e) =>
                    setBalanceInput(formatMoneyInput(e.target.value))
                  }
                  placeholder="0"
                  className="text-xs font-bold font-mono h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-stone-400">
                  Instansi / Bank
                </label>
                <Input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  placeholder="BCA, Mandiri, GoTo, Bibit..."
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-stone-400">
                  Nomor Rekening (Opsional)
                </label>
                <Input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="1234-5678-90"
                  className="text-xs font-mono h-9"
                />
              </div>
            </div>

            {/* Pilihan Warna */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-stone-400">
                Warna Identifikasi
              </label>
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 shrink-0 rounded-full transition-transform ${
                      color === c
                        ? "scale-125 ring-2 ring-stone-900 dark:ring-white ring-offset-2 ring-offset-stone-900"
                        : ""
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Pilihan Ikon */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-stone-400">
                Ikon Akun
              </label>
              <div className="grid grid-cols-4 gap-2">
                {iconOptions.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => setIconName(item.name)}
                    className={`p-2 rounded-xl border text-center flex flex-col items-center gap-1 transition ${
                      iconName === item.name
                        ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-600"
                        : "border-stone-200 dark:border-stone-800 text-stone-500"
                    }`}
                  >
                    <IconRenderer name={item.name} size={18} />
                    <span className="text-[9px] font-semibold truncate w-full">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setIsModalOpen(false)}
                className="flex-1 text-xs font-semibold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 font-bold text-xs shadow-md bg-teal-600 hover:bg-teal-500 text-white"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan ke Server...</span>
                  </div>
                ) : editingWallet ? (
                  "Simpan Perubahan"
                ) : (
                  "Simpan Akun Baru"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Penyesuaian Saldo Riil (Reconcile) */}
      <Dialog
        open={!!reconcileWallet}
        onOpenChange={(open) =>
          !open && !isReconciling && setReconcileWallet(null)
        }
      >
        <DialogContent className="max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-teal-600">
              <Sliders className="w-5 h-5" />
              <span>Penyesuaian Saldo Riil</span>
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-stone-500">
            Ubah saldo <strong>{reconcileWallet?.name}</strong> langsung agar
            cocok dengan uang riil di rekening tanpa mencatat transaksi palsu.
          </p>

          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-stone-400">
                Saldo Riil Baru (Rp)
              </label>
              <Input
                type="text"
                inputMode="numeric"
                value={reconcileAmountInput}
                onChange={(e) =>
                  setReconcileAmountInput(formatMoneyInput(e.target.value))
                }
                className="text-base font-extrabold font-mono h-11"
                autoFocus
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isReconciling}
                onClick={() => setReconcileWallet(null)}
                className="flex-1 text-xs font-semibold"
              >
                Batal
              </Button>
              <Button
                type="button"
                disabled={isReconciling}
                onClick={handleSaveReconcile}
                className="flex-1 text-xs font-bold shadow-md bg-teal-600 hover:bg-teal-500 text-white"
              >
                {isReconciling ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </div>
                ) : (
                  "Terapkan Saldo"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Hapus Dompet */}
      <Dialog
        open={!!deletingWallet}
        onOpenChange={(open) => !open && !isDeleting && setDeletingWallet(null)}
      >
        <DialogContent className="max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <DialogHeader>
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
              Hapus Akun Dompet?
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-400">
              Apakah Anda yakin ingin menghapus dompet{" "}
              <strong className="text-stone-900 dark:text-stone-100">
                "{deletingWallet?.name}"
              </strong>
              {deletingWallet && deletingWallet.balance > 0 && (
                <>
                  {" "}
                  dengan sisa saldo{" "}
                  <strong className="text-stone-900 dark:text-stone-100 font-mono">
                    {formatRupiah(
                      deletingWallet.balance,
                      hideBalances,
                      user.baseCurrency,
                    )}
                  </strong>
                </>
              )}
              ? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-3 sm:justify-start">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeletingWallet(null)}
              className="flex-1 text-xs font-semibold"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="flex-1 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
            >
              {isDeleting ? (
                <div className="flex items-center justify-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menghapus...</span>
                </div>
              ) : (
                "Ya, Hapus"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
