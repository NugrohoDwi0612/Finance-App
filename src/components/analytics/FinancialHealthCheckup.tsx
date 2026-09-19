"use client";

import React, { useMemo } from "react";
import {
  ShieldCheck,
  Award,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  PieChart,
  Calendar,
  Sparkles,
  ArrowRight,
  Share2,
  Check,
  AlertCircle,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { formatRupiah } from "../../utils/formatters";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";

export const FinancialHealthCheckup: React.FC = () => {
  const {
    currentMonthIncome,
    currentMonthExpense,
    currentMonthCashflow,
    wallets,
    budgets,
    transactions,
    recurringBills,
    user,
    colorPreset,
    setCurrentTab,
  } = useApp();

  // 1. Calculations for the 4 pillars
  const checkup = useMemo(() => {
    // Pillar 1: Savings Rate (Max 30)
    let savingsRate = 0;
    if (currentMonthIncome > 0) {
      savingsRate = Math.round(
        (currentMonthCashflow / currentMonthIncome) * 100,
      );
    }

    let p1Score = 0;
    let p1Status = "";
    if (savingsRate >= 25) {
      p1Score = 30;
      p1Status = "Sangat Baik (≥25%)";
    } else if (savingsRate >= 15) {
      p1Score = 24;
      p1Status = "Baik (15-24%)";
    } else if (savingsRate >= 5) {
      p1Score = 15;
      p1Status = "Cukup (5-14%)";
    } else if (savingsRate >= 0) {
      p1Score = 8;
      p1Status = "Tipis (<5%)";
    } else {
      p1Score = 0;
      p1Status = "Defisit (Pengeluaran > Pemasukan)";
    }

    // Pillar 2: Emergency Fund Cushion (Max 25)
    const liquidBalance = wallets
      .filter((w) => w.category === "cash" || w.category === "bank")
      .reduce((sum, w) => sum + Math.max(0, w.balance), 0);

    const monthlyBurn = currentMonthExpense > 0 ? currentMonthExpense : 4000000;
    const monthsCovered = parseFloat((liquidBalance / monthlyBurn).toFixed(1));

    let p2Score = 0;
    let p2Status = "";
    if (monthsCovered >= 6) {
      p2Score = 25;
      p2Status = `${monthsCovered} Bulan Pengeluaran (Sangat Aman)`;
    } else if (monthsCovered >= 3) {
      p2Score = 20;
      p2Status = `${monthsCovered} Bulan Pengeluaran (Ideal)`;
    } else if (monthsCovered >= 1) {
      p2Score = 12;
      p2Status = `${monthsCovered} Bulan Pengeluaran (Minimal)`;
    } else {
      p2Score = 5;
      p2Status = `< 1 Bulan Pengeluaran (Rentan)`;
    }

    // Pillar 3: Budget Adherence (Max 25)
    let p3Score = 25;
    let p3Status = "Anggaran Terkendali";
    let overBudgetCount = 0;

    if (budgets.length > 0) {
      budgets.forEach((b) => {
        const spent = transactions
          .filter((t) => t.type === "expense" && t.categoryId === b.categoryId)
          .reduce((sum, t) => sum + t.amount, 0);
        const limit = b.monthlyLimit || (b as any).limitAmount || 0;
        if (spent > limit) overBudgetCount++;
      });

      if (overBudgetCount === 0) {
        p3Score = 25;
        p3Status = "100% Sesuai Target Anggaran";
      } else if (overBudgetCount === 1) {
        p3Score = 16;
        p3Status = "1 Kategori Melebihi Batas";
      } else {
        p3Score = 8;
        p3Status = `${overBudgetCount} Kategori Jebol`;
      }
    } else {
      // Neutral if no budget
      p3Score = 15;
      p3Status = "Belum menetapkan batas anggaran";
    }

    // Pillar 4: Recurring Bills & Debt Coverage (Max 20)
    const monthlyBillsTotal = recurringBills.reduce(
      (sum, b) => sum + b.amount,
      0,
    );
    const billsRatio =
      currentMonthIncome > 0
        ? Math.round((monthlyBillsTotal / currentMonthIncome) * 100)
        : 0;

    let p4Score = 20;
    let p4Status = "";
    if (billsRatio <= 25) {
      p4Score = 20;
      p4Status = `Beban Rutin ${billsRatio}% (Rendah & Sehat)`;
    } else if (billsRatio <= 40) {
      p4Score = 15;
      p4Status = `Beban Rutin ${billsRatio}% (Sedang)`;
    } else {
      p4Score = 8;
      p4Status = `Beban Rutin ${billsRatio}% (Tinggi)`;
    }

    // Total Score
    const totalScore = Math.min(
      100,
      Math.max(0, p1Score + p2Score + p3Score + p4Score),
    );

    let grade = "A";
    let gradeLabel = "Sangat Sehat";
    let gradeColor =
      "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    let summaryText =
      "Arus kas dan struktur aset Anda berada dalam performa prima. Pertahankan disiplin alokasi.";

    if (totalScore >= 88) {
      grade = "A+";
      gradeLabel = "Kondisi Finansial Prima";
      gradeColor =
        "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      summaryText =
        "Luar biasa! Pengelolaan keuangan Anda terencana dengan rapi, cadangan kas solid, dan belanja sangat terkendali.";
    } else if (totalScore >= 72) {
      grade = "A";
      gradeLabel = "Sehat & Terkendali";
      gradeColor =
        "text-teal-600 dark:text-teal-400 bg-teal-500/10 border-teal-500/20";
      summaryText =
        "Kondisi keuangan cukup stabil. Ada beberapa ruang efisiensi kecil untuk memperbesar porsi tabungan investasi.";
    } else if (totalScore >= 52) {
      grade = "B";
      gradeLabel = "Cukup Baik (Perlu Optimalisasi)";
      gradeColor =
        "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
      summaryText =
        "Finansial berjalan cukup aman namun bantalan darurat atau rasio tabungan masih perlu ditingkatkan.";
    } else {
      grade = "C";
      gradeLabel = "Perlu Perhatian & Evaluasi";
      gradeColor =
        "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20";
      summaryText =
        "Perhatikan pengeluaran harian dan tagihan rutin Anda untuk menghindari defisit bulanan berkepanjangan.";
    }

    // Action recommendations
    const recommendations: {
      title: string;
      desc: string;
      actionText?: string;
      actionTab?: string;
    }[] = [];

    if (savingsRate < 20) {
      recommendations.push({
        title: "Tingkatkan Rasio Tabungan ke Minimal 20%",
        desc: `Saat ini rasio tersimpan Anda ${savingsRate}%. Alihkan 5-10% dari pos pengeluaran gaya hidup ke tabungan di awal bulan.`,
      });
    }

    if (monthsCovered < 3) {
      recommendations.push({
        title: "Pertebal Bantalan Dana Darurat",
        desc: `Saldo likuid Anda saat ini menutup ${monthsCovered} bulan pengeluaran. Targetkan minimal 3-6 bulan pengeluaran untuk perlindungan optimal.`,
        actionText: "Buka Kalkulator Dana Darurat",
        actionTab: "smart",
      });
    }

    if (budgets.length === 0 || overBudgetCount > 0) {
      recommendations.push({
        title:
          budgets.length === 0
            ? "Pasang Batas Anggaran Bulanan"
            : "Perbaiki Kategori yang Over-Budget",
        desc: "Menetapkan limit pengeluaran per kategori membantu mencegah uang habis tanpa disadari sebelum akhir bulan.",
        actionText: "Kelola Anggaran",
        actionTab: "budgets",
      });
    }

    return {
      totalScore,
      grade,
      gradeLabel,
      gradeColor,
      summaryText,
      savingsRate,
      liquidBalance,
      monthsCovered,
      p1: { score: p1Score, max: 30, status: p1Status },
      p2: { score: p2Score, max: 25, status: p2Status },
      p3: { score: p3Score, max: 25, status: p3Status },
      p4: { score: p4Score, max: 20, status: p4Status },
      recommendations,
    };
  }, [
    currentMonthIncome,
    currentMonthExpense,
    currentMonthCashflow,
    wallets,
    budgets,
    transactions,
    recurringBills,
  ]);

  return (
    <div className="space-y-4">
      {/* Hero Score Card */}
      <Card className="p-5 text-center relative overflow-hidden border-stone-200/80 dark:border-stone-800 bg-linear-to-b from-stone-50 via-white to-stone-50 dark:from-stone-900 dark:via-stone-950 dark:to-stone-900">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-left">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: colorPreset.primaryHex }}
            >
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-700 dark:text-stone-300">
                Skor Kesehatan Finansial
              </h3>
              <p className="text-[10px] text-stone-400 font-medium">
                Evaluasi komprehensif 4 pilar kesehatan keuangan
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className={`text-xs font-black px-2.5 py-0.5 ${checkup.gradeColor}`}
          >
            Grade {checkup.grade} • {checkup.gradeLabel}
          </Badge>
        </div>

        {/* Large Score Circle / Meter */}
        <div className="my-3 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center">
            <div
              className="w-28 h-28 rounded-full border-8 border-stone-100 dark:border-stone-800 flex flex-col items-center justify-center shadow-inner relative"
              style={{
                background: `radial-gradient(circle, transparent 65%, ${colorPreset.primaryHex}15 100%)`,
              }}
            >
              <span className="text-4xl font-black font-mono tracking-tight text-stone-900 dark:text-stone-100">
                {checkup.totalScore}
              </span>
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">
                / 100 PTS
              </span>
            </div>
          </div>

          <p className="text-xs text-stone-500 dark:text-stone-400 max-w-sm mx-auto mt-3 leading-relaxed">
            {checkup.summaryText}
          </p>
        </div>
      </Card>

      {/* 4 Pillars Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* Pilar 1 */}
        <Card className="p-3.5 space-y-2 border-stone-200/80 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
              1. Rasio Tabungan
            </span>
            <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
              {checkup.p1.score} / {checkup.p1.max}
            </span>
          </div>
          <div className="h-1.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${(checkup.p1.score / checkup.p1.max) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-stone-400 block">
            {checkup.p1.status}
          </span>
        </Card>

        {/* Pilar 2 */}
        <Card className="p-3.5 space-y-2 border-stone-200/80 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-teal-500" />
              2. Dana Darurat Likuid
            </span>
            <span className="text-xs font-mono font-black text-teal-600 dark:text-teal-400">
              {checkup.p2.score} / {checkup.p2.max}
            </span>
          </div>
          <div className="h-1.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-500 rounded-full transition-all duration-500"
              style={{ width: `${(checkup.p2.score / checkup.p2.max) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-stone-400 block">
            {checkup.p2.status}
          </span>
        </Card>

        {/* Pilar 3 */}
        <Card className="p-3.5 space-y-2 border-stone-200/80 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
              <PieChart className="w-3.5 h-3.5 text-indigo-500" />
              3. Kedisiplinan Anggaran
            </span>
            <span className="text-xs font-mono font-black text-indigo-600 dark:text-indigo-400">
              {checkup.p3.score} / {checkup.p3.max}
            </span>
          </div>
          <div className="h-1.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-indigo-500 rounded-full transition-all duration-500"
              style={{ width: `${(checkup.p3.score / checkup.p3.max) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-stone-400 block">
            {checkup.p3.status}
          </span>
        </Card>

        {/* Pilar 4 */}
        <Card className="p-3.5 space-y-2 border-stone-200/80 dark:border-stone-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800 dark:text-stone-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              4. Beban Tagihan Rutin
            </span>
            <span className="text-xs font-mono font-black text-amber-600 dark:text-amber-400">
              {checkup.p4.score} / {checkup.p4.max}
            </span>
          </div>
          <div className="h-1.5 w-full bg-stone-100 dark:bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${(checkup.p4.score / checkup.p4.max) * 100}%` }}
            />
          </div>
          <span className="text-[10px] text-stone-400 block">
            {checkup.p4.status}
          </span>
        </Card>
      </div>

      {/* Actionable Recommendations Checklist */}
      {checkup.recommendations.length > 0 && (
        <Card className="p-4 border-stone-200/80 dark:border-stone-800 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h4 className="text-xs font-extrabold text-stone-900 dark:text-stone-100">
              Rekomendasi Perbaikan Finansial
            </h4>
          </div>

          <div className="space-y-2.5">
            {checkup.recommendations.map((rec, i) => (
              <div
                key={i}
                className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200/60 dark:border-stone-800/60 flex items-start justify-between gap-3"
              >
                <div className="space-y-0.5 min-w-0">
                  <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                    {rec.title}
                  </p>
                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    {rec.desc}
                  </p>
                </div>

                {rec.actionText && rec.actionTab && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentTab(rec.actionTab as any)}
                    className="shrink-0 text-[10px] font-bold h-7 px-2.5"
                  >
                    <span>{rec.actionText}</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};
