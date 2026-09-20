"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Camera,
  Upload,
  Calendar,
  Wallet as WalletIcon,
  Tag,
  FileText,
  Trash2,
  Copy,
  Check,
  Receipt,
  Scan,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner"; // <-- Notifikasi Toast
import { useApp } from "@/context/AppContext";
import { Transaction, TransactionType } from "@/types";
import { formatMoneyInput, parseSmartMoneyInput } from "@/utils/formatters";
import { IconRenderer } from "@/components/common/IconRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTransaction?: Transaction | null;
  initialScanData?: {
    merchantName?: string;
    totalAmount?: number;
    date?: string;
  } | null;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialTransaction,
  initialScanData,
}) => {
  const {
    wallets,
    categories,
    addTransaction,
    editTransaction,
    deleteTransaction,
    duplicateTransaction,
    colorPreset,
  } = useApp();

  const [type, setType] = useState<TransactionType>("expense");
  const [displayAmount, setDisplayAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [walletId, setWalletId] = useState("");
  const [toWalletId, setToWalletId] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [receiptImage, setReceiptImage] = useState<string | undefined>(undefined);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Konfirmasi Hapus Khusus
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialTransaction) {
      setType(initialTransaction.type);
      setDisplayAmount(formatMoneyInput(initialTransaction.amount));
      setCategoryId(initialTransaction.categoryId || "");
      setWalletId(initialTransaction.walletId);
      setToWalletId(initialTransaction.toWalletId || "");
      setDate(initialTransaction.date);
      setDescription(initialTransaction.description);
      setReceiptImage(initialTransaction.receiptImage);
    } else if (initialScanData) {
      setType("expense");
      setDisplayAmount(
        initialScanData.totalAmount
          ? formatMoneyInput(initialScanData.totalAmount)
          : ""
      );
      setCategoryId(categories.find((c) => c.type === "expense")?.id || "");
      setWalletId(wallets[0]?.id || "");
      setToWalletId("");
      setDate(initialScanData.date || new Date().toISOString().slice(0, 16));
      setDescription(
        initialScanData.merchantName
          ? `Belanja di ${initialScanData.merchantName}`
          : ""
      );
      setReceiptImage(undefined);
    } else {
      setType("expense");
      setDisplayAmount("");
      const defaultExpCat = categories.find((c) => c.type === "expense");
      setCategoryId(defaultExpCat?.id || "");
      setWalletId(wallets[0]?.id || "");
      setToWalletId(wallets[1]?.id || "");
      const now = new Date();
      const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDate(localISO);
      setDescription("");
      setReceiptImage(undefined);
    }
    setError("");
    setIsDeleteConfirmOpen(false);
  }, [initialTransaction, initialScanData, isOpen, categories, wallets]);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const numeric = parseSmartMoneyInput(rawVal);
    setDisplayAmount(numeric > 0 ? formatMoneyInput(numeric) : "");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran foto struk maksimal 5MB");
      toast.error("Ukuran foto struk maksimal 5MB!");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptImage(reader.result as string);
      toast.success("Foto struk berhasil dilampirkan!");
    };
    reader.readAsDataURL(file);
  };

  // 1. Simpan Tambah / Edit Transaksi dengan Toast
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseSmartMoneyInput(displayAmount);

    if (numericAmount <= 0) {
      setError("Harap masukkan nominal uang yang valid!");
      toast.error("Nominal uang harus lebih dari 0!");
      return;
    }

    if (!walletId) {
      setError("Harap pilih dompet / rekening!");
      toast.error("Harap pilih dompet asal!");
      return;
    }

    if (type === "transfer" && (!toWalletId || toWalletId === walletId)) {
      setError("Harap pilih dompet tujuan transfer yang berbeda!");
      toast.error("Dompet tujuan transfer harus berbeda dengan dompet asal!");
      return;
    }

    if (type !== "transfer" && !categoryId) {
      setError("Harap tentukan kategori transaksi!");
      toast.error("Harap pilih kategori transaksi!");
      return;
    }

    const finalDesc =
      description.trim() ||
      (type === "transfer" ? "Transfer Saldo" : "Transaksi");

    setIsSubmitting(true);
    try {
      if (initialTransaction) {
        await editTransaction(initialTransaction.id, {
          type,
          amount: numericAmount,
          categoryId: type !== "transfer" ? categoryId : undefined,
          walletId,
          toWalletId: type === "transfer" ? toWalletId : undefined,
          date,
          description: finalDesc,
          receiptImage,
        });
        toast.success("Perubahan transaksi berhasil disimpan!");
      } else {
        await addTransaction({
          type,
          amount: numericAmount,
          categoryId: type !== "transfer" ? categoryId : undefined,
          walletId,
          toWalletId: type === "transfer" ? toWalletId : undefined,
          date,
          description: finalDesc,
          receiptImage,
        });
        toast.success("Transaksi berhasil dicatat!");
      }

      onClose();
    } catch (err: any) {
      toast.error("Gagal menyimpan transaksi ke server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Duplikasi Transaksi
  const handleDuplicate = () => {
    if (!initialTransaction) return;
    duplicateTransaction(initialTransaction.id);
    toast.success("Transaksi berhasil disalin!");
    onClose();
  };

  // 3. Eksekusi Hapus Transaksi dengan Dialog
  const handleConfirmDelete = async () => {
    if (!initialTransaction || isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteTransaction(initialTransaction.id);
      toast.info(`Transaksi "${initialTransaction.description}" telah dihapus.`);
      setIsDeleteConfirmOpen(false);
      onClose();
    } catch (err) {
      toast.error("Gagal menghapus transaksi.");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredCategories = categories.filter(
    (c) => c.type === (type === "income" ? "income" : "expense")
  );

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
        <div className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 max-h-[92vh] flex flex-col animate-slideUp">
          {/* Modal Header */}
          <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
                {initialTransaction ? "Edit Transaksi" : "Catat Transaksi Baru"}
              </h2>
              <p className="text-xs text-stone-400">
                {initialTransaction
                  ? "Perbarui detail mutasi keuangan Anda"
                  : "Pencatatan alur dana & struk belanja"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Form Body */}
          <form
            onSubmit={handleSubmit}
            className="p-4 overflow-y-auto space-y-4 flex-1 scrollbar-none"
          >
            {error && (
              <Alert variant="destructive" className="py-2.5">
                <AlertDescription className="text-xs font-semibold">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {/* 1. Tipe Transaksi Tabs */}
            <Tabs
              value={type}
              onValueChange={(val) => {
                setType(val as TransactionType);
                // Sesuaikan kategori default jika berganti antara pemasukan/pengeluaran
                if (val !== "transfer") {
                  const newCat = categories.find((c) => c.type === val);
                  if (newCat) setCategoryId(newCat.id);
                }
              }}
            >
              <TabsList className="w-full grid grid-cols-3 bg-stone-100 dark:bg-stone-800">
                <TabsTrigger value="expense" className="text-xs font-bold">
                  Pengeluaran
                </TabsTrigger>
                <TabsTrigger value="income" className="text-xs font-bold">
                  Pemasukan
                </TabsTrigger>
                <TabsTrigger value="transfer" className="text-xs font-bold">
                  Transfer
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* 2. Nominal Uang */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Nominal Uang
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
                  Rp
                </span>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={displayAmount}
                  onChange={handleAmountChange}
                  placeholder="0"
                  className="pl-11 pr-4 py-3 h-12 text-xl font-black font-mono text-stone-900 dark:text-white"
                  autoFocus={!initialTransaction}
                />
              </div>
            </div>

            {/* 3. Pilihan Dompet */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  {type === "transfer" ? "Dari Dompet (Sumber)" : "Dompet / Rekening"}
                </label>
                <Select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} (Saldo: {w.balance.toLocaleString("id-ID")})
                    </option>
                  ))}
                </Select>
              </div>

              {type === "transfer" && (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    Ke Dompet (Tujuan)
                  </label>
                  <Select
                    value={toWalletId}
                    onChange={(e) => setToWalletId(e.target.value)}
                  >
                    <option value="">Pilih Dompet Tujuan...</option>
                    {wallets
                      .filter((w) => w.id !== walletId)
                      .map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} (Saldo: {w.balance.toLocaleString("id-ID")})
                        </option>
                      ))}
                  </Select>
                </div>
              )}
            </div>

            {/* 4. Pilihan Kategori */}
            {type !== "transfer" && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Kategori
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 scrollbar-none">
                  {filteredCategories.map((c) => {
                    const isSelected = categoryId === c.id;
                    return (
                      <button
                        type="button"
                        key={c.id}
                        onClick={() => setCategoryId(c.id)}
                        className={`flex flex-col items-center p-2 rounded-xl border text-center transition ${
                          isSelected
                            ? "border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-900 dark:text-teal-200 ring-2 ring-teal-500/20"
                            : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300"
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white mb-1 shadow-2xs"
                          style={{ backgroundColor: c.color }}
                        >
                          <IconRenderer name={c.iconName} size={14} />
                        </div>
                        <span className="text-[10px] font-semibold line-clamp-1">
                          {c.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 5. Tanggal & Jam */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Tanggal & Jam
              </label>
              <Input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="text-xs font-semibold h-10 font-mono"
              />
            </div>

            {/* 6. Deskripsi / Catatan */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Deskripsi / Catatan
              </label>
              <Input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: Makan Siang Nasi Padang, Belanja..."
                className="text-xs h-10"
              />
            </div>

            {/* 7. Foto Struk Belanja */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Foto Struk Belanja (Opsional)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <input
                  type="file"
                  ref={cameraInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 text-xs font-semibold gap-1.5 h-10"
                >
                  <Camera className="w-4 h-4 text-teal-600" />
                  <span>Kamera HP</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 text-xs font-semibold gap-1.5 h-10"
                >
                  <Upload className="w-4 h-4 text-teal-600" />
                  <span>Pilih Galeri</span>
                </Button>
              </div>

              {receiptImage && (
                <div className="mt-2.5 relative rounded-2xl overflow-hidden border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={receiptImage}
                      alt="Preview Struk"
                      className="w-12 h-12 object-cover rounded-lg"
                    />
                    <div>
                      <p className="text-xs font-bold text-stone-800 dark:text-stone-200">
                        Struk Terlampir
                      </p>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        Tersimpan di Cloud
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReceiptImage(undefined)}
                    className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 transition"
                    title="Hapus Lampiran"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Tombol Aksi Bawah */}
            <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2">
              {initialTransaction && (
                <>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleDuplicate}
                    title="Duplikasi Transaksi"
                    className="h-10 w-10 shrink-0"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setIsDeleteConfirmOpen(true)}
                    className="h-10 w-10 shrink-0 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600"
                    title="Hapus Transaksi"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: `linear-gradient(135deg, ${colorPreset.primaryHex}, ${colorPreset.secondaryHex})`,
                  boxShadow: `0 8px 20px -4px ${colorPreset.primaryHex}40`,
                }}
                className="flex-1 text-white font-bold text-xs h-10 hover:brightness-110"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan ke Cloud...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>
                      {initialTransaction ? "Simpan Perubahan" : "Simpan Transaksi"}
                    </span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal Konfirmasi Hapus Transaksi (Shadcn Dialog) */}
      <Dialog
        open={isDeleteConfirmOpen}
        onOpenChange={(open) => !open && !isDeleting && setIsDeleteConfirmOpen(false)}
      >
        <DialogContent className="max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <DialogHeader>
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
              Hapus Transaksi Ini?
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-400 pt-1">
              Apakah Anda yakin ingin menghapus catatan{" "}
              <strong className="text-stone-900 dark:text-stone-100">
                "{initialTransaction?.description}"
              </strong>{" "}
              sebesar{" "}
              <strong className="text-stone-900 dark:text-stone-100 font-mono">
                {initialTransaction ? formatRupiah(initialTransaction.amount) : ""}
              </strong>
              ? Saldo dompet Anda otomatis akan dikembalikan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-3 sm:justify-start">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setIsDeleteConfirmOpen(false)}
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
    </>
  );
};
