"use client";

import React, { useState } from "react";
import {
  CalendarClock,
  Plus,
  CheckCircle2,
  Trash2,
  X,
  CreditCard,
  AlertCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Zap,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { RecurringBill, RecurringFrequency } from "@/types";
import {
  formatRupiah,
  formatMoneyInput,
  parseSmartMoneyInput,
  formatDateID,
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

export const RecurringBillsView: React.FC = () => {
  const {
    recurringBills,
    wallets,
    categories,
    hideBalances,
    user,
    colorPreset,
    addRecurringBill,
    deleteRecurringBill,
    markRecurringPaid,
  } = useApp();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [frequency, setFrequency] = useState<RecurringFrequency>("monthly");
  const [nextDueDate, setNextDueDate] = useState("");
  const [walletId, setWalletId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Modal Bayar
  const [payModalBill, setPayModalBill] = useState<RecurringBill | null>(null);
  const [payWalletId, setPayWalletId] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  // State Modal Konfirmasi Hapus
  const [deletingBill, setDeletingBill] = useState<RecurringBill | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const expenseCategories = categories.filter((c) => c.type === "expense");

  // Helper hitung sisa hari jatuh tempo
  const getDaysRemaining = (dueDateStr: string): number => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(dueDateStr);
      due.setHours(0, 0, 0, 0);
      const diffTime = due.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  const openCreateModal = () => {
    setTitle("");
    setAmountInput("");
    setFrequency("monthly");
    setNextDueDate(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    );
    setWalletId(wallets[0]?.id || "");
    setCategoryId(expenseCategories[0]?.id || "");
    setIsModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseSmartMoneyInput(amountInput);
    if (!title.trim() || amount <= 0 || !nextDueDate) {
      toast.error("Mohon lengkapi seluruh data tagihan!");
      return;
    }

    const dueDayNumber = new Date(nextDueDate).getDate() || 1;

    setIsSubmitting(true);
    try {
      await addRecurringBill({
        title: title.trim(),
        amount,
        frequency,
        dueDay: dueDayNumber,
        nextDueDate,
        walletId,
        categoryId,
        isActive: true,
      });

      toast.success(`Tagihan "${title.trim()}" berhasil dijadwalkan!`);
      setIsModalOpen(false);
    } catch (err) {
      toast.error("Gagal menjadwalkan tagihan ke server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPayModal = (bill: RecurringBill) => {
    setPayModalBill(bill);
    setPayWalletId(bill.walletId);
  };

  const handleConfirmPay = async () => {
    if (!payModalBill) return;
    setIsPaying(true);
    try {
      await markRecurringPaid(payModalBill.id);
      toast.success(`Tagihan "${payModalBill.title}" berhasil dibayar!`);
      setPayModalBill(null);
    } catch (err) {
      toast.error("Gagal memproses pembayaran tagihan.");
    } finally {
      setIsPaying(false);
    }
  };

  // Eksekusi Konfirmasi Hapus
  const handleConfirmDelete = async () => {
    if (!deletingBill || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteRecurringBill(deletingBill.id);
      toast.info(`Jadwal tagihan "${deletingBill.title}" telah dihapus.`);
      setDeletingBill(null);
    } catch (err) {
      toast.error("Gagal menghapus tagihan dari server.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 pb-28 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <CalendarClock
              className="w-5 h-5"
              style={{ color: colorPreset.primaryHex }}
            />
            <span>Tagihan Rutin & Pengingat</span>
          </h2>
          <p className="text-xs text-stone-400">
            Jadwal tagihan langganan, kosan, listrik, dan cicilan berkala
          </p>
        </div>
        <Button
          size="sm"
          onClick={openCreateModal}
          style={{
            background: `linear-gradient(135deg, ${colorPreset.primaryHex}, ${colorPreset.secondaryHex})`,
          }}
          className="gap-1.5 font-bold text-xs h-8 shadow-xs text-white transition hover:brightness-110"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Pasang Tagihan</span>
        </Button>
      </div>

      {/* Bill List */}
      {recurringBills.length === 0 ? (
        <Card className="p-8 text-center bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
          <CalendarClock className="w-8 h-8 text-stone-300 dark:text-stone-700 mx-auto mb-2" />
          <p className="text-xs text-stone-500 mb-3">
            Belum ada tagihan rutin terdaftar.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={openCreateModal}
            className="text-xs font-bold"
          >
            Daftarkan Tagihan Rutin Pertama
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {recurringBills.map((bill) => {
            const cat = categories.find((c) => c.id === bill.categoryId);
            const w = wallets.find((wal) => wal.id === bill.walletId);
            const daysLeft = getDaysRemaining(bill.nextDueDate);
            const isDueSoon = daysLeft <= 3 && daysLeft >= 0;
            const isOverdue = daysLeft < 0;

            return (
              <Card
                key={bill.id}
                className="p-4 flex flex-col justify-between space-y-3 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: cat?.color || "#0d9488" }}
                    >
                      <IconRenderer name={cat?.iconName || "Zap"} size={18} />
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-stone-900 dark:text-stone-100">
                        {bill.title}
                      </h4>
                      <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-0.5">
                        <Badge
                          variant="secondary"
                          className="capitalize font-semibold text-[10px] h-4 px-1.5"
                        >
                          {bill.frequency === "monthly"
                            ? "Bulanan"
                            : bill.frequency === "weekly"
                              ? "Mingguan"
                              : bill.frequency === "yearly"
                                ? "Tahunan"
                                : "Harian"}
                        </Badge>
                        <span>•</span>
                        <span>{w?.name || "Dompet"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs font-black text-stone-900 dark:text-white font-mono">
                      {formatRupiah(
                        bill.amount,
                        hideBalances,
                        user.baseCurrency,
                      )}
                    </p>
                    <span
                      className={`text-[10px] font-bold ${
                        isOverdue
                          ? "text-rose-500"
                          : isDueSoon
                            ? "text-amber-500"
                            : "text-stone-400"
                      }`}
                    >
                      {isOverdue
                        ? `Terlambat ${Math.abs(daysLeft)} hari`
                        : daysLeft === 0
                          ? "Jatuh tempo HARI INI"
                          : `${daysLeft} hari lagi`}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 dark:border-stone-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[10px] text-stone-400">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Jatuh Tempo:{" "}
                      {formatDateID(bill.nextDueDate, { short: true })}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => openPayModal(bill)}
                      className="font-bold text-xs h-8 px-3 bg-teal-600 hover:bg-teal-500 text-white"
                    >
                      Bayar Sekarang
                    </Button>

                    {/* Tombol Hapus dengan Konfirmasi Modal */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingBill(bill)}
                      className="h-8 w-8 text-stone-400 hover:text-rose-500 hover:bg-rose-500/10"
                      title="Hapus Tagihan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Tambah Tagihan */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
              Pasang Tagihan Rutin
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-stone-400">
                Nama Tagihan / Langganan
              </label>
              <Input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Wi-Fi Indihome, Kosan, Spotify..."
                className="text-xs font-semibold h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-stone-400">
                  Nominal (Rp)
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  required
                  value={amountInput}
                  onChange={(e) =>
                    setAmountInput(formatMoneyInput(e.target.value))
                  }
                  placeholder="350.000"
                  className="text-xs font-bold font-mono h-9"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-stone-400">
                  Frekuensi
                </label>
                <Select
                  value={frequency}
                  onChange={(e) =>
                    setFrequency(e.target.value as RecurringFrequency)
                  }
                >
                  <option value="monthly">Bulanan</option>
                  <option value="weekly">Mingguan</option>
                  <option value="yearly">Tahunan</option>
                  <option value="daily">Harian</option>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-stone-400">
                Jatuh Tempo Pertama
              </label>
              <Input
                type="date"
                required
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className="text-xs font-semibold h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-stone-400">
                  Kategori
                </label>
                <Select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {expenseCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-stone-400">
                  Dompet Default
                </label>
                <Select
                  value={walletId}
                  onChange={(e) => setWalletId(e.target.value)}
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
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
                style={{
                  background: `linear-gradient(135deg, ${colorPreset.primaryHex}, ${colorPreset.secondaryHex})`,
                }}
                className="flex-1 text-xs font-bold text-white shadow-md"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </div>
                ) : (
                  "Simpan Jadwal"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Bayar */}
      <Dialog
        open={!!payModalBill}
        onOpenChange={(open) => !open && !isPaying && setPayModalBill(null)}
      >
        <DialogContent className="max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
              Konfirmasi Pembayaran Tagihan
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-stone-400">
            Apakah Anda ingin membayar <strong>{payModalBill?.title}</strong>{" "}
            sebesar{" "}
            <strong className="text-stone-900 dark:text-white font-mono">
              {payModalBill
                ? formatRupiah(payModalBill.amount, false, user.baseCurrency)
                : ""}
            </strong>
            ?
          </p>

          <div className="space-y-3 pt-2">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-stone-400">
                Potong dari Rekening / Dompet
              </label>
              <Select
                value={payWalletId}
                onChange={(e) => setPayWalletId(e.target.value)}
              >
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} (Saldo: {w.balance.toLocaleString("id-ID")})
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isPaying}
                onClick={() => setPayModalBill(null)}
                className="flex-1 text-xs font-semibold"
              >
                Batal
              </Button>
              <Button
                type="button"
                disabled={isPaying}
                onClick={handleConfirmPay}
                style={{
                  background: `linear-gradient(135deg, ${colorPreset.primaryHex}, ${colorPreset.secondaryHex})`,
                }}
                className="flex-1 text-xs font-bold text-white shadow-md"
              >
                {isPaying ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Membayar...</span>
                  </div>
                ) : (
                  "Bayar Sekarang"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Hapus Tagihan (Shadcn Dialog) */}
      <Dialog
        open={!!deletingBill}
        onOpenChange={(open) => !open && !isDeleting && setDeletingBill(null)}
      >
        <DialogContent className="max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <DialogHeader>
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
              Hapus Jadwal Tagihan?
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-400 pt-1">
              Apakah Anda yakin ingin menghapus jadwal tagihan rutin{" "}
              <strong className="text-stone-900 dark:text-stone-100">
                "{deletingBill?.title}"
              </strong>{" "}
              sebesar{" "}
              <strong className="text-stone-900 dark:text-stone-100 font-mono">
                {deletingBill
                  ? formatRupiah(
                      deletingBill.amount,
                      hideBalances,
                      user.baseCurrency,
                    )
                  : ""}
              </strong>
              ? Notifikasi pengingat untuk tagihan ini akan dinonaktifkan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-3 sm:justify-start">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeletingBill(null)}
              className="flex-1 font-bold text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="flex-1 font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white"
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
