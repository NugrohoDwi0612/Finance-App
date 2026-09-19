"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ArrowRightLeft,
  Calendar,
  X,
  Plus,
  Receipt,
  FileSpreadsheet,
  Trash2,
  Copy,
  Edit2,
  SlidersHorizontal,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner"; // <-- Notifikasi Toast
import { useApp } from "@/context/AppContext";
import { Transaction, TransactionType } from "@/types";
import { formatRupiah, formatDateID } from "@/utils/formatters";
import { exportTransactionsToCSV } from "@/utils/exportCsv";
import { IconRenderer } from "@/components/common/IconRenderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface TransactionListViewProps {
  onOpenAddTransaction: () => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const TransactionListView: React.FC<TransactionListViewProps> = ({
  onOpenAddTransaction,
  onSelectTransaction,
}) => {
  const {
    transactions,
    categories,
    wallets,
    hideBalances,
    user,
    colorPreset,
    deleteTransaction,
    duplicateTransaction,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedWalletId, setSelectedWalletId] = useState<string>("all");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("all");
  const [minAmount, setMinAmount] = useState<string>("");
  const [maxAmount, setMaxAmount] = useState<string>("");
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(
    null,
  );

  // State Modal Konfirmasi Hapus Transaksi
  const [deletingTx, setDeletingTx] = useState<Transaction | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Multi-Filter Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      if (
        searchQuery &&
        !tx.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false;
      }

      if (selectedType !== "all" && tx.type !== selectedType) {
        return false;
      }

      if (
        selectedWalletId !== "all" &&
        tx.walletId !== selectedWalletId &&
        tx.toWalletId !== selectedWalletId
      ) {
        return false;
      }

      if (
        selectedCategoryId !== "all" &&
        tx.categoryId !== selectedCategoryId
      ) {
        return false;
      }

      if (minAmount && tx.amount < parseFloat(minAmount)) {
        return false;
      }

      if (maxAmount && tx.amount > parseFloat(maxAmount)) {
        return false;
      }

      return true;
    });
  }, [
    transactions,
    searchQuery,
    selectedType,
    selectedWalletId,
    selectedCategoryId,
    minAmount,
    maxAmount,
  ]);

  // Group by Date
  const groupedTransactions = useMemo(() => {
    const groups: { [dateStr: string]: Transaction[] } = {};
    filteredTransactions.forEach((tx) => {
      const day = tx.date.split("T")[0];
      if (!groups[day]) {
        groups[day] = [];
      }
      groups[day].push(tx);
    });
    return groups;
  }, [filteredTransactions]);

  const activeFilterCount =
    (selectedType !== "all" ? 1 : 0) +
    (selectedWalletId !== "all" ? 1 : 0) +
    (selectedCategoryId !== "all" ? 1 : 0) +
    (minAmount ? 1 : 0) +
    (maxAmount ? 1 : 0);

  const resetFilters = () => {
    setSelectedType("all");
    setSelectedWalletId("all");
    setSelectedCategoryId("all");
    setMinAmount("");
    setMaxAmount("");
    setSearchQuery("");
    toast.info("Filter pencarian telah dibersihkan.");
  };

  // CSV Exporter
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) {
      toast.error("Tidak ada transaksi untuk diekspor!");
      return;
    }

    exportTransactionsToCSV(filteredTransactions, categories, wallets, {
      format: "excel",
      userName: user.name,
      userEmail: user.email,
      currency: user.baseCurrency,
    });
    toast.success("Laporan CSV berhasil diunduh!");
  };

  // Duplikasi Transaksi
  const handleDuplicate = (e: React.MouseEvent, txId: string) => {
    e.stopPropagation();
    duplicateTransaction(txId);
    toast.success("Transaksi berhasil diduplikasi!");
  };

  // Eksekusi Konfirmasi Hapus
  const handleConfirmDelete = async () => {
    if (!deletingTx || isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteTransaction(deletingTx.id);
      toast.info(`Transaksi "${deletingTx.description}" telah dihapus.`);
      setDeletingTx(null);
    } catch (err) {
      toast.error("Gagal menghapus transaksi dari server.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 pb-28 animate-fadeIn">
      {/* Search Bar & Filter Button */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari transaksi, toko, atau catatan..."
            className="pl-9 pr-8 text-xs h-10 bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <Button
          variant={activeFilterCount > 0 ? "default" : "outline"}
          size="icon"
          onClick={() => setShowFilterDrawer(!showFilterDrawer)}
          style={
            activeFilterCount > 0
              ? { backgroundColor: colorPreset.primaryHex }
              : {}
          }
          className="relative h-10 w-10 shrink-0"
          title="Filter & Pencarian Lanjutan"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-teal-500 text-stone-950 font-bold text-[9px] flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={handleExportCSV}
          className="h-10 w-10 shrink-0 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
          title="Download Rekap CSV / Excel"
        >
          <FileSpreadsheet className="w-4 h-4" />
        </Button>
      </div>

      {/* Advanced Filter Drawer */}
      {showFilterDrawer && (
        <Card className="p-4 space-y-3 animate-fadeIn bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800 dark:text-stone-200">
              Filter Canggih
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 h-auto p-0"
            >
              Reset Semua
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-stone-400">
                Jenis Alur Dana
              </label>
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="all">Semua Jenis</option>
                <option value="expense">Pengeluaran</option>
                <option value="income">Pemasukan</option>
                <option value="transfer">Transfer</option>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-stone-400">
                Dompet / Rekening
              </label>
              <Select
                value={selectedWalletId}
                onChange={(e) => setSelectedWalletId(e.target.value)}
              >
                <option value="all">Semua Dompet</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-stone-400">
                Kategori
              </label>
              <Select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
              >
                <option value="all">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-stone-400">
                Rentang Nominal (Rp)
              </label>
              <div className="flex items-center gap-1">
                <Input
                  type="number"
                  placeholder="Min"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  className="w-1/2 text-xs h-9 font-mono"
                />
                <span className="text-stone-400">-</span>
                <Input
                  type="number"
                  placeholder="Max"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  className="w-1/2 text-xs h-9 font-mono"
                />
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Total Counter */}
      <div className="flex items-center justify-between text-xs text-stone-500 px-1">
        <span>Menampilkan {filteredTransactions.length} transaksi</span>
        {activeFilterCount > 0 && (
          <span className="text-teal-600 dark:text-teal-400 font-semibold">
            {activeFilterCount} filter aktif
          </span>
        )}
      </div>

      {/* Transactions List Grouped by Date */}
      {Object.keys(groupedTransactions).length === 0 ? (
        <Card className="p-8 text-center bg-white dark:bg-stone-900 border-stone-200/80 dark:border-stone-800">
          <p className="text-sm text-stone-500 mb-2">
            Tidak ada transaksi yang cocok.
          </p>
          <Button
            variant="link"
            size="sm"
            onClick={resetFilters}
            className="text-xs font-bold text-teal-600 dark:text-teal-400"
          >
            Bersihkan Filter
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedTransactions).map(
            ([dateDay, transactionsForDay]) => {
              const txList = transactionsForDay as Transaction[];
              const dayTotalExpense = txList
                .filter((t) => t.type === "expense")
                .reduce((acc, t) => acc + t.amount, 0);

              return (
                <div key={dateDay} className="space-y-1.5">
                  {/* Date Header */}
                  <div className="flex items-center justify-between px-2 text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-stone-400" />
                      <span>{formatDateID(dateDay, { short: false })}</span>
                    </div>
                    {dayTotalExpense > 0 && (
                      <span className="text-rose-500 font-semibold">
                        -
                        {formatRupiah(
                          dayTotalExpense,
                          hideBalances,
                          user.baseCurrency,
                        )}
                      </span>
                    )}
                  </div>

                  {/* List Item per Hari */}
                  <div className="rounded-2xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800 shadow-xs overflow-hidden">
                    {txList.map((tx) => {
                      const cat = categories.find(
                        (c) => c.id === tx.categoryId,
                      );
                      const sourceWallet = wallets.find(
                        (w) => w.id === tx.walletId,
                      );
                      const destWallet = tx.toWalletId
                        ? wallets.find((w) => w.id === tx.toWalletId)
                        : null;

                      return (
                        <div
                          key={tx.id}
                          className="p-3.5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/40 transition group"
                        >
                          <div
                            onClick={() => onSelectTransaction(tx)}
                            className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                          >
                            <div
                              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                              style={{
                                backgroundColor:
                                  tx.type === "transfer"
                                    ? "#6366f1"
                                    : cat?.color || "#0d9488",
                              }}
                            >
                              {tx.type === "transfer" ? (
                                <ArrowRightLeft className="w-5 h-5" />
                              ) : (
                                <IconRenderer
                                  name={cat?.iconName || "Receipt"}
                                  size={18}
                                />
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                                {tx.description}
                              </p>
                              <div className="flex items-center gap-1.5 text-[11px] text-stone-400 truncate mt-0.5">
                                <span>
                                  {tx.type === "transfer"
                                    ? `${sourceWallet?.name} → ${destWallet?.name}`
                                    : sourceWallet?.name}
                                </span>
                                {cat && (
                                  <>
                                    <span>•</span>
                                    <span>{cat.name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            <div
                              onClick={() => onSelectTransaction(tx)}
                              className="text-right cursor-pointer"
                            >
                              <div
                                className={`text-xs sm:text-sm font-extrabold font-mono ${
                                  tx.type === "income"
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : tx.type === "expense"
                                      ? "text-rose-600 dark:text-rose-400"
                                      : "text-indigo-600 dark:text-indigo-400"
                                }`}
                              >
                                {tx.type === "income"
                                  ? "+"
                                  : tx.type === "expense"
                                    ? "-"
                                    : "↔"}{" "}
                                {formatRupiah(
                                  tx.amount,
                                  hideBalances,
                                  user.baseCurrency,
                                )}
                              </div>
                              <span className="text-[10px] text-stone-400">
                                {tx.date.split("T")[1] || ""}
                              </span>
                            </div>

                            {tx.receiptImage && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewReceiptUrl(tx.receiptImage || null);
                                }}
                                className="w-7 h-7 rounded-lg overflow-hidden border border-stone-200 dark:border-stone-700 hover:scale-105 transition"
                                title="Lihat Foto Struk"
                              >
                                <img
                                  src={tx.receiptImage}
                                  alt="Struk"
                                  className="w-full h-full object-cover"
                                />
                              </button>
                            )}

                            {/* Tombol Aksi Duplikasi & Hapus dengan Dialog */}
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => handleDuplicate(e, tx.id)}
                                className="p-1.5 text-stone-400 hover:text-teal-600 rounded-lg transition"
                                title="Duplikasi Transaksi"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeletingTx(tx);
                                }}
                                className="p-1.5 text-stone-400 hover:text-rose-600 rounded-lg transition"
                                title="Hapus Transaksi"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            },
          )}
        </div>
      )}

      {/* Lightbox Foto Struk */}
      <Dialog
        open={!!previewReceiptUrl}
        onOpenChange={(open) => !open && setPreviewReceiptUrl(null)}
      >
        <DialogContent className="max-w-md p-3 bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold">
              Foto Struk Pembelian
            </DialogTitle>
          </DialogHeader>
          {previewReceiptUrl && (
            <div className="space-y-2">
              <img
                src={previewReceiptUrl}
                alt="Foto Struk"
                className="w-full h-auto max-h-[75vh] object-contain rounded-xl border border-stone-200 dark:border-stone-800"
              />
              <p className="text-center text-xs text-stone-400">
                Foto Struk Pembelian Tersimpan
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Hapus Transaksi (Shadcn Dialog) */}
      <Dialog
        open={!!deletingTx}
        onOpenChange={(open) => !open && !isDeleting && setDeletingTx(null)}
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
                "{deletingTx?.description}"
              </strong>{" "}
              sebesar{" "}
              <strong className="text-stone-900 dark:text-stone-100 font-mono">
                {deletingTx
                  ? formatRupiah(
                      deletingTx.amount,
                      hideBalances,
                      user.baseCurrency,
                    )
                  : ""}
              </strong>
              ? Saldo dompet Anda otomatis akan dikembalikan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-3 sm:justify-start">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeletingTx(null)}
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
