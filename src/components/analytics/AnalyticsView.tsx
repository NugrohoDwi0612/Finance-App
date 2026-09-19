"use client";

import React, { useState, useMemo } from "react";
import {
  PieChart as PieIcon,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Printer,
  Flame,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Wallet as WalletIcon,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Search,
  Filter,
  FileText,
  Clock,
  Sparkles,
  Share2,
  X,
  FileSpreadsheet,
  Check,
  ShieldCheck,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { formatRupiah, formatDateID } from "@/utils/formatters";
import { exportTransactionsToCSV } from "@/utils/exportCsv";
import { IconRenderer } from "@/components/common/IconRenderer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CashflowCalendar } from "./CashflowCalendar";
import { FinancialHealthCheckup } from "./FinancialHealthCheckup";
import { Transaction } from "@/types";

type TimeRange =
  | "this_month"
  | "last_month"
  | "last_3_months"
  | "this_year"
  | "custom";
type ChartTab = "category" | "trend" | "wallets" | "calendar" | "health";

export const AnalyticsView: React.FC = () => {
  const { transactions, categories, wallets, hideBalances, user, colorPreset } =
    useApp();

  const [timeRange, setTimeRange] = useState<TimeRange>("this_month");
  const [selectedWalletFilter, setSelectedWalletFilter] =
    useState<string>("all");
  const [activeChartTab, setActiveChartTab] = useState<ChartTab>("category");
  const [searchQuery, setSearchQuery] = useState("");

  // Custom date range state
  const todayStr = new Date().toISOString().slice(0, 10);
  const firstDayStr = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  )
    .toISOString()
    .slice(0, 10);
  const [customStartDate, setCustomStartDate] = useState(firstDayStr);
  const [customEndDate, setCustomEndDate] = useState(todayStr);

  // Statement / Print modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isCopiedSummary, setIsCopiedSummary] = useState(false);

  // Filter transaksi berdasarkan waktu, tanggal kustom, & dompet
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter((tx) => {
      if (
        selectedWalletFilter !== "all" &&
        tx.walletId !== selectedWalletFilter
      ) {
        return false;
      }

      const txDate = new Date(tx.date);

      if (timeRange === "this_month") {
        return (
          txDate.getMonth() === now.getMonth() &&
          txDate.getFullYear() === now.getFullYear()
        );
      } else if (timeRange === "last_month") {
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return (
          txDate.getMonth() === lastMonth.getMonth() &&
          txDate.getFullYear() === lastMonth.getFullYear()
        );
      } else if (timeRange === "last_3_months") {
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return txDate >= threeMonthsAgo && txDate <= now;
      } else if (timeRange === "this_year") {
        return txDate.getFullYear() === now.getFullYear();
      } else if (timeRange === "custom") {
        const d = tx.date.slice(0, 10);
        return d >= customStartDate && d <= customEndDate;
      }
      return true;
    });
  }, [
    transactions,
    timeRange,
    selectedWalletFilter,
    customStartDate,
    customEndDate,
  ]);

  // Kalkulasi Keuangan
  const incomeTransactions = useMemo(
    () => filteredTransactions.filter((tx) => tx.type === "income"),
    [filteredTransactions],
  );
  const expenseTransactions = useMemo(
    () => filteredTransactions.filter((tx) => tx.type === "expense"),
    [filteredTransactions],
  );

  const totalIncome = useMemo(
    () => incomeTransactions.reduce((acc, tx) => acc + tx.amount, 0),
    [incomeTransactions],
  );
  const totalExpense = useMemo(
    () => expenseTransactions.reduce((acc, tx) => acc + tx.amount, 0),
    [expenseTransactions],
  );
  const netSavings = totalIncome - totalExpense;

  const savingsRate = useMemo(() => {
    if (totalIncome <= 0) return 0;
    return Math.round((netSavings / totalIncome) * 100);
  }, [totalIncome, netSavings]);

  const daysInPeriod = useMemo(() => {
    if (timeRange === "this_month") {
      return new Date().getDate() || 1;
    } else if (timeRange === "last_month") {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    } else if (timeRange === "last_3_months") {
      return 90;
    } else if (timeRange === "this_year") {
      return 365;
    } else if (timeRange === "custom") {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      return Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    }
    return 30;
  }, [timeRange, customStartDate, customEndDate]);

  const dailyBurnRate = Math.round(totalExpense / daysInPeriod);

  // Data Pie Chart Kategori
  const categoryExpenseData = useMemo(() => {
    const map: { [catId: string]: number } = {};
    expenseTransactions.forEach((tx) => {
      const cId = tx.categoryId || "unknown";
      map[cId] = (map[cId] || 0) + tx.amount;
    });

    return Object.entries(map)
      .map(([catId, amount]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          id: catId,
          name: cat?.name || "Lain-lain",
          value: amount,
          color: cat?.color || "#0d9488",
          iconName: cat?.iconName || "Tag",
        };
      })
      .sort((a, b) => b.value - a.value);
  }, [expenseTransactions, categories]);

  // Top 5 Pengeluaran
  const top5Expenses = useMemo(() => {
    return [...expenseTransactions]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [expenseTransactions]);

  // Perbandingan 6 Bulan Terakhir Bar Chart
  const monthlyComparisonData = useMemo(() => {
    const months: {
      [key: string]: { month: string; income: number; expense: number };
    } = {};
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("id-ID", { month: "short" });
      months[key] = { month: label, income: 0, expense: 0 };
    }

    transactions.forEach((tx) => {
      const key = tx.date.slice(0, 7);
      if (months[key]) {
        if (tx.type === "income") months[key].income += tx.amount;
        if (tx.type === "expense") months[key].expense += tx.amount;
      }
    });

    return Object.values(months);
  }, [transactions]);

  // Pengeluaran per Dompet
  const walletExpenseData = useMemo(() => {
    const map: { [wId: string]: number } = {};
    expenseTransactions.forEach((tx) => {
      const wId = tx.walletId || "unknown";
      map[wId] = (map[wId] || 0) + tx.amount;
    });

    return Object.entries(map)
      .map(([wId, amount]) => {
        const w = wallets.find((item) => item.id === wId);
        return {
          id: wId,
          name: w?.name || "Dompet Lain",
          amount,
          color: w?.color || "#64748b",
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [expenseTransactions, wallets]);

  // Filter Log Transaksi
  const ledgerTransactions = useMemo(() => {
    return filteredTransactions.filter((tx) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const cat = categories.find((c) => c.id === tx.categoryId);
      const w = wallets.find((w) => w.id === tx.walletId);
      return (
        tx.description.toLowerCase().includes(q) ||
        cat?.name.toLowerCase().includes(q) ||
        w?.name.toLowerCase().includes(q)
      );
    });
  }, [filteredTransactions, searchQuery, categories, wallets]);

  const periodLabel = useMemo(() => {
    if (timeRange === "this_month") {
      return new Date().toLocaleDateString("id-ID", {
        month: "long",
        year: "numeric",
      });
    } else if (timeRange === "last_month") {
      const d = new Date();
      d.setMonth(d.getMonth() - 1);
      return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
    } else if (timeRange === "last_3_months") {
      return "3 Bulan Terakhir";
    } else if (timeRange === "this_year") {
      return `Tahun ${new Date().getFullYear()}`;
    } else {
      return `${formatDateID(customStartDate, { short: true })} s/d ${formatDateID(customEndDate, { short: true })}`;
    }
  }, [timeRange, customStartDate, customEndDate]);

  // Ekspor Dokumen Rapi (CSV / Excel)
  const handleExportDocument = (format: "csv" | "excel") => {
    if (filteredTransactions.length === 0) {
      toast.error("Tidak ada transaksi pada periode ini untuk diekspor!");
      return;
    }

    exportTransactionsToCSV(filteredTransactions, categories, wallets, {
      format,
      userName: user.name,
      userEmail: user.email,
      currency: user.baseCurrency,
      fileName: `Laporan_Keuangan_${user.name.replace(/\s+/g, "_")}_${periodLabel.replace(/\s+/g, "_")}.${format === "excel" ? "xls" : "csv"}`,
    });

    toast.success(
      `Laporan ${format === "excel" ? "Excel Berwarna (.xls)" : "CSV"} berhasil diunduh!`,
    );
  };

  const handleCopySummary = () => {
    const text = `📊 *LAPORAN KEUANGAN RESMI - CATATUANG*
👤 Pengguna: ${user.name}
📅 Periode: ${periodLabel}
----------------------------------------
💰 Total Pemasukan: ${formatRupiah(totalIncome, false, user.baseCurrency)} (${incomeTransactions.length} transaksi)
💸 Total Pengeluaran: ${formatRupiah(totalExpense, false, user.baseCurrency)} (${expenseTransactions.length} transaksi)
📈 Sisa Kas Bersih: ${formatRupiah(netSavings, false, user.baseCurrency)}
🎯 Rasio Menabung: ${savingsRate}%
🔥 Rata-rata Pengeluaran/Hari: ${formatRupiah(dailyBurnRate, false, user.baseCurrency)}
----------------------------------------
🏆 Top Pengeluaran:
${top5Expenses
  .map(
    (tx, i) =>
      `${i + 1}. ${tx.description}: ${formatRupiah(tx.amount, false, user.baseCurrency)}`,
  )
  .join("\n")}

_Diterbitkan otomatis oleh Aplikasi CatatUang PWA_`;

    navigator.clipboard.writeText(text);
    setIsCopiedSummary(true);
    toast.success("Ringkasan eksekutif berhasil disalin!");
    setTimeout(() => setIsCopiedSummary(false), 2500);
  };

  return (
    <div className="space-y-4 pb-28 animate-fadeIn">
      {/* Title & Quick Action Bar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <BarChart3
              className="w-5 h-5"
              style={{ color: colorPreset.primaryHex }}
            />
            <span>Laporan Keuangan Lengkap</span>
          </h2>
          <p className="text-xs text-stone-400">
            {periodLabel} • Analisis arus kas & ekspor laporan
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Tombol Cetak / Rekening Koran */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPrintModalOpen(true)}
            className="h-8 px-2.5 gap-1.5 font-bold text-xs bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-800"
            title="Cetak Rekening Koran Resmi"
          >
            <Printer className="w-3.5 h-3.5 text-stone-600 dark:text-stone-300" />
            <span className="hidden sm:inline">Rekening Koran</span>
          </Button>

          {/* Tombol Unduh Excel Berwarna */}
          <Button
            size="sm"
            onClick={() => handleExportDocument("excel")}
            style={{
              background: `linear-gradient(135deg, ${colorPreset.primaryHex}, ${colorPreset.secondaryHex})`,
            }}
            className="h-8 px-3 gap-1.5 text-white text-xs font-extrabold shadow-xs hover:brightness-110"
            title="Unduh Laporan Excel Berwarna (.xls)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh Excel</span>
          </Button>
        </div>
      </div>

      {/* Filter Waktu & Dompet Bar */}
      <Card className="p-3.5 space-y-2.5 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {(
            [
              { id: "this_month", label: "Bulan Ini" },
              { id: "last_month", label: "Bulan Lalu" },
              { id: "last_3_months", label: "3 Bulan" },
              { id: "this_year", label: "Tahun Ini" },
            ] as const
          ).map((tab) => {
            const isSelected = timeRange === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTimeRange(tab.id)}
                style={
                  isSelected ? { backgroundColor: colorPreset.primaryHex } : {}
                }
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                  isSelected
                    ? "text-white shadow-xs"
                    : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
          <button
            onClick={() => setTimeRange("custom")}
            style={
              timeRange === "custom"
                ? { backgroundColor: colorPreset.primaryHex }
                : {}
            }
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1 ${
              timeRange === "custom"
                ? "text-white shadow-xs"
                : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200"
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>Kustom</span>
          </button>
        </div>

        {timeRange === "custom" && (
          <div className="pt-2 border-t border-stone-100 dark:border-stone-800 grid grid-cols-2 gap-2 animate-fadeIn">
            <div>
              <label className="text-[10px] font-bold text-stone-400 block mb-1">
                Tanggal Mulai
              </label>
              <Input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="h-8 text-xs font-semibold"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-stone-400 block mb-1">
                Tanggal Akhir
              </label>
              <Input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="h-8 text-xs font-semibold"
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 pt-1">
          <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <div className="flex-1 overflow-x-auto flex items-center gap-1.5 scrollbar-none">
            <button
              onClick={() => setSelectedWalletFilter("all")}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap ${
                selectedWalletFilter === "all"
                  ? "bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-500/30"
                  : "text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
              }`}
            >
              Semua Dompet
            </button>
            {wallets.map((w) => (
              <button
                key={w.id}
                onClick={() => setSelectedWalletFilter(w.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                  selectedWalletFilter === w.id
                    ? "bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-500/30"
                    : "text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                }`}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: w.color }}
                />
                <span>{w.name}</span>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Ringkasan Finansial Eksekutif (Bento KPI Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <Card className="p-3.5 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Total Masuk
            </span>
            <ArrowDownRight className="w-3.5 h-3.5" />
          </div>
          <p className="text-sm sm:text-base font-black font-mono text-emerald-600 dark:text-emerald-400 truncate">
            {formatRupiah(totalIncome, hideBalances, user.baseCurrency)}
          </p>
          <span className="text-[10px] text-stone-400 font-medium">
            {incomeTransactions.length} transaksi
          </span>
        </Card>

        <Card className="p-3.5 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Total Keluar
            </span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
          <p className="text-sm sm:text-base font-black font-mono text-rose-600 dark:text-rose-400 truncate">
            {formatRupiah(totalExpense, hideBalances, user.baseCurrency)}
          </p>
          <span className="text-[10px] text-stone-400 font-medium">
            {expenseTransactions.length} transaksi
          </span>
        </Card>

        <Card className="p-3.5 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
          <div className="flex items-center justify-between text-teal-600 dark:text-teal-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Arus Kas Bersih
            </span>
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <p
            className={`text-sm sm:text-base font-black font-mono truncate ${
              netSavings >= 0
                ? "text-teal-600 dark:text-teal-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {formatRupiah(netSavings, hideBalances, user.baseCurrency)}
          </p>
          <span className="text-[10px] text-stone-400 font-medium">
            {netSavings >= 0 ? "Surplus Finansial" : "Defisit Kas"}
          </span>
        </Card>

        <Card className="p-3.5 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Rasio Tabungan
            </span>
            <Award className="w-3.5 h-3.5" />
          </div>
          <p className="text-sm sm:text-base font-black font-mono text-indigo-600 dark:text-indigo-400 truncate">
            {savingsRate}%
          </p>
          <span className="text-[10px] text-stone-400 font-medium">
            Burn rate:{" "}
            {formatRupiah(dailyBurnRate, hideBalances, user.baseCurrency)}/hari
          </span>
        </Card>
      </div>

      {/* Evaluasi Kesehatan Finansial */}
      <div
        className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
          savingsRate >= 20
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
            : savingsRate >= 0
              ? "bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-300"
              : "bg-rose-500/10 border-rose-500/20 text-rose-800 dark:text-rose-300"
        }`}
      >
        <div className="shrink-0">
          {savingsRate >= 20 ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          ) : savingsRate >= 0 ? (
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-500" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold leading-tight">
            {savingsRate >= 20
              ? `Kondisi Finansial Prima (${savingsRate}% Tersimpan)`
              : savingsRate >= 0
                ? `Kondisi Cukup Aman (${savingsRate}% Tersimpan)`
                : `Peringatan Defisit: Pengeluaran Melampaui Pemasukan`}
          </p>
          <p className="text-[11px] opacity-80 leading-normal mt-0.5">
            {savingsRate >= 20
              ? "Arus kas Anda sangat sehat, ideal untuk memperbesar investasi dan target tabungan impian."
              : savingsRate >= 0
                ? "Pengeluaran masih tertutup pendapatan, perhatikan kategori yang paling menguras saldo."
                : "Segera lakukan evaluasi pada pos pengeluaran terbesar untuk memulihkan stabilitas kas."}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopySummary}
            className="h-8 px-2.5 text-xs font-bold gap-1 bg-white/60 dark:bg-stone-800/60"
            title="Salin Ringkasan Teks"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="text-[10px] hidden sm:inline">
              {isCopiedSummary ? "Tersalin!" : "Bagikan"}
            </span>
          </Button>
        </div>
      </div>

      {/* Visualisasi Grafik Interaktif Tabs */}
      <Card className="p-4 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-800 dark:text-stone-200">
              Visualisasi & Komposisi
            </h3>
          </div>

          <Tabs
            value={activeChartTab}
            onValueChange={(val) => setActiveChartTab(val as ChartTab)}
          >
            <TabsList className="overflow-x-auto flex flex-nowrap scrollbar-none max-w-full bg-stone-100 dark:bg-stone-800">
              <TabsTrigger
                value="category"
                className="text-xs font-bold shrink-0"
              >
                Kategori
              </TabsTrigger>
              <TabsTrigger value="trend" className="text-xs font-bold shrink-0">
                Tren Bulanan
              </TabsTrigger>
              <TabsTrigger
                value="wallets"
                className="text-xs font-bold shrink-0"
              >
                Per Dompet
              </TabsTrigger>
              <TabsTrigger
                value="calendar"
                className="text-xs font-bold shrink-0"
              >
                Kalender Kas 📅
              </TabsTrigger>
              <TabsTrigger
                value="health"
                className="text-xs font-bold shrink-0"
              >
                Skor Kesehatan 🩺
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Tab 1: Kategori Donut Chart */}
        {activeChartTab === "category" && (
          <div>
            {categoryExpenseData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-xs text-stone-400">
                Belum ada transaksi pengeluaran pada rentang waktu ini.
              </div>
            ) : (
              <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="w-full md:w-1/2 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryExpenseData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryExpenseData.map((entry) => (
                          <Cell key={entry.id} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) =>
                          formatRupiah(
                            Number(val || 0),
                            hideBalances,
                            user.baseCurrency,
                          )
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="w-full md:w-1/2 space-y-2 max-h-56 overflow-y-auto pr-1">
                  {categoryExpenseData.map((cat) => {
                    const percentage =
                      totalExpense > 0
                        ? Math.round((cat.value / totalExpense) * 100)
                        : 0;
                    return (
                      <div
                        key={cat.id}
                        className="flex items-center justify-between text-xs p-1.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800 transition"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span className="text-stone-700 dark:text-stone-300 font-semibold truncate">
                            {cat.name}
                          </span>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-2 font-mono">
                          <span className="font-bold text-stone-900 dark:text-stone-100">
                            {formatRupiah(
                              cat.value,
                              hideBalances,
                              user.baseCurrency,
                            )}
                          </span>
                          <span className="text-[10px] text-stone-400 w-8 text-right font-bold">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Tren Bulanan Bar Chart */}
        {activeChartTab === "trend" && (
          <div className="space-y-2">
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={monthlyComparisonData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    opacity={0.15}
                  />
                  <XAxis
                    dataKey="month"
                    tickLine={false}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    tickLine={false}
                    tick={{ fontSize: 10 }}
                    tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip
                    formatter={(val: any) =>
                      formatRupiah(
                        Number(val || 0),
                        hideBalances,
                        user.baseCurrency,
                      )
                    }
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                    iconType="circle"
                  />
                  <Bar
                    dataKey="income"
                    name="Pemasukan"
                    fill="#10b981"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="expense"
                    name="Pengeluaran"
                    fill="#f43f5e"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 3: Per Dompet */}
        {activeChartTab === "wallets" && (
          <div className="space-y-3">
            {walletExpenseData.length === 0 ? (
              <div className="h-40 flex items-center justify-center text-xs text-stone-400">
                Belum ada transaksi pada akun dompet ini.
              </div>
            ) : (
              walletExpenseData.map((item) => {
                const pct =
                  totalExpense > 0
                    ? Math.round((item.amount / totalExpense) * 100)
                    : 0;
                return (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-800 dark:text-stone-200">
                        {item.name}
                      </span>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-extrabold text-stone-900 dark:text-stone-100">
                          {formatRupiah(
                            item.amount,
                            hideBalances,
                            user.baseCurrency,
                          )}
                        </span>
                        <span className="text-[10px] font-bold text-stone-400 w-8 text-right">
                          {pct}%
                        </span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {activeChartTab === "calendar" && <CashflowCalendar />}
        {activeChartTab === "health" && <FinancialHealthCheckup />}
      </Card>

      {/* Rincian Buku Kas / Log Transaksi Laporan */}
      <Card className="p-4 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-stone-800 dark:text-stone-200">
              Buku Kas & Log Transaksi ({ledgerTransactions.length})
            </h3>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari transaksi laporan..."
              className="w-full sm:w-56 pl-8 pr-3 h-8 text-xs"
            />
          </div>
        </div>

        {ledgerTransactions.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400">
            Tidak ada transaksi yang cocok dengan kriteria laporan ini.
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800 max-h-96 overflow-y-auto pr-1">
            {ledgerTransactions.map((tx) => {
              const cat = categories.find((c) => c.id === tx.categoryId);
              const w = wallets.find((wal) => wal.id === tx.walletId);
              const isIncome = tx.type === "income";

              return (
                <div
                  key={tx.id}
                  className="py-2.5 flex items-center justify-between gap-2.5 hover:bg-stone-50/60 dark:hover:bg-stone-800/40 px-2 rounded-xl transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${cat?.color || "#0d9488"}20`,
                        color: cat?.color || "#0d9488",
                      }}
                    >
                      <IconRenderer
                        name={cat?.iconName || "Tag"}
                        className="w-4 h-4"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                        {tx.description}
                      </p>
                      <p className="text-[10px] text-stone-400 flex items-center gap-1.5 truncate">
                        <span>{formatDateID(tx.date)}</span>
                        <span>•</span>
                        <span>{cat?.name || "Umum"}</span>
                        <span>•</span>
                        <span>{w?.name || "Dompet"}</span>
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-xs font-black font-mono shrink-0 ${
                      isIncome
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {isIncome ? "+" : "-"}
                    {formatRupiah(tx.amount, hideBalances, user.baseCurrency)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* =========================================================================
          MODAL REKENING KORAN RESMI (OFFICIAL FINANCIAL STATEMENT)
         ========================================================================= */}
      <Dialog open={isPrintModalOpen} onOpenChange={setIsPrintModalOpen}>
        <DialogContent className="max-w-xl bg-white text-stone-900 max-h-[92vh] overflow-y-auto p-6 border shadow-2xl rounded-3xl">
          {/* HEADER RESMI REKENING KORAN */}
          <div className="border-b-2 border-stone-900 pb-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-black text-base shadow-sm">
                  CU
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tight text-stone-900">
                    CATATUANG FINANCIAL STATEMENT
                  </h3>
                  <p className="text-xs text-stone-500 font-semibold">
                    Laporan Rekening Koran & Evaluasi Arus Kas Terpadu
                  </p>
                </div>
              </div>

              <div className="text-right">
                <Badge className="bg-teal-600 text-white text-[10px] font-black uppercase tracking-wider px-2 py-0.5">
                  RESMI
                </Badge>
                <p className="text-[10px] text-stone-400 font-mono mt-1">
                  NO: DOC-CU-
                  {new Date().toISOString().slice(0, 10).replace(/-/g, "")}-
                  {Math.floor(1000 + Math.random() * 9000)}
                </p>
              </div>
            </div>

            {/* METADATA NASABAH / PENGGUNA */}
            <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-stone-100 text-xs text-stone-600">
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Pemilik Rekening / Akun
                </p>
                <p className="font-bold text-stone-900 text-sm mt-0.5">
                  {user.name}
                </p>
                <p className="text-stone-500 font-mono">{user.email}</p>
              </div>

              <div className="text-right">
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Periode Pembukuan
                </p>
                <p className="font-bold text-stone-900 text-sm mt-0.5">
                  {periodLabel}
                </p>
                <p className="text-stone-500">
                  Dicetak:{" "}
                  {new Date().toLocaleDateString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>

          {/* KARTU RINGKASAN ARUS KAS (EXECUTIVE SUMMARY) */}
          <div className="grid grid-cols-3 gap-3 my-4 p-3.5 bg-stone-50 rounded-2xl border border-stone-200 text-center">
            <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200/60">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">
                Total Pemasukan
              </span>
              <p className="text-sm font-black text-emerald-700 font-mono mt-0.5">
                {formatRupiah(totalIncome, false, user.baseCurrency)}
              </p>
              <span className="text-[9px] text-emerald-600 font-semibold">
                {incomeTransactions.length} Transaksi
              </span>
            </div>

            <div className="p-2 rounded-xl bg-rose-50 border border-rose-200/60">
              <span className="text-[10px] font-bold text-rose-800 uppercase block">
                Total Pengeluaran
              </span>
              <p className="text-sm font-black text-rose-700 font-mono mt-0.5">
                {formatRupiah(totalExpense, false, user.baseCurrency)}
              </p>
              <span className="text-[9px] text-rose-600 font-semibold">
                {expenseTransactions.length} Transaksi
              </span>
            </div>

            <div
              className={`p-2 rounded-xl border ${netSavings >= 0 ? "bg-teal-50 border-teal-200 text-teal-800" : "bg-rose-50 border-rose-200 text-rose-800"}`}
            >
              <span className="text-[10px] font-bold uppercase block">
                Arus Kas Bersih
              </span>
              <p
                className={`text-sm font-black font-mono mt-0.5 ${netSavings >= 0 ? "text-teal-700" : "text-rose-700"}`}
              >
                {formatRupiah(netSavings, false, user.baseCurrency)}
              </p>
              <span className="text-[9px] font-semibold">
                {savingsRate}% Tersimpan
              </span>
            </div>
          </div>

          {/* TABEL RINCIAN TRANSAKSI */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-stone-800">
                Log Mutasi Transaksi ({filteredTransactions.length} Catatan)
              </h4>
              <span className="text-[10px] text-stone-400 font-mono">
                Mata Uang: {user.baseCurrency}
              </span>
            </div>

            <div className="border border-stone-200 rounded-2xl overflow-hidden max-h-64 overflow-y-auto shadow-2xs">
              <table className="w-full text-left text-[11px] border-collapse">
                <thead className="bg-stone-100 text-stone-700 font-extrabold border-b border-stone-200">
                  <tr>
                    <th className="p-2.5">Tgl</th>
                    <th className="p-2.5">Jenis</th>
                    <th className="p-2.5">Kategori</th>
                    <th className="p-2.5">Deskripsi</th>
                    <th className="p-2.5 text-right">
                      Nominal ({user.baseCurrency})
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 font-medium">
                  {filteredTransactions.map((tx, idx) => {
                    const cat = categories.find((c) => c.id === tx.categoryId);
                    const isIncome = tx.type === "income";
                    const isTransfer = tx.type === "transfer";

                    return (
                      <tr
                        key={tx.id}
                        className={
                          idx % 2 === 1 ? "bg-stone-50/60" : "bg-white"
                        }
                      >
                        <td className="p-2.5 whitespace-nowrap text-stone-500 font-mono">
                          {tx.date.slice(5, 10)}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-1.5 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wider ${
                              isIncome
                                ? "bg-emerald-100 text-emerald-800"
                                : isTransfer
                                  ? "bg-indigo-100 text-indigo-800"
                                  : "bg-rose-100 text-rose-800"
                            }`}
                          >
                            {isIncome
                              ? "Masuk"
                              : isTransfer
                                ? "Transfer"
                                : "Keluar"}
                          </span>
                        </td>
                        <td className="p-2.5 text-stone-700 truncate max-w-[100px]">
                          {cat?.name || (isTransfer ? "Transfer" : "-")}
                        </td>
                        <td className="p-2.5 font-bold text-stone-900 truncate max-w-[150px]">
                          {tx.description}
                        </td>
                        <td
                          className={`p-2.5 text-right font-black font-mono whitespace-nowrap ${
                            isIncome
                              ? "text-emerald-600"
                              : isTransfer
                                ? "text-indigo-600"
                                : "text-rose-600"
                          }`}
                        >
                          {isIncome ? "+" : isTransfer ? "↔" : "-"}{" "}
                          {tx.amount.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* FOOTER & TANDA TANGAN ELEKTRONIK */}
          <div className="mt-4 pt-3 border-t border-stone-200 flex items-center justify-between text-[10px] text-stone-500">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>
                Dokumen sah diterbitkan secara digital oleh CatatUang Financial
                System.
              </span>
            </div>

            <div className="text-right font-mono font-semibold">
              <span>Status: TERVERIFIKASI ✓</span>
            </div>
          </div>

          {/* TOMBOL AKSI MODAL */}
          <DialogFooter className="flex items-center justify-between pt-4 border-t mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPrintModalOpen(false)}
            >
              Tutup
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleExportDocument("excel")}
                className="gap-1.5 font-bold text-xs"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Simpan Excel (.xls)</span>
              </Button>

              <Button
                size="sm"
                onClick={() => window.print()}
                className="gap-1.5 font-bold text-xs bg-teal-600 hover:bg-teal-500 text-white"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak / PDF</span>
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
