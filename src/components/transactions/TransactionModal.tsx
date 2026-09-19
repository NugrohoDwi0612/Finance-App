"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Camera,
  Upload,
  Calendar,
  Wallet,
  Tag,
  FileText,
  Trash2,
  Copy,
  Check,
  Receipt,
  Scan,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Transaction, TransactionType } from "../../types";
import { formatMoneyInput, parseSmartMoneyInput } from "../../utils/formatters";
import { IconRenderer } from "../common/IconRenderer";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { Alert, AlertDescription } from "../ui/alert";
import { Select } from "../ui/select";

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
  const [receiptImage, setReceiptImage] = useState<string | undefined>(
    undefined,
  );
  const [error, setError] = useState("");

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
          : "",
      );
      setCategoryId(categories.find((c) => c.type === "expense")?.id || "");
      setWalletId(wallets[0]?.id || "");
      setToWalletId("");
      setDate(initialScanData.date || new Date().toISOString().slice(0, 16));
      setDescription(
        initialScanData.merchantName
          ? `Belanja di ${initialScanData.merchantName}`
          : "",
      );
      setReceiptImage(undefined);
    } else {
      // Default new transaction
      setType("expense");
      setDisplayAmount("");
      const defaultExpCat = categories.find((c) => c.type === "expense");
      setCategoryId(defaultExpCat?.id || "");
      setWalletId(wallets[0]?.id || "");
      setToWalletId(wallets[1]?.id || "");
      const now = new Date();
      // YYYY-MM-DDTHH:mm
      const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
      setDate(localISO);
      setDescription("");
      setReceiptImage(undefined);
    }
    setError("");
  }, [initialTransaction, initialScanData, isOpen, categories, wallets]);

  if (!isOpen) return null;

  // Handle Smart Money Input with auto Rupiah formatting
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const numeric = parseSmartMoneyInput(rawVal);
    setDisplayAmount(numeric > 0 ? formatMoneyInput(numeric) : "");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran foto struk maksimal 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setReceiptImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numericAmount = parseSmartMoneyInput(displayAmount);

    if (numericAmount <= 0) {
      setError("Harap masukkan nominal uang yang valid!");
      return;
    }

    if (!walletId) {
      setError("Harap pilih dompet / rekening!");
      return;
    }

    if (type === "transfer" && (!toWalletId || toWalletId === walletId)) {
      setError("Harap pilih dompet tujuan transfer yang berbeda!");
      return;
    }

    if (type !== "transfer" && !categoryId) {
      setError("Harap tentukan kategori transaksi!");
      return;
    }

    const finalDesc =
      description.trim() ||
      (type === "transfer" ? "Transfer Saldo" : "Transaksi");

    if (initialTransaction) {
      editTransaction(initialTransaction.id, {
        type,
        amount: numericAmount,
        categoryId: type !== "transfer" ? categoryId : undefined,
        walletId,
        toWalletId: type === "transfer" ? toWalletId : undefined,
        date,
        description: finalDesc,
        receiptImage,
      });
    } else {
      addTransaction({
        type,
        amount: numericAmount,
        categoryId: type !== "transfer" ? categoryId : undefined,
        walletId,
        toWalletId: type === "transfer" ? toWalletId : undefined,
        date,
        description: finalDesc,
        receiptImage,
      });
    }

    onClose();
  };

  const filteredCategories = categories.filter(
    (c) => c.type === (type === "income" ? "income" : "expense"),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white dark:bg-stone-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-stone-200 dark:border-stone-800 max-h-[92vh] flex flex-col animate-slideUp">
        {/* Modal Header */}
        <div className="p-4 border-b border-stone-100 dark:border-stone-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
              {initialTransaction ? "Edit Transaksi" : "Catat Transaksi Baru"}
            </h2>
            <p className="text-xs text-stone-400">
              {initialTransaction
                ? "Perbarui detail transaksi Anda"
                : "Pencatatan cerdas alur dana & struk"}
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
          className="p-4 overflow-y-auto space-y-4 flex-1"
        >
          {/* Error notice */}
          {error && (
            <Alert variant="destructive" className="py-2.5">
              <AlertDescription className="text-xs font-semibold">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* 1. Transaction Type Selector (Expense / Income / Transfer) */}
          <Tabs
            value={type}
            onValueChange={(val) => setType(val as TransactionType)}
          >
            <TabsList className="w-full grid grid-cols-3">
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

          {/* 2. Nominal Input (Smart Auto-formatted Rupiah) */}
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
                className="pl-11 pr-4 py-3 h-12 text-xl font-black text-stone-900 dark:text-white"
                autoFocus={!initialTransaction}
              />
            </div>
          </div>

          {/* 3. Wallets Selection (Source & Destination for transfer) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                {type === "transfer"
                  ? "Dari Dompet (Sumber)"
                  : "Dompet / Rekening"}
              </label>
              <Select
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} (Sisa: {w.balance.toLocaleString("id-ID")})
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
                        {w.name}
                      </option>
                    ))}
                </Select>
              </div>
            )}
          </div>

          {/* 4. Category Selector (Only for Expense & Income) */}
          {type !== "transfer" && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                Kategori
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
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
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white mb-1"
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

          {/* 5. Date & Time (Can Backdate) */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Tanggal & Jam
            </label>
            <Input
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="text-xs font-semibold h-10"
            />
          </div>

          {/* 6. Description / Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
              Deskripsi / Catatan
            </label>
            <Input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Makan Siang Nasi Padang, Belanja Mingguan..."
              className="text-xs h-10"
            />
          </div>

          {/* 7. Upload / Camera Struk Belanja */}
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
                      Tersimpan secara aman
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

          {/* Modal Actions (Save, Duplicate, Delete) */}
          <div className="pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center gap-2">
            {initialTransaction && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    duplicateTransaction(initialTransaction.id);
                    onClose();
                  }}
                  title="Duplikasi Transaksi"
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (confirm("Hapus transaksi ini secara permanen?")) {
                      deleteTransaction(initialTransaction.id);
                      onClose();
                    }
                  }}
                  className="border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600"
                  title="Hapus Transaksi"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}

            <Button
              type="submit"
              style={{
                background: `linear-gradient(135deg, ${colorPreset.primaryHex}, ${colorPreset.secondaryHex})`,
                boxShadow: `0 8px 20px -4px ${colorPreset.primaryHex}40`,
              }}
              className="flex-1 text-white font-bold text-xs hover:brightness-105"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>
                {initialTransaction ? "Simpan Perubahan" : "Simpan Transaksi"}
              </span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
