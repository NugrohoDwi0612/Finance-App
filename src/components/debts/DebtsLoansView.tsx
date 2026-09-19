"use client";

import React, { useState } from "react";
import {
  HandCoins,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Clock,
  CheckCircle2,
  Trash2,
  Phone,
  AlertTriangle,
  X,
  CreditCard,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";
import { toast } from "sonner"; // <-- Notifikasi Toast
import { useApp } from "@/context/AppContext";
import { DebtLoan, DebtType } from "@/types";
import {
  formatRupiah,
  formatMoneyInput,
  parseSmartMoneyInput,
  formatDateID,
} from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export const DebtsLoansView: React.FC = () => {
  const {
    debtsLoans,
    wallets,
    hideBalances,
    user,
    colorPreset,
    addDebtLoan,
    addDebtPayment,
    deleteDebtLoan,
  } = useApp();

  const [activeTab, setActiveTab] = useState<DebtType>("loan"); // loan = Piutang Teman, debt = Hutang Saya
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form tambah hutang/piutang
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  // Modal bayar cicilan
  const [paymentTarget, setPaymentTarget] = useState<DebtLoan | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState("");
  const [paymentWalletId, setPaymentWalletId] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  // Modal konfirmasi hapus
  const [deletingItem, setDeletingItem] = useState<DebtLoan | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const filteredItems = debtsLoans.filter((d) => d.type === activeTab);

  const totalOutstanding = filteredItems.reduce(
    (acc, d) => acc + (d.totalAmount - d.paidAmount),
    0,
  );

  // Helper sisa hari jatuh tempo
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
    setContactName("");
    setContactPhone("");
    setAmountInput("");
    setDueDate(
      new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
    );
    setNotes("");
    setIsCreateModalOpen(true);
  };

  // 1. Simpan Tambah Hutang / Piutang dengan Toast
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseSmartMoneyInput(amountInput);

    if (!contactName.trim()) {
      toast.error("Nama kontak wajib diisi!");
      return;
    }
    if (amount <= 0) {
      toast.error("Nominal pinjaman harus lebih dari 0!");
      return;
    }
    if (!dueDate) {
      toast.error("Pilih tanggal jatuh tempo!");
      return;
    }

    setIsSubmitting(true);
    try {
      await addDebtLoan({
        type: activeTab,
        contactName: contactName.trim(),
        contactPhone: contactPhone.trim(),
        totalAmount: amount,
        dueDate,
        notes: notes.trim(),
      });

      toast.success(
        activeTab === "loan"
          ? `Catatan piutang untuk "${contactName.trim()}" berhasil disimpan!`
          : `Catatan hutang kepada "${contactName.trim()}" berhasil disimpan!`,
      );
      setIsCreateModalOpen(false);
    } catch (err) {
      toast.error("Gagal menyimpan data ke server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPaymentModal = (item: DebtLoan) => {
    setPaymentTarget(item);
    const remaining = item.totalAmount - item.paidAmount;
    setPaymentAmountInput(formatMoneyInput(remaining));
    setPaymentWalletId(wallets[0]?.id || "");
    setPaymentNote("");
  };

  // 2. Simpan Pembayaran Cicilan dengan Toast
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTarget) return;

    const amount = parseSmartMoneyInput(paymentAmountInput);
    if (amount <= 0) {
      toast.error("Nominal pembayaran harus lebih dari 0!");
      return;
    }

    setIsPaying(true);
    try {
      await addDebtPayment(
        paymentTarget.id,
        amount,
        paymentWalletId || undefined,
        paymentNote.trim() || undefined,
      );

      toast.success(
        paymentTarget.type === "debt"
          ? `Cicilan hutang sebesar ${formatRupiah(amount)} berhasil dibayarkan!`
          : `Pelunasan piutang sebesar ${formatRupiah(amount)} berhasil diterima!`,
      );
      setPaymentTarget(null);
    } catch (err) {
      toast.error("Gagal mencatat pembayaran.");
    } finally {
      setIsPaying(false);
    }
  };

  // 3. Eksekusi Hapus dengan Toast
  const handleConfirmDelete = async () => {
    if (!deletingItem || isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteDebtLoan(deletingItem.id);
      toast.info(
        `Catatan ${deletingItem.type === "loan" ? "piutang" : "hutang"} "${deletingItem.contactName}" telah dihapus.`,
      );
      setDeletingItem(null);
    } catch (err) {
      toast.error("Gagal menghapus catatan dari server.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 pb-28 animate-fadeIn">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <HandCoins
              className="w-5 h-5"
              style={{ color: colorPreset.primaryHex }}
            />
            <span>Hutang & Piutang</span>
          </h2>
          <p className="text-xs text-stone-400">
            Catat pinjaman teman dan kewajiban hutang secara transparan
          </p>
        </div>
        <Button
          size="sm"
          onClick={openCreateModal}
          style={{
            background: `linear-gradient(135deg, ${colorPreset.primaryHex}, ${colorPreset.secondaryHex})`,
          }}
          className="gap-1.5 font-bold text-xs shadow-xs h-8 text-white hover:brightness-110"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Tambah Data</span>
        </Button>
      </div>

      {/* Tabs (Piutang Teman vs Hutang Saya) */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as DebtType)}
      >
        <TabsList className="w-full grid grid-cols-2 p-1 h-11 bg-stone-100 dark:bg-stone-800">
          <TabsTrigger value="loan" className="text-xs font-bold gap-1.5 h-9">
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
            <span>Piutang Teman (Uang Saya)</span>
          </TabsTrigger>
          <TabsTrigger value="debt" className="text-xs font-bold gap-1.5 h-9">
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
            <span>Hutang Saya (Kewajiban)</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Summary Card */}
      <Card className="p-4 flex items-center justify-between bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
        <div>
          <span className="text-[10px] font-bold uppercase text-stone-400 tracking-wider">
            {activeTab === "loan"
              ? "Total Piutang Belum Tertagih"
              : "Total Hutang Belum Lunas"}
          </span>
          <p
            className={`text-xl font-black font-mono mt-0.5 ${
              activeTab === "loan"
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {formatRupiah(totalOutstanding, hideBalances, user.baseCurrency)}
          </p>
        </div>
        <Badge variant="outline" className="text-xs font-semibold">
          {filteredItems.filter((i) => i.status !== "paid").length} aktif
        </Badge>
      </Card>

      {/* Debts/Loans List */}
      {filteredItems.length === 0 ? (
        <Card className="p-8 text-center bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
          <HandCoins className="w-8 h-8 text-stone-300 dark:text-stone-700 mx-auto mb-2" />
          <p className="text-xs text-stone-500 mb-3">
            Tidak ada catatan{" "}
            {activeTab === "loan" ? "piutang teman" : "hutang Anda"}.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={openCreateModal}
            className="text-xs font-bold"
          >
            Tambah Catatan Baru
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const remaining = item.totalAmount - item.paidAmount;
            const daysLeft = getDaysRemaining(item.dueDate);
            const isOverdue = daysLeft < 0 && item.status !== "paid";
            const percentPaid = Math.round(
              (item.paidAmount / item.totalAmount) * 100,
            );
            const isExpanded = expandedId === item.id;

            return (
              <Card
                key={item.id}
                className="p-4 space-y-3 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 truncate">
                        {item.contactName}
                      </h4>
                      <Badge
                        variant={
                          item.status === "paid"
                            ? "default"
                            : item.status === "partial"
                              ? "secondary"
                              : "destructive"
                        }
                        className="text-[9px] uppercase tracking-wider font-bold h-4 px-1.5 py-0"
                      >
                        {item.status === "paid"
                          ? "Lunas"
                          : item.status === "partial"
                            ? "Lunas Sebagian"
                            : "Belum Bayar"}
                      </Badge>
                    </div>

                    {item.notes && (
                      <p className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">
                        {item.notes}
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Jatuh Tempo:{" "}
                        {formatDateID(item.dueDate, { short: true })}
                      </span>
                      <span>•</span>
                      <span
                        className={`font-semibold ${
                          isOverdue
                            ? "text-rose-500 font-bold"
                            : daysLeft <= 3 && item.status !== "paid"
                              ? "text-amber-500 font-bold"
                              : ""
                        }`}
                      >
                        {item.status === "paid"
                          ? "Selesai"
                          : isOverdue
                            ? `Terlambat ${Math.abs(daysLeft)} hari`
                            : daysLeft === 0
                              ? "Jatuh tempo hari ini"
                              : `${daysLeft} hari lagi`}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <p className="text-xs font-black font-mono text-stone-900 dark:text-white">
                      {formatRupiah(
                        item.totalAmount,
                        hideBalances,
                        user.baseCurrency,
                      )}
                    </p>
                    {item.status !== "paid" && (
                      <span className="text-[10px] font-bold text-rose-500 block">
                        Sisa:{" "}
                        {formatRupiah(
                          remaining,
                          hideBalances,
                          user.baseCurrency,
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress bar cicilan */}
                <div className="space-y-1.5">
                  <Progress
                    value={percentPaid}
                    max={100}
                    className="h-2"
                    indicatorClassName={
                      activeTab === "loan" ? "bg-emerald-500" : "bg-rose-500"
                    }
                  />
                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span>
                      Terbayar:{" "}
                      {formatRupiah(
                        item.paidAmount,
                        hideBalances,
                        user.baseCurrency,
                      )}
                    </span>
                    <span className="font-semibold">{percentPaid}%</span>
                  </div>
                </div>

                {/* Tombol Aksi */}
                <div className="pt-2 flex items-center justify-between border-t border-stone-100 dark:border-stone-800">
                  <div className="flex items-center gap-2">
                    {item.status !== "paid" && (
                      <Button
                        size="sm"
                        onClick={() => openPaymentModal(item)}
                        className="font-bold text-xs h-8 px-3 bg-teal-600 hover:bg-teal-500 text-white"
                      >
                        + Catat Cicilan
                      </Button>
                    )}
                    {item.contactPhone && (
                      <a
                        href={`https://wa.me/${item.contactPhone.replace(/[^0-9]/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 transition"
                      >
                        <Phone className="w-3 h-3" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {item.payments.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedId(isExpanded ? null : item.id)
                        }
                        className="text-xs text-stone-400 hover:text-stone-100 gap-1 h-8 px-2"
                      >
                        <span>{item.payments.length} Riwayat</span>
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </Button>
                    )}

                    {/* Tombol Hapus dengan Konfirmasi Modal */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingItem(item)}
                      className="h-8 w-8 text-stone-400 hover:text-rose-500 hover:bg-rose-500/10"
                      title="Hapus Catatan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                {/* Riwayat Pembayaran Cicilan */}
                {isExpanded && item.payments.length > 0 && (
                  <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-2xl space-y-2 border border-stone-200/50 dark:border-stone-800">
                    <p className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                      Riwayat Pembayaran Cicilan
                    </p>
                    <div className="divide-y divide-stone-200/50 dark:divide-stone-700/50">
                      {item.payments.map((p) => (
                        <div
                          key={p.id}
                          className="py-1.5 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-semibold text-stone-800 dark:text-stone-200">
                              {p.note || "Pembayaran Cicilan"}
                            </span>
                            <span className="text-[10px] text-stone-400 block">
                              {p.date}
                            </span>
                          </div>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                            +
                            {formatRupiah(
                              p.amount,
                              hideBalances,
                              user.baseCurrency,
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal Buat Hutang/Piutang Baru */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
              {activeTab === "loan"
                ? "Catat Piutang Teman Baru"
                : "Catat Hutang Kewajiban Baru"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-stone-400">
                {activeTab === "loan"
                  ? "Nama Peminjam / Teman"
                  : "Pihak yang Dihutangi / Lembaga"}
              </label>
              <Input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Contoh: Dimas Pratama, Kartu Kredit..."
                className="font-semibold text-xs h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-stone-400">
                No. WhatsApp (Opsional)
              </label>
              <Input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="0812xxxxxxxx"
                className="text-xs h-9 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-stone-400">
                Total Nominal Pinjaman (Rp)
              </label>
              <Input
                type="text"
                inputMode="numeric"
                required
                value={amountInput}
                onChange={(e) =>
                  setAmountInput(formatMoneyInput(e.target.value))
                }
                placeholder="Contoh: 1.500.000"
                className="text-sm font-bold font-mono h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-stone-400">
                Target Jatuh Tempo
              </label>
              <Input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-xs font-semibold h-9"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-stone-400">
                Catatan Keperluan
              </label>
              <Input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Pinjaman tiket, talangan makan..."
                className="text-xs h-9"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setIsCreateModalOpen(false)}
                className="flex-1 font-bold text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 font-bold text-xs bg-teal-600 hover:bg-teal-500 text-white"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </div>
                ) : (
                  "Simpan Catatan"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Bayar Cicilan */}
      <Dialog
        open={!!paymentTarget}
        onOpenChange={(open) => !open && !isPaying && setPaymentTarget(null)}
      >
        <DialogContent className="max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
              Catat Pembayaran: {paymentTarget?.contactName}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handlePaymentSubmit} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-stone-400">
                Nominal Cicilan / Pelunasan (Rp)
              </label>
              <Input
                type="text"
                inputMode="numeric"
                value={paymentAmountInput}
                onChange={(e) =>
                  setPaymentAmountInput(formatMoneyInput(e.target.value))
                }
                className="text-base font-black font-mono h-11"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-stone-400">
                {paymentTarget?.type === "debt"
                  ? "Potong Saldo Dari Rekening"
                  : "Terima Uang Ke Rekening"}
              </label>
              <Select
                value={paymentWalletId}
                onChange={(e) => setPaymentWalletId(e.target.value)}
              >
                <option value="">Jangan ubah saldo dompet</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} (Saldo: {w.balance.toLocaleString("id-ID")})
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-stone-400">
                Keterangan Cicilan
              </label>
              <Input
                type="text"
                value={paymentNote}
                onChange={(e) => setPaymentNote(e.target.value)}
                placeholder="Contoh: Cicilan ke-1 transfer via BCA"
                className="text-xs h-9"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                disabled={isPaying}
                onClick={() => setPaymentTarget(null)}
                className="flex-1 font-bold text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isPaying}
                className="flex-1 font-bold text-xs bg-teal-600 hover:bg-teal-500 text-white"
              >
                {isPaying ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mencatat...</span>
                  </div>
                ) : (
                  "Konfirmasi Bayar"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Hapus Khusus (Shadcn Dialog) */}
      <Dialog
        open={!!deletingItem}
        onOpenChange={(open) => !open && !isDeleting && setDeletingItem(null)}
      >
        <DialogContent className="max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <DialogHeader>
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
              Hapus Catatan{" "}
              {deletingItem?.type === "loan" ? "Piutang" : "Hutang"}?
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-400 pt-1">
              Apakah Anda yakin ingin menghapus catatan pinjaman dengan{" "}
              <strong className="text-stone-900 dark:text-stone-100">
                "{deletingItem?.contactName}"
              </strong>
              ? Riwayat pembayaran cicilan terkait juga akan terhapus.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-3 sm:justify-start">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeletingItem(null)}
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
