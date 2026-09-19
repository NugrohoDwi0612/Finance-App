"use client";

import React, { useMemo, useState, useRef } from "react";
import {
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  Scale,
  Wallet as WalletIcon,
  ArrowRightLeft,
  ChevronRight,
  Plus,
  Calendar,
  AlertTriangle,
  ReceiptText,
  CreditCard,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Coffee,
  Utensils,
  Fuel,
  ShoppingBag,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner"; // <-- Notifikasi Toast Resmi
import { useApp } from "@/context/AppContext";
import { formatRupiah, formatDateID } from "@/utils/formatters";
import { IconRenderer } from "@/components/common/IconRenderer";
import { Transaction } from "@/types";
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

interface DashboardViewProps {
  onNavigateToTransactions: () => void;
  onNavigateToWallets: () => void;
  onNavigateToBudgets: () => void;
  onOpenAddTransaction: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onOpenSmartScan: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToTransactions,
  onNavigateToWallets,
  onNavigateToBudgets,
  onOpenAddTransaction,
  onSelectTransaction,
  onOpenSmartScan,
}) => {
  const {
    wallets,
    transactions,
    categories,
    budgets,
    recurringBills,
    totalNetWorth,
    currentMonthIncome,
    currentMonthExpense,
    currentMonthCashflow,
    hideBalances,
    setHideBalances,
    user,
    colorPreset,
    quickTemplates,
    executeQuickTemplate,
    addQuickTemplate,
  } = useApp();

  // State Dialog Tambah Template Cepat
  const [isAddTemplateOpen, setIsAddTemplateOpen] = useState(false);
  const [tmplName, setTmplName] = useState("");
  const [tmplAmount, setTmplAmount] = useState("");
  const [tmplCategoryId, setTmplCategoryId] = useState(categories[0]?.id || "");
  const [tmplWalletId, setTmplWalletId] = useState(wallets[0]?.id || "");
  const [tmplIcon, setTmplIcon] = useState("Zap");

  // Drag Scroll Ref untuk Kartu Dompet di Desktop Windows
  const carouselRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!carouselRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !carouselRef.current) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleExecuteQuick = (id: string, name: string, amount: number) => {
    executeQuickTemplate(id);
    toast.success(
      `⚡ ${name} (${formatRupiah(amount, false, user.baseCurrency)}) berhasil dicatat!`,
    );
  };

  const handleSaveNewTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(tmplAmount.replace(/[^0-9]/g, ""));
    if (!tmplName.trim() || !num || num <= 0) {
      toast.error("Nama dan nominal template wajib diisi!");
      return;
    }

    addQuickTemplate({
      name: tmplName.trim(),
      amount: num,
      categoryId: tmplCategoryId || categories[0]?.id || "cat-food",
      walletId: tmplWalletId || wallets[0]?.id || "w-cash",
      type: "expense",
      iconName: tmplIcon,
    });

    setTmplName("");
    setTmplAmount("");
    setIsAddTemplateOpen(false);
    toast.success(`Template cepat "${tmplName}" berhasil dibuat!`);
  };

  // =========================================================================
  // 1. LOGIKA PRESISI: Jatah Belanja Sinkron dengan Kategori yang Dianggarkan
  // =========================================================================
  const safeToSpend = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const todayDate = now.getDate();
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const remainingDays = Math.max(1, totalDaysInMonth - todayDate + 1);

    const budgetedCategoryIds = new Set(budgets.map((b) => b.categoryId));

    const relevantExpenses = transactions.filter((t) => {
      if (t.type !== "expense") return false;
      if (t.description.toLowerCase().includes("tabungan")) return false;

      if (budgets.length > 0) {
        return budgetedCategoryIds.has(t.categoryId || "");
      }
      return true;
    });

    // 1. TENTUKAN BATAS ANGGARAN (0 JIKA BELUM ADA DATA SAMA SEKALI)
    let totalBudgetLimit = 0;
    if (budgets.length > 0) {
      totalBudgetLimit = budgets.reduce(
        (sum, b) => sum + (b.monthlyLimit || (b as any).limitAmount || 0),
        0,
      );
    } else if (currentMonthIncome > 0) {
      totalBudgetLimit = currentMonthIncome * 0.7; // 70% dari pemasukan riil
    } else {
      totalBudgetLimit = 0; // <-- KUNCI: 0 jika DB kosong (Jangan pakai angka palsu 5jt!)
    }

    const monthSpent = relevantExpenses
      .filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === year && d.getMonth() === month;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    const remainingMonthlyBudget = Math.max(0, totalBudgetLimit - monthSpent);
    const dailyAllowance =
      totalBudgetLimit > 0
        ? Math.round(remainingMonthlyBudget / remainingDays)
        : 0;

    const todayStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(todayDate).padStart(2, "0")}`;
    const todayExpenses = relevantExpenses
      .filter((t) => t.date.startsWith(todayStr))
      .reduce((sum, t) => sum + t.amount, 0);

    const remainingToday =
      totalBudgetLimit > 0 ? dailyAllowance - todayExpenses : 0;
    const percentUsedToday =
      dailyAllowance > 0
        ? Math.min(100, Math.round((todayExpenses / dailyAllowance) * 100))
        : 0;

    // 2. STATUS BADGE DINAMIS
    let statusLabel = "Aman & Terkendali";
    let statusColor =
      "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";

    if (totalBudgetLimit <= 0) {
      statusLabel = "Belum Ada Anggaran";
      statusColor =
        "text-stone-500 dark:text-stone-400 bg-stone-500/10 border-stone-500/20";
    } else if (remainingToday < 0) {
      statusLabel = "Melebihi Jatah Harian";
      statusColor =
        "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20";
    } else if (percentUsedToday >= 80) {
      statusLabel = "Mendekati Batas";
      statusColor =
        "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
    }

    return {
      totalBudgetLimit,
      remainingDays,
      dailyAllowance,
      todayExpenses,
      remainingToday,
      percentUsedToday,
      statusLabel,
      statusColor,
      hasExplicitBudget: budgets.length > 0,
    };
  }, [budgets, currentMonthIncome, transactions]);

  // 5 transaksi terakhir
  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [transactions]);

  // =========================================================================
  // 2. PERBAIKAN BUG: Tagihan Jatuh Tempo (Akurat Lintas Bulan)
  // =========================================================================
  const upcomingBills = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return recurringBills.filter((b) => {
      if (!b.isActive) return false;
      const due = new Date(b.nextDueDate);
      due.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil(
        (due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );
      return diffDays >= 0 && diffDays <= 5;
    });
  }, [recurringBills]);

  // =========================================================================
  // 3. PERBAIKAN BUG: Peringatan Anggaran (Hanya Hitung Bulan Ini!)
  // =========================================================================
  const overBudgetCategories = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    return budgets.filter((b) => {
      const spent = transactions
        .filter((t) => {
          const d = new Date(t.date);
          return (
            t.type === "expense" &&
            t.categoryId === b.categoryId &&
            d.getFullYear() === currentYear &&
            d.getMonth() === currentMonth // <-- Wajib periksa bulan ini saja!
          );
        })
        .reduce((sum, t) => sum + t.amount, 0);

      const limit = b.monthlyLimit || (b as any).limitAmount || 0;
      return spent >= limit * 0.9;
    });
  }, [budgets, transactions]);

  // Rasio tabungan
  const savingsRate = useMemo(() => {
    if (currentMonthIncome <= 0) return 0;
    return Math.max(
      0,
      Math.round((currentMonthCashflow / currentMonthIncome) * 100),
    );
  }, [currentMonthIncome, currentMonthCashflow]);

  return (
    <div className="space-y-4 pb-28 animate-fadeIn">
      {/* 1. Neobank Obsidian Metal Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-b from-stone-900 via-stone-950 to-black text-white p-5 shadow-2xl border border-white/10">
        <div
          className="absolute inset-0 pointer-events-none opacity-20 transition-all duration-700"
          style={{
            background: `radial-gradient(ellipse at top right, ${colorPreset.primaryHex}, transparent 60%)`,
          }}
        />
        <div
          className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-20 transition-all duration-700"
          style={{ backgroundColor: colorPreset.secondaryHex }}
        />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                {/* Chip Kuningan Mewah */}
                <div className="w-6 h-4.5 rounded-sm bg-linear-to-tr from-amber-300 via-amber-200 to-yellow-100 border border-amber-400/80 shadow-xs flex items-center justify-center p-0.5 relative overflow-hidden">
                  <div className="w-full h-full border border-amber-700/30 rounded-2xs grid grid-cols-2 gap-0.5 opacity-80" />
                  <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
                </div>

                {/* Ikon Gelombang Contactless / Wireless NFC */}
                <svg
                  className="w-3.5 h-3.5 text-stone-400 rotate-90"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                  <path d="M8.5 15.5a6 6 0 0 1 7 0" />
                  <path d="M12 18.5a1 1 0 0 1 0 0" />
                </svg>
              </div>
              <span className="text-[10px] font-mono tracking-widest text-stone-400 uppercase">
                CATATUANG • {user.baseCurrency}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setHideBalances((prev) => !prev)}
              className="h-7 px-2.5 rounded-full bg-white/10 hover:bg-white/20 text-stone-300 hover:text-white border-white/10 backdrop-blur-md text-[10px] font-semibold gap-1.5"
              title={hideBalances ? "Tampilkan Nominal" : "Samarkan Saldo"}
            >
              {hideBalances ? (
                <EyeOff className="w-3.5 h-3.5" />
              ) : (
                <Eye className="w-3.5 h-3.5" />
              )}
              <span>{hideBalances ? "Sensor Aktif" : "Privasi"}</span>
            </Button>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1">
              Total Kekayaan Bersih
            </span>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight font-mono text-white">
              {formatRupiah(totalNetWorth, hideBalances, user.baseCurrency)}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10">
            <Button
              onClick={onOpenAddTransaction}
              style={{
                background: `linear-gradient(135deg, ${colorPreset.primaryHex}, ${colorPreset.secondaryHex})`,
                boxShadow: `0 8px 20px -4px ${colorPreset.primaryHex}50`,
              }}
              size="sm"
              className="text-white font-black text-xs hover:brightness-110 h-9"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span className="truncate">Catat</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onOpenSmartScan}
              className="bg-white/10 hover:bg-white/15 text-white border-white/10 backdrop-blur-md text-xs font-bold h-9"
            >
              <ReceiptText className="w-3.5 h-3.5 text-stone-300" />
              <span className="truncate">Scan OCR</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToWallets}
              className="bg-white/10 hover:bg-white/15 text-white border-white/10 backdrop-blur-md text-xs font-bold h-9"
            >
              <CreditCard className="w-3.5 h-3.5 text-stone-300" />
              <span className="truncate">Dompet</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Asymmetric Bento Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        <Card className="col-span-2 p-4 space-y-3 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: `${colorPreset.primaryHex}18`,
                  color: colorPreset.primaryHex,
                }}
              >
                <Scale className="w-3.5 h-3.5 stroke-[2.5]" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                Arus Kas Bersih
              </span>
            </div>

            <Badge
              variant={currentMonthCashflow >= 0 ? "secondary" : "destructive"}
              className={`text-[10px] font-black uppercase tracking-wider ${
                currentMonthCashflow >= 0
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
              }`}
            >
              {currentMonthCashflow >= 0 ? "Surplus Finansial" : "Defisit Kas"}
            </Badge>
          </div>

          <div className="flex items-baseline justify-between">
            <div
              className={`text-xl font-extrabold font-mono truncate ${
                currentMonthCashflow >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {formatRupiah(
                currentMonthCashflow,
                hideBalances,
                user.baseCurrency,
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] text-stone-400 block font-medium">
                Rasio Simpanan
              </span>
              <span className="text-xs font-black text-stone-800 dark:text-stone-200">
                {savingsRate}%
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="h-2 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden p-0.5 flex">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, Math.max(5, savingsRate))}%`,
                  background: `linear-gradient(90deg, ${colorPreset.primaryHex}, ${colorPreset.secondaryHex})`,
                }}
              />
            </div>
            <div className="flex justify-between text-[9px] text-stone-400 font-medium">
              <span>Pengeluaran terkendali</span>
              <span>{savingsRate}% tersimpan bulan ini</span>
            </div>
          </div>
        </Card>

        <Card className="p-3.5 flex flex-col justify-between bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
          <div className="flex items-center justify-between mb-2 text-emerald-600 dark:text-emerald-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Masuk
            </span>
            <div className="w-5 h-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <TrendingUp className="w-3 h-3 stroke-[2.5]" />
            </div>
          </div>
          <div>
            <div className="text-sm sm:text-base font-black font-mono text-emerald-600 dark:text-emerald-400 truncate">
              {formatRupiah(
                currentMonthIncome,
                hideBalances,
                user.baseCurrency,
              )}
            </div>
            <span className="text-[10px] text-stone-400 font-medium mt-0.5 block">
              Bulan ini
            </span>
          </div>
        </Card>

        <Card className="p-3.5 flex flex-col justify-between bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
          <div className="flex items-center justify-between mb-2 text-rose-600 dark:text-rose-400">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Keluar
            </span>
            <div className="w-5 h-5 rounded-full bg-rose-500/10 flex items-center justify-center">
              <TrendingDown className="w-3 h-3 stroke-[2.5]" />
            </div>
          </div>
          <div>
            <div className="text-sm sm:text-base font-black font-mono text-rose-600 dark:text-rose-400 truncate">
              {formatRupiah(
                currentMonthExpense,
                hideBalances,
                user.baseCurrency,
              )}
            </div>
            <span className="text-[10px] text-stone-400 font-medium mt-0.5 block">
              Bulan ini
            </span>
          </div>
        </Card>
      </div>

      {/* 2.5. Safe-to-Spend Widget (Jatah Belanja Hari Ini) */}
      <Card className="p-4 relative overflow-hidden bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center transition-colors text-white shadow-xs"
              style={{ backgroundColor: colorPreset.primaryHex }}
            >
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Jatah Belanja Hari Ini
              </h3>
              <p className="text-[10px] text-stone-400 font-medium">
                Safe-to-Spend • Sisa {safeToSpend.remainingDays} hari di bulan
                ini
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className={`text-[10px] font-bold ${safeToSpend.statusColor}`}
          >
            {safeToSpend.statusLabel}
          </Badge>
        </div>

        <div className="flex items-baseline justify-between mb-2">
          <div>
            <div
              className={`text-2xl font-black font-mono tracking-tight ${
                safeToSpend.remainingToday >= 0
                  ? "text-stone-900 dark:text-stone-100"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {formatRupiah(
                Math.max(0, safeToSpend.remainingToday),
                hideBalances,
                user.baseCurrency,
              )}
            </div>
            <p className="text-[10px] text-stone-400 font-medium mt-0.5">
              {safeToSpend.remainingToday >= 0
                ? "Sisa uang yang aman dibelanjakan hari ini"
                : `Melebihi jatah harian sebesar ${formatRupiah(Math.abs(safeToSpend.remainingToday), hideBalances, user.baseCurrency)}`}
            </p>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-stone-400 block font-medium">
              Terpakai Hari Ini
            </span>
            <span className="text-xs font-mono font-bold text-stone-700 dark:text-stone-300">
              {formatRupiah(
                safeToSpend.todayExpenses,
                hideBalances,
                user.baseCurrency,
              )}
            </span>
          </div>
        </div>

        <div className="space-y-1 mt-2">
          <div className="h-2 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden flex">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                safeToSpend.remainingToday < 0
                  ? "bg-rose-500"
                  : safeToSpend.percentUsedToday >= 80
                    ? "bg-amber-500"
                    : "bg-emerald-500"
              }`}
              style={{
                width: `${Math.min(100, Math.max(4, safeToSpend.percentUsedToday))}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[9px] text-stone-400">
            <span>
              Alokasi harian:{" "}
              {formatRupiah(
                safeToSpend.dailyAllowance,
                hideBalances,
                user.baseCurrency,
              )}
              /hari
            </span>
            <span>{safeToSpend.percentUsedToday}% jatah terpakai</span>
          </div>
        </div>
      </Card>

      {/* 2.6. Transaksi Cepat / Favorit (1-Tap Fast Actions) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Transaksi Cepat ⚡
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsAddTemplateOpen(true)}
            style={{ color: colorPreset.primaryHex }}
            className="h-7 px-2 text-xs font-bold gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Tambah</span>
          </Button>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none snap-x">
          {quickTemplates.map((t) => {
            const cat = categories.find((c) => c.id === t.categoryId);
            const w = wallets.find((wal) => wal.id === t.walletId);

            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleExecuteQuick(t.id, t.name, t.amount)}
                className="group snap-start shrink-0 text-left bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 hover:border-stone-400 dark:hover:border-stone-600 active:scale-95 transition-all p-3 rounded-2xl flex items-center gap-3 w-48 shadow-2xs relative"
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-white shadow-xs transition-transform group-hover:scale-105"
                  style={{
                    backgroundColor: cat?.color || colorPreset.primaryHex,
                  }}
                >
                  <IconRenderer
                    name={t.iconName || cat?.iconName || "Zap"}
                    size={16}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                    {t.name}
                  </p>
                  <p className="text-xs font-mono font-black text-rose-600 dark:text-rose-400">
                    -{formatRupiah(t.amount, hideBalances, user.baseCurrency)}
                  </p>
                  <span className="text-[9px] text-stone-400 block truncate">
                    via {w?.name || "Kas"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Alerts Capsule */}
      {(upcomingBills.length > 0 || overBudgetCategories.length > 0) && (
        <div className="space-y-2">
          {upcomingBills.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  <strong>{upcomingBills.length} Tagihan Rutin</strong> segera
                  jatuh tempo ({upcomingBills[0].title}).
                </span>
              </div>
            </div>
          )}
          {overBudgetCategories.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-900 dark:text-rose-200 text-xs">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>
                  <strong>{overBudgetCategories.length} Kategori</strong>{" "}
                  hampir/melebihi batas anggaran!
                </span>
              </div>
              <Button
                variant="link"
                size="sm"
                onClick={onNavigateToBudgets}
                className="font-bold text-[11px] text-rose-600 dark:text-rose-400 h-auto p-0"
              >
                Cek
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 4. Rekening & Dompet (Swipable + Drag Mouse) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <WalletIcon className="w-3.5 h-3.5 text-stone-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
              Rekening & Dompet ({wallets.length})
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateToWallets}
            style={{ color: colorPreset.primaryHex }}
            className="h-7 px-2 text-xs font-bold gap-1"
          >
            <span>Kelola</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div
          ref={carouselRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeaveOrUp}
          onMouseUp={handleMouseLeaveOrUp}
          onMouseMove={handleMouseMove}
          className={`-mx-3.5 px-3.5 flex gap-3 overflow-x-auto overscroll-x-contain pb-2 pt-0.5 scrollbar-none snap-x snap-mandatory touch-pan-x select-none ${
            isDragging ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          {wallets.map((w) => (
            <Card
              key={w.id}
              onClick={() => {
                if (!isDragging) onNavigateToWallets();
              }}
              className="snap-start shrink-0 w-48 p-4 hover:border-stone-400 dark:hover:border-stone-600 cursor-pointer transition flex flex-col justify-between relative overflow-hidden bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800"
            >
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: w.color }}
              />

              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: w.color }}
                >
                  <IconRenderer name={w.iconName} size={16} />
                </div>
                <span className="text-[9px] font-mono font-bold text-stone-400 uppercase tracking-widest">
                  •••• {w.id.slice(-4)}
                </span>
              </div>

              <div>
                <p className="text-xs font-bold text-stone-800 dark:text-stone-200 truncate">
                  {w.name}
                </p>
                <p className="text-sm font-black font-mono text-stone-900 dark:text-stone-100 mt-0.5">
                  {formatRupiah(w.balance, hideBalances, user.baseCurrency)}
                </p>
                <span className="text-[9px] text-stone-400 uppercase tracking-wider font-semibold block mt-1">
                  {w.institution || w.category}
                </span>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 5. Riwayat Transaksi Terkini */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
            Aktivitas Terkini
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={onNavigateToTransactions}
            style={{ color: colorPreset.primaryHex }}
            className="h-7 px-2 text-xs font-bold gap-1"
          >
            <span>Semua</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        {recentTransactions.length === 0 ? (
          <Card className="p-8 text-center bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
            <p className="text-xs text-stone-500 mb-2">
              Belum ada catatan transaksi.
            </p>
            <Button
              variant="link"
              onClick={onOpenAddTransaction}
              style={{ color: colorPreset.primaryHex }}
              className="text-xs font-bold"
            >
              Tambah Transaksi Pertama
            </Button>
          </Card>
        ) : (
          <Card className="p-0 overflow-hidden divide-y divide-stone-100 dark:divide-stone-800 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs">
            {recentTransactions.map((tx) => {
              const cat = categories.find((c) => c.id === tx.categoryId);
              const sourceWallet = wallets.find((w) => w.id === tx.walletId);
              const destWallet = tx.toWalletId
                ? wallets.find((w) => w.id === tx.toWalletId)
                : null;

              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="p-3.5 flex items-center justify-between hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer transition active:bg-stone-100"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-xs"
                      style={{
                        backgroundColor:
                          tx.type === "transfer"
                            ? "#6366f1"
                            : cat?.color || "#0d9488",
                      }}
                    >
                      {tx.type === "transfer" ? (
                        <ArrowRightLeft className="w-4.5 h-4.5" />
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
                      <div className="flex items-center gap-1.5 text-[10px] text-stone-400 truncate mt-0.5">
                        <span>{formatDateID(tx.date, { short: true })}</span>
                        <span>•</span>
                        <span>
                          {tx.type === "transfer"
                            ? `${sourceWallet?.name} → ${destWallet?.name}`
                            : sourceWallet?.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 ml-3">
                    <div
                      className={`text-xs sm:text-sm font-black font-mono ${
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
                      {formatRupiah(tx.amount, hideBalances, user.baseCurrency)}
                    </div>
                    {tx.receiptImage && (
                      <span className="text-[9px] text-teal-600 dark:text-teal-400 flex items-center justify-end gap-0.5 mt-0.5 font-bold uppercase tracking-wider">
                        <ReceiptText className="w-3 h-3" /> OCR Struk
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </Card>
        )}
      </div>

      {/* Dialog Tambah Template Cepat */}
      <Dialog open={isAddTemplateOpen} onOpenChange={setIsAddTemplateOpen}>
        <DialogContent className="sm:max-w-md bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-stone-900 dark:text-stone-100">
              <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>Tambah Transaksi Favorit Cepat</span>
            </DialogTitle>
            <DialogDescription className="text-stone-400">
              Buat tombol pintasan untuk transaksi pengeluaran rutin Anda sekali
              tap.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveNewTemplate} className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Nama Transaksi
              </label>
              <Input
                type="text"
                placeholder="Contoh: Kopi Susu, Bensin Motor..."
                value={tmplName}
                onChange={(e) => setTmplName(e.target.value)}
                className="text-xs h-9"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Nominal (Rp)
              </label>
              <Input
                type="number"
                placeholder="25000"
                value={tmplAmount}
                onChange={(e) => setTmplAmount(e.target.value)}
                className="text-xs font-mono font-bold h-9"
                required
                min="1000"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Kategori
                </label>
                <Select
                  value={tmplCategoryId}
                  onChange={(e) => setTmplCategoryId(e.target.value)}
                  className="text-xs"
                >
                  {categories
                    .filter((c) => c.type === "expense")
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Sumber Dompet
                </label>
                <Select
                  value={tmplWalletId}
                  onChange={(e) => setTmplWalletId(e.target.value)}
                  className="text-xs"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Pilihan Ikon
              </label>
              <div className="flex gap-2 pt-1">
                {["Coffee", "Utensils", "Fuel", "ShoppingBag", "Zap"].map(
                  (ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setTmplIcon(ic)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center border transition-all ${
                        tmplIcon === ic
                          ? "border-stone-900 dark:border-white bg-stone-100 dark:bg-stone-800 scale-110 shadow-xs"
                          : "border-stone-200 dark:border-stone-700 hover:bg-stone-50"
                      }`}
                    >
                      <IconRenderer name={ic} size={16} />
                    </button>
                  ),
                )}
              </div>
            </div>

            <DialogFooter className="pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddTemplateOpen(false)}
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                style={{ backgroundColor: colorPreset.primaryHex }}
                className="text-white font-bold"
              >
                Simpan Transaksi Cepat
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
