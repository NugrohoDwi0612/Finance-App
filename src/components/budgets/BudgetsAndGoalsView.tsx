"use client";

import React, { useState } from "react";
import {
  Target,
  Plus,
  PiggyBank,
  TrendingUp,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Trash2,
  Edit2,
  X,
  ArrowUpRight,
  Sparkles,
} from "lucide-react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { Budget, Goal } from "@/types";
import {
  formatRupiah,
  formatMoneyInput,
  parseSmartMoneyInput,
  formatDateID,
} from "@/utils/formatters";
import { IconRenderer } from "@/components/common/IconRenderer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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

export const BudgetsAndGoalsView: React.FC = () => {
  const {
    budgets,
    categories,
    transactions,
    goals,
    wallets,
    hideBalances,
    user,
    addBudget,
    editBudget,
    deleteBudget,
    addGoal,
    editGoal,
    deleteGoal,
    depositToGoal,
  } = useApp();

  const [activeTab, setActiveTab] = useState<"budgets" | "goals">("budgets");

  // State Modal Budget (Tambah & Edit)
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [budgetCategoryId, setBudgetCategoryId] = useState("");
  const [budgetLimitInput, setBudgetLimitInput] = useState("");

  // State Modal Goal (Tambah & Edit)
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [goalTitle, setGoalTitle] = useState("");
  const [goalTargetInput, setGoalTargetInput] = useState("");
  const [goalInitialInput, setGoalInitialInput] = useState("");
  const [goalTargetDate, setGoalTargetDate] = useState("");
  const [goalWalletId, setGoalWalletId] = useState("");
  const [goalIcon, setGoalIcon] = useState("Smartphone");
  const [goalColor, setGoalColor] = useState("#0d9488");
  const [goalNotes, setGoalNotes] = useState("");

  // State Modal Setor Tabungan
  const [depositGoal, setDepositGoal] = useState<Goal | null>(null);
  const [depositAmountInput, setDepositAmountInput] = useState("");
  const [depositWalletId, setDepositWalletId] = useState("");

  // State Modal Konfirmasi Hapus (Delete Confirmation Dialog)
  const [deleteTarget, setDeleteTarget] = useState<{
    type: "budget" | "goal";
    id: string;
    title: string;
  } | null>(null);

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const expenseCategories = categories.filter((c) => c.type === "expense");

  // Helper hitung sisa hari
  const getDaysRemaining = (targetDateStr: string): number => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(targetDateStr);
      target.setHours(0, 0, 0, 0);
      const diffTime = target.getTime() - today.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch {
      return 0;
    }
  };

  // Kalkulasi Anggaran
  const budgetStats = budgets.map((b) => {
    const cat = categories.find((c) => c.id === b.categoryId);
    const spent = transactions
      .filter((tx) => {
        const txMonth = tx.date.slice(0, 7);
        return (
          tx.type === "expense" &&
          tx.categoryId === b.categoryId &&
          txMonth === currentMonthStr
        );
      })
      .reduce((acc, tx) => acc + tx.amount, 0);

    const percentage = Math.round((spent / b.monthlyLimit) * 100);
    const remaining = b.monthlyLimit - spent;

    let statusColor = "bg-emerald-500";
    let statusLabel = "Aman";

    if (percentage >= 100) {
      statusColor = "bg-rose-500";
      statusLabel = "Over-Budget!";
    } else if (percentage >= 75) {
      statusColor = "bg-amber-500";
      statusLabel = "Mendekati Batas";
    }

    return {
      budget: b,
      category: cat,
      spent,
      remaining,
      percentage,
      statusColor,
      statusLabel,
    };
  });

  // ==========================================
  // HANDLERS: ANGGARAN (BUDGET)
  // ==========================================
  const openNewBudgetModal = () => {
    setEditingBudget(null);
    setBudgetCategoryId(expenseCategories[0]?.id || "");
    setBudgetLimitInput("");
    setIsBudgetModalOpen(true);
  };

  const openEditBudgetModal = (b: Budget) => {
    setEditingBudget(b);
    setBudgetCategoryId(b.categoryId);
    setBudgetLimitInput(formatMoneyInput(b.monthlyLimit));
    setIsBudgetModalOpen(true);
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseSmartMoneyInput(budgetLimitInput);
    if (limit <= 0) {
      toast.error("Nominal batas anggaran harus lebih dari 0!");
      return;
    }

    if (editingBudget) {
      // 1. JIKA EDIT: Panggil editBudget murni update ke baris ID yang sama
      editBudget(editingBudget.id, limit);
      toast.success("Batas anggaran berhasil diperbarui!");
    } else {
      // 2. JIKA BARU: Panggil addBudget murni insert baris baru
      if (!budgetCategoryId) {
        toast.error("Silakan pilih kategori pengeluaran!");
        return;
      }
      addBudget(budgetCategoryId, limit, currentMonthStr);
      toast.success("Batas anggaran baru berhasil dipasang!");
    }

    setIsBudgetModalOpen(false);
  };

  // ==========================================
  // HANDLERS: CELENGAN (GOAL)
  // ==========================================
  const openNewGoalModal = () => {
    setEditingGoal(null);
    setGoalTitle("");
    setGoalTargetInput("");
    setGoalInitialInput("");
    setGoalTargetDate(
      new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
        .toISOString()
        .slice(0, 10),
    );
    setGoalWalletId(wallets[0]?.id || "");
    setGoalIcon("Smartphone");
    setGoalColor("#0d9488");
    setGoalNotes("");
    setIsGoalModalOpen(true);
  };

  const openEditGoalModal = (g: Goal) => {
    setEditingGoal(g);
    setGoalTitle(g.title);
    setGoalTargetInput(formatMoneyInput(g.targetAmount));
    setGoalInitialInput(formatMoneyInput(g.currentAmount));
    setGoalTargetDate(g.targetDate);
    setGoalWalletId(g.walletId || wallets[0]?.id || "");
    setGoalIcon(g.iconName || "Smartphone");
    setGoalColor(g.color || "#0d9488");
    setGoalNotes(g.notes || "");
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const targetAmt = parseSmartMoneyInput(goalTargetInput);
    const currentAmt = parseSmartMoneyInput(goalInitialInput);
    if (!goalTitle.trim() || targetAmt <= 0) {
      toast.error("Target dana harus lebih dari 0!");
      return;
    }

    if (editingGoal) {
      editGoal(editingGoal.id, {
        title: goalTitle.trim(),
        targetAmount: targetAmt,
        currentAmount: currentAmt,
        targetDate: goalTargetDate,
        walletId: goalWalletId,
        iconName: goalIcon,
        color: goalColor,
        notes: goalNotes.trim(),
      });
      toast.success(`Target "${goalTitle}" berhasil diperbarui!`);
    } else {
      addGoal({
        title: goalTitle.trim(),
        targetAmount: targetAmt,
        currentAmount: currentAmt,
        targetDate: goalTargetDate,
        walletId: goalWalletId,
        iconName: goalIcon,
        color: goalColor,
        notes: goalNotes.trim(),
      });
      toast.success(`Target impian "${goalTitle}" berhasil dibuat!`);
    }

    setIsGoalModalOpen(false);
  };

  // ==========================================
  // HANDLERS: SETOR TABUNGAN
  // ==========================================
  const openDepositModal = (g: Goal) => {
    setDepositGoal(g);
    setDepositAmountInput("");
    setDepositWalletId(wallets[0]?.id || "");
  };

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositGoal) return;
    const amount = parseSmartMoneyInput(depositAmountInput);
    if (amount <= 0 || !depositWalletId) {
      toast.error("Nominal setoran harus lebih dari 0!");
      return;
    }

    depositToGoal(depositGoal.id, amount, depositWalletId);
    toast.success(
      `Berhasil menyetor ${formatRupiah(amount)} ke ${depositGoal.title}!`,
    );

    // Pesta Confetti jika impian tercapai
    if (depositGoal.currentAmount + amount >= depositGoal.targetAmount) {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
      });
    }

    setDepositGoal(null);
  };

  // ==========================================
  // HANDLER: EKSEKUSI KONFIRMASI HAPUS
  // ==========================================
  const handleExecuteDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === "budget") {
      deleteBudget(deleteTarget.id);
      toast.info(`Anggaran "${deleteTarget.title}" telah dihapus.`);
    } else {
      deleteGoal(deleteTarget.id);
      toast.info(`Target impian "${deleteTarget.title}" telah dihapus.`);
    }

    setDeleteTarget(null);
  };

  return (
    <div className="space-y-4 pb-28 animate-fadeIn">
      {/* Tab Switcher */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "budgets" | "goals")}
      >
        <TabsList className="w-full grid grid-cols-2 p-1 h-11 bg-stone-100 dark:bg-stone-800">
          <TabsTrigger
            value="budgets"
            className="text-xs font-bold gap-1.5 h-9"
          >
            <Target className="w-4 h-4" />
            <span>Anggaran Bulanan ({budgets.length})</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="text-xs font-bold gap-1.5 h-9">
            <PiggyBank className="w-4 h-4" />
            <span>Celengan Impian ({goals.length})</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* =========================================================================
          TAB 1: ANGGARAN BULANAN (BUDGETS)
         ========================================================================= */}
      {activeTab === "budgets" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
                Batas Anggaran Kategori
              </h3>
              <p className="text-[11px] text-stone-400">
                Pantau pengeluaran agar tidak over-budget bulan ini
              </p>
            </div>
            <Button
              size="sm"
              onClick={openNewBudgetModal}
              className="gap-1 font-bold text-xs shadow-xs h-8 bg-teal-600 hover:bg-teal-500 text-white"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Pasang Budget</span>
            </Button>
          </div>

          {budgetStats.length === 0 ? (
            <Card className="p-8 text-center bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
              <Target className="w-8 h-8 text-stone-300 dark:text-stone-700 mx-auto mb-2" />
              <p className="text-xs text-stone-500 mb-3">
                Belum ada batas anggaran yang ditetapkan untuk bulan ini.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={openNewBudgetModal}
                className="text-xs font-bold"
              >
                Tetapkan Anggaran Pertama
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {budgetStats.map((item) => (
                <Card
                  key={item.budget.id}
                  className="p-4 space-y-2.5 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{
                          backgroundColor: item.category?.color || "#0d9488",
                        }}
                      >
                        <IconRenderer
                          name={item.category?.iconName || "Tag"}
                          size={18}
                        />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
                          {item.category?.name}
                        </h4>
                        <Badge
                          variant={
                            item.percentage >= 100
                              ? "destructive"
                              : item.percentage >= 80
                                ? "secondary"
                                : "outline"
                          }
                          className="text-[10px] font-bold mt-0.5 px-1.5 py-0 h-4"
                        >
                          {item.statusLabel} ({item.percentage}%)
                        </Badge>
                      </div>
                    </div>

                    {/* Tombol Aksi: Edit & Hapus Anggaran */}
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-xs font-black text-stone-900 dark:text-stone-100 font-mono">
                          {formatRupiah(
                            item.spent,
                            hideBalances,
                            user.baseCurrency,
                          )}
                        </p>
                        <span className="text-[10px] text-stone-400">
                          dari{" "}
                          {formatRupiah(
                            item.budget.monthlyLimit,
                            hideBalances,
                            user.baseCurrency,
                          )}
                        </span>
                      </div>

                      <div className="flex items-center gap-0.5 ml-1">
                        {/* Tombol Edit Budget */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditBudgetModal(item.budget)}
                          className="h-8 w-8 text-stone-400 hover:text-stone-100 hover:bg-stone-800"
                          title="Edit Anggaran"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>

                        {/* Tombol Hapus Budget (Dengan Konfirmasi) */}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setDeleteTarget({
                              type: "budget",
                              id: item.budget.id,
                              title: item.category?.name || "Kategori ini",
                            })
                          }
                          className="h-8 w-8 text-stone-400 hover:text-rose-500 hover:bg-rose-500/10"
                          title="Hapus Anggaran"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Progress
                    value={item.percentage}
                    max={100}
                    className="h-2.5"
                    indicatorClassName={item.statusColor}
                  />

                  <div className="flex items-center justify-between text-[10px] text-stone-400 font-medium">
                    <span>
                      {item.remaining >= 0
                        ? `Sisa Kuota: ${formatRupiah(item.remaining, hideBalances, user.baseCurrency)}`
                        : `Over: ${formatRupiah(Math.abs(item.remaining), hideBalances, user.baseCurrency)}`}
                    </span>
                    <span>Bulan {currentMonthStr}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: CELENGAN IMPIAN (SAVINGS GOALS)
         ========================================================================= */}
      {activeTab === "goals" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
                Target Tabungan Impian
              </h3>
              <p className="text-[11px] text-stone-400">
                Wujudkan impian dengan menabung secara konsisten
              </p>
            </div>
            <Button
              size="sm"
              onClick={openNewGoalModal}
              className="gap-1 font-bold text-xs shadow-xs h-8 bg-teal-600 hover:bg-teal-500 text-white"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Target Baru</span>
            </Button>
          </div>

          {goals.length === 0 ? (
            <Card className="p-8 text-center bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
              <PiggyBank className="w-8 h-8 text-stone-300 dark:text-stone-700 mx-auto mb-2" />
              <p className="text-xs text-stone-500 mb-3">
                Belum ada target tabungan impian.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={openNewGoalModal}
                className="text-xs font-bold"
              >
                Buat Target Celengan Impian
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {goals.map((g) => {
                const percent = Math.min(
                  Math.round((g.currentAmount / g.targetAmount) * 100),
                  100,
                );
                const remainingDays = getDaysRemaining(g.targetDate);
                const isCompleted = g.currentAmount >= g.targetAmount;

                return (
                  <Card
                    key={g.id}
                    className="p-4 space-y-3 relative overflow-hidden bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800"
                  >
                    {isCompleted && (
                      <div className="absolute top-0 right-0 bg-emerald-500 text-stone-950 font-black text-[9px] px-3 py-0.5 rounded-bl-xl uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Target Tercapai!
                      </div>
                    )}

                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                          style={{ backgroundColor: g.color }}
                        >
                          <IconRenderer name={g.iconName} size={22} />
                        </div>
                        <div>
                          <h4 className="text-xs font-extrabold text-stone-900 dark:text-stone-100">
                            {g.title}
                          </h4>
                          {g.notes && (
                            <p className="text-[10px] text-stone-400 line-clamp-1">
                              {g.notes}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-[10px] text-stone-400 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDateID(g.targetDate, { short: true })}
                            </span>
                            <span>•</span>
                            <span
                              className={
                                remainingDays < 0
                                  ? "text-rose-500 font-bold"
                                  : ""
                              }
                            >
                              {remainingDays >= 0
                                ? `${remainingDays} hari lagi`
                                : "Lewat target"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tombol Edit & Hapus Goal */}
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditGoalModal(g)}
                          className="h-8 w-8 text-stone-400 hover:text-stone-100 hover:bg-stone-800"
                          title="Edit Target"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setDeleteTarget({
                              type: "goal",
                              id: g.id,
                              title: g.title,
                            })
                          }
                          className="h-8 w-8 text-stone-400 hover:text-rose-500 hover:bg-rose-500/10"
                          title="Hapus Target"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-extrabold font-mono">
                        <span className="text-stone-900 dark:text-stone-100">
                          {formatRupiah(
                            g.currentAmount,
                            hideBalances,
                            user.baseCurrency,
                          )}
                        </span>
                        <span className="text-stone-400">
                          {formatRupiah(
                            g.targetAmount,
                            hideBalances,
                            user.baseCurrency,
                          )}
                        </span>
                      </div>
                      <Progress
                        value={percent}
                        max={100}
                        className="h-2.5"
                        indicatorClassName="bg-emerald-500"
                      />
                      <div className="flex justify-between text-[10px] text-stone-400">
                        <span>Progres tercapai</span>
                        <span className="font-bold text-stone-700 dark:text-stone-300">
                          {percent}%
                        </span>
                      </div>
                    </div>

                    {!isCompleted && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => openDepositModal(g)}
                        className="w-full gap-1.5 text-xs font-bold h-9 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        <span>Setor Tabungan</span>
                      </Button>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL 1: ATUR / EDIT ANGGARAN
         ========================================================================= */}
      <Dialog open={isBudgetModalOpen} onOpenChange={setIsBudgetModalOpen}>
        <DialogContent className="max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
              {editingBudget
                ? "Edit Batas Anggaran"
                : "Atur Batas Anggaran Baru"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveBudget} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-stone-400">
                Kategori Pengeluaran
              </label>
              <Select
                value={budgetCategoryId}
                onChange={(e) => setBudgetCategoryId(e.target.value)}
                disabled={!!editingBudget} // Kategori tidak bisa diubah saat edit agar data konsisten
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
                Batas Maksimal Bulanan (Rp)
              </label>
              <Input
                type="text"
                inputMode="numeric"
                value={budgetLimitInput}
                onChange={(e) =>
                  setBudgetLimitInput(formatMoneyInput(e.target.value))
                }
                placeholder="Contoh: 2.000.000"
                className="text-base font-black font-mono h-11"
                autoFocus
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsBudgetModalOpen(false)}
                className="flex-1 font-bold text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1 font-bold text-xs bg-teal-600 hover:bg-teal-500 text-white"
              >
                {editingBudget ? "Simpan Perubahan" : "Pasang Anggaran"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 2: TAMBAH / EDIT CELENGAN IMPIAN
         ========================================================================= */}
      <Dialog open={isGoalModalOpen} onOpenChange={setIsGoalModalOpen}>
        <DialogContent className="max-w-sm max-h-[90vh] overflow-y-auto bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
              {editingGoal
                ? "Edit Target Celengan"
                : "Buat Target Celengan Impian"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveGoal} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-stone-400">
                Nama Impian
              </label>
              <Input
                type="text"
                required
                value={goalTitle}
                onChange={(e) => setGoalTitle(e.target.value)}
                placeholder="Contoh: Beli Laptop Baru, Liburan..."
                className="font-semibold text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-stone-400">
                  Target Dana (Rp)
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  required
                  value={goalTargetInput}
                  onChange={(e) =>
                    setGoalTargetInput(formatMoneyInput(e.target.value))
                  }
                  placeholder="15.000.000"
                  className="font-bold text-xs font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-stone-400">
                  Saldo Saat Ini (Rp)
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={goalInitialInput}
                  onChange={(e) =>
                    setGoalInitialInput(formatMoneyInput(e.target.value))
                  }
                  placeholder="0"
                  className="text-xs font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-stone-400">
                Target Tanggal Tercapai (Deadline)
              </label>
              <Input
                type="date"
                required
                value={goalTargetDate}
                onChange={(e) => setGoalTargetDate(e.target.value)}
                className="text-xs font-semibold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-stone-400">
                Catatan / Keterangan
              </label>
              <Input
                type="text"
                value={goalNotes}
                onChange={(e) => setGoalNotes(e.target.value)}
                placeholder="Opsional: Rencana menabung rutin..."
                className="text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsGoalModalOpen(false)}
                className="flex-1 font-bold text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1 font-bold text-xs bg-teal-600 hover:bg-teal-500 text-white"
              >
                {editingGoal ? "Simpan Perubahan" : "Simpan Target"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 3: SETOR TABUNGAN
         ========================================================================= */}
      <Dialog
        open={!!depositGoal}
        onOpenChange={(open) => !open && setDepositGoal(null)}
      >
        <DialogContent className="max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
              Setor ke Celengan: {depositGoal?.title}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleDepositSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-stone-400">
                Nominal Setoran (Rp)
              </label>
              <Input
                type="text"
                inputMode="numeric"
                value={depositAmountInput}
                onChange={(e) =>
                  setDepositAmountInput(formatMoneyInput(e.target.value))
                }
                placeholder="Contoh: 500.000"
                className="text-base font-black font-mono h-11"
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-stone-400">
                Ambil dari Rekening / Dompet
              </label>
              <Select
                value={depositWalletId}
                onChange={(e) => setDepositWalletId(e.target.value)}
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
                onClick={() => setDepositGoal(null)}
                className="flex-1 font-bold text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                className="flex-1 font-bold text-xs bg-teal-600 hover:bg-teal-500 text-white"
              >
                Konfirmasi Setor
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          MODAL 4: KONFIRMASI HAPUS ELEGAN (SHADCN DIALOG)
         ========================================================================= */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent className="max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <DialogHeader>
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
              Hapus{" "}
              {deleteTarget?.type === "budget" ? "Anggaran" : "Target Celengan"}
              ?
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-400 pt-1">
              Apakah Anda yakin ingin menghapus{" "}
              <strong>"{deleteTarget?.title}"</strong>?
              {deleteTarget?.type === "goal" &&
                " Uang yang sudah terkumpul tidak akan hilang dari dompet Anda."}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex gap-2 pt-2 sm:justify-start">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
              className="flex-1 font-bold text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleExecuteDelete}
              className="flex-1 font-bold text-xs bg-rose-600 hover:bg-rose-500 text-white"
            >
              Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
