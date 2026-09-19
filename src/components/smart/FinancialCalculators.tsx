"use client";

import React, { useState, useMemo } from "react";
import {
  Calculator,
  Shield,
  TrendingUp,
  PieChart,
  Check,
  ArrowRight,
  Sparkles,
  Info,
  DollarSign,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { formatRupiah } from "../../utils/formatters";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Select } from "../ui/select";
import { Progress } from "../ui/progress";

export const FinancialCalculators: React.FC = () => {
  const {
    currentMonthIncome,
    currentMonthExpense,
    wallets,
    categories,
    transactions,
    addGoal,
    setCurrentTab,
    user,
    colorPreset,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<
    "emergency" | "compound" | "budget5020"
  >("emergency");

  // --- 1. State: Emergency Fund Calculator ---
  const [monthlyExpenseInput, setMonthlyExpenseInput] = useState(
    currentMonthExpense > 0 ? String(currentMonthExpense) : "4500000",
  );
  const [dependencyStatus, setDependencyStatus] = useState<
    "single" | "married" | "family" | "freelance"
  >("single");
  const [currentSavedInput, setCurrentSavedInput] = useState("5000000");
  const [goalCreatedToast, setGoalCreatedToast] = useState(false);

  const emergencyMonths = useMemo(() => {
    switch (dependencyStatus) {
      case "single":
        return 3;
      case "married":
        return 6;
      case "family":
        return 9;
      case "freelance":
        return 12;
      default:
        return 3;
    }
  }, [dependencyStatus]);

  const emergencyFundTarget = useMemo(() => {
    const exp = parseFloat(monthlyExpenseInput.replace(/[^0-9]/g, "")) || 0;
    return exp * emergencyMonths;
  }, [monthlyExpenseInput, emergencyMonths]);

  const emergencyCurrentSaved = useMemo(() => {
    return parseFloat(currentSavedInput.replace(/[^0-9]/g, "")) || 0;
  }, [currentSavedInput]);

  const emergencyShortfall = Math.max(
    0,
    emergencyFundTarget - emergencyCurrentSaved,
  );
  const emergencyProgressPercent =
    emergencyFundTarget > 0
      ? Math.min(
          100,
          Math.round((emergencyCurrentSaved / emergencyFundTarget) * 100),
        )
      : 0;

  const handleUseLiquidBalances = () => {
    // Sum cash and bank balances
    const liquidTotal = wallets
      .filter((w) => w.category === "cash" || w.category === "bank")
      .reduce((sum, w) => sum + w.balance, 0);
    setCurrentSavedInput(String(Math.max(0, liquidTotal)));
  };

  const handleCreateEmergencyGoal = () => {
    addGoal({
      title: `Dana Darurat (${emergencyMonths} Bulan)`,
      targetAmount: emergencyFundTarget,
      currentAmount: emergencyCurrentSaved,
      targetDate: `${new Date().getFullYear() + 1}-12-31`,
      iconName: "Shield",
      color: "#10b981",
      notes: `Dihitung otomatis via Kalkulator Finansial (${dependencyStatus})`,
    });
    setGoalCreatedToast(true);
    setTimeout(() => {
      setGoalCreatedToast(false);
      setCurrentTab("budgets");
    }, 1800);
  };

  // --- 2. State: Compound Interest Calculator ---
  const [initialDeposit, setInitialDeposit] = useState("10000000");
  const [monthlyContribution, setMonthlyContribution] = useState("1500000");
  const [annualReturnRate, setAnnualReturnRate] = useState("8"); // 8% per year
  const [yearsDuration, setYearsDuration] = useState("5"); // 5 years

  const compoundResult = useMemo(() => {
    const P = parseFloat(initialDeposit.replace(/[^0-9]/g, "")) || 0;
    const PMT = parseFloat(monthlyContribution.replace(/[^0-9]/g, "")) || 0;
    const r = (parseFloat(annualReturnRate) || 0) / 100;
    const t = parseInt(yearsDuration, 10) || 1;
    const monthlyRate = r / 12;
    const totalMonths = t * 12;

    let balance = P;
    let totalPrincipal = P;
    const yearlyBreakdown: {
      year: number;
      principal: number;
      interest: number;
      total: number;
    }[] = [];

    for (let month = 1; month <= totalMonths; month++) {
      balance = balance * (1 + monthlyRate) + PMT;
      totalPrincipal += PMT;

      if (month % 12 === 0) {
        const year = month / 12;
        yearlyBreakdown.push({
          year,
          principal: totalPrincipal,
          interest: Math.round(balance - totalPrincipal),
          total: Math.round(balance),
        });
      }
    }

    const finalTotal = Math.round(balance);
    const totalInterest = Math.max(0, finalTotal - totalPrincipal);

    return {
      totalPrincipal,
      totalInterest,
      finalTotal,
      yearlyBreakdown,
    };
  }, [initialDeposit, monthlyContribution, annualReturnRate, yearsDuration]);

  // --- 3. State: 50/30/20 Rule Evaluator ---
  const [ruleIncomeInput, setRuleIncomeInput] = useState(
    currentMonthIncome > 0 ? String(currentMonthIncome) : "12000000",
  );

  const rule503020 = useMemo(() => {
    const inc = parseFloat(ruleIncomeInput.replace(/[^0-9]/g, "")) || 0;
    const targetNeeds = inc * 0.5;
    const targetWants = inc * 0.3;
    const targetSavings = inc * 0.2;

    // Categorize actual current month expenses
    const needsCatIds = [
      "cat-food",
      "cat-transport",
      "cat-bills",
      "cat-health",
      "cat-education",
    ];
    const wantsCatIds = ["cat-shopping", "cat-entertainment", "cat-other-exp"];

    let actualNeeds = 0;
    let actualWants = 0;

    transactions.forEach((tx) => {
      if (tx.type === "expense") {
        if (tx.categoryId && needsCatIds.includes(tx.categoryId)) {
          actualNeeds += tx.amount;
        } else {
          actualWants += tx.amount;
        }
      }
    });

    const actualSavings = Math.max(0, inc - (actualNeeds + actualWants));

    const needsRatio = inc > 0 ? Math.round((actualNeeds / inc) * 100) : 0;
    const wantsRatio = inc > 0 ? Math.round((actualWants / inc) * 100) : 0;
    const savingsRatio = inc > 0 ? Math.round((actualSavings / inc) * 100) : 0;

    return {
      inc,
      targetNeeds,
      targetWants,
      targetSavings,
      actualNeeds,
      actualWants,
      actualSavings,
      needsRatio,
      wantsRatio,
      savingsRatio,
    };
  }, [ruleIncomeInput, transactions]);

  return (
    <div className="space-y-4">
      {/* Sub-Tabs Nav */}
      <div className="grid grid-cols-3 gap-1 bg-stone-100 dark:bg-stone-800/80 p-1 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveSubTab("emergency")}
          className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubTab === "emergency"
              ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs"
              : "text-stone-500 dark:text-stone-400 hover:text-stone-900"
          }`}
        >
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          <span className="truncate">Dana Darurat</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("compound")}
          className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubTab === "compound"
              ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs"
              : "text-stone-500 dark:text-stone-400 hover:text-stone-900"
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5 text-indigo-500" />
          <span className="truncate">Investasi Majemuk</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubTab("budget5020")}
          className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
            activeSubTab === "budget5020"
              ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 shadow-xs"
              : "text-stone-500 dark:text-stone-400 hover:text-stone-900"
          }`}
        >
          <PieChart className="w-3.5 h-3.5 text-amber-500" />
          <span className="truncate">Rasio 50/30/20</span>
        </button>
      </div>

      {/* SUB-TAB 1: DANA DARURAT */}
      {activeSubTab === "emergency" && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
                Kalkulator Dana Darurat Ideal
              </h3>
              <p className="text-[11px] text-stone-400">
                Hitung bantalan finansial untuk proteksi terhadap risiko tak
                terduga
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Status Tanggungan */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Status Profil Tanggungan
              </label>
              <Select
                value={dependencyStatus}
                onChange={(e) => setDependencyStatus(e.target.value as any)}
                className="text-xs"
              >
                <option value="single">
                  Lajang / Belum Menikah (3 Bulan Pengeluaran)
                </option>
                <option value="married">
                  Menikah Tanpa Anak (6 Bulan Pengeluaran)
                </option>
                <option value="family">
                  Menikah dengan 1-2 Anak (9 Bulan Pengeluaran)
                </option>
                <option value="freelance">
                  Freelance / Pebisnis (12 Bulan Pengeluaran)
                </option>
              </Select>
            </div>

            {/* Pengeluaran Bulanan */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                  Pengeluaran Bulanan
                </label>
                {currentMonthExpense > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setMonthlyExpenseInput(String(currentMonthExpense))
                    }
                    className="text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:underline"
                  >
                    Gunakan Pengeluaran Bulan Ini
                  </button>
                )}
              </div>
              <Input
                type="number"
                value={monthlyExpenseInput}
                onChange={(e) => setMonthlyExpenseInput(e.target.value)}
                placeholder="4500000"
                className="text-xs font-mono font-bold"
              />
            </div>
          </div>

          {/* Dana yang sudah ada */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Dana Darurat yang Sudah Dimiliki
              </label>
              <button
                type="button"
                onClick={handleUseLiquidBalances}
                className="text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:underline"
              >
                Pakai Saldo Tunai & Bank (
                {formatRupiah(
                  wallets
                    .filter(
                      (w) => w.category === "cash" || w.category === "bank",
                    )
                    .reduce((s, w) => s + w.balance, 0),
                  false,
                  user.baseCurrency,
                )}
                )
              </button>
            </div>
            <Input
              type="number"
              value={currentSavedInput}
              onChange={(e) => setCurrentSavedInput(e.target.value)}
              placeholder="5000000"
              className="text-xs font-mono font-bold"
            />
          </div>

          {/* Result Card */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block">
                  Target Dana Darurat ({emergencyMonths} Bulan)
                </span>
                <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(emergencyFundTarget, false, user.baseCurrency)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block">
                  Kekurangan Dana
                </span>
                <div className="text-sm font-mono font-black text-rose-600 dark:text-rose-400">
                  {formatRupiah(emergencyShortfall, false, user.baseCurrency)}
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
                <span>Kesiapan Proteksi</span>
                <span>{emergencyProgressPercent}% Terkumpul</span>
              </div>
              <div className="h-2.5 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${emergencyProgressPercent}%` }}
                />
              </div>
            </div>

            <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
              💡 <strong>Rekomendasi Alokasi:</strong> Simpan 50% di rekening
              bank terpisah/tabungan likuid dan 50% di Reksadana Pasar Uang
              (RPU) agar tetap terlindungi dari inflasi namun mudah dicairkan
              saat genting.
            </p>

            <Button
              type="button"
              onClick={handleCreateEmergencyGoal}
              className="w-full font-bold text-xs gap-2 text-white"
              style={{ backgroundColor: colorPreset.primaryHex }}
            >
              {goalCreatedToast ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Target Berhasil Dibuat! Membuka Target...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Jadikan Target Impian (Goals)</span>
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* SUB-TAB 2: INVESTASI BUNGA MAJEMUK */}
      {activeSubTab === "compound" && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
                Simulasi Bunga Majemuk (Compound Growth)
              </h3>
              <p className="text-[11px] text-stone-400">
                Lihat kekuatan akumulasi hasil investasi rutin jangka panjang
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Modal Setoran Awal
              </label>
              <Input
                type="number"
                value={initialDeposit}
                onChange={(e) => setInitialDeposit(e.target.value)}
                placeholder="10000000"
                className="text-xs font-mono font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Setoran Rutin Bulanan
              </label>
              <Input
                type="number"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(e.target.value)}
                placeholder="1500000"
                className="text-xs font-mono font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Estimasi Imbal Hasil (% / Tahun)
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  step="0.5"
                  value={annualReturnRate}
                  onChange={(e) => setAnnualReturnRate(e.target.value)}
                  className="text-xs font-mono font-bold"
                />
              </div>
              <div className="flex gap-1 pt-1">
                {["5", "8", "11", "14"].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setAnnualReturnRate(rate)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border transition ${
                      annualReturnRate === rate
                        ? "bg-stone-900 text-white dark:bg-white dark:text-stone-900"
                        : "text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-800"
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Jangka Waktu ({yearsDuration} Tahun)
              </label>
              <Input
                type="range"
                min="1"
                max="30"
                value={yearsDuration}
                onChange={(e) => setYearsDuration(e.target.value)}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                <span>1 Thn</span>
                <span className="font-bold text-stone-800 dark:text-stone-200">
                  {yearsDuration} Tahun
                </span>
                <span>30 Thn</span>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-3">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-stone-400 font-bold block">
                Estimasi Nilai Akhir Portofolio ({yearsDuration} Tahun)
              </span>
              <div className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400">
                {formatRupiah(
                  compoundResult.finalTotal,
                  false,
                  user.baseCurrency,
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
              <div>
                <span className="text-[10px] text-stone-400 block font-medium">
                  Total Modal Pokok
                </span>
                <span className="text-xs font-mono font-bold text-stone-700 dark:text-stone-300">
                  {formatRupiah(
                    compoundResult.totalPrincipal,
                    false,
                    user.baseCurrency,
                  )}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-400 block font-medium">
                  Keuntungan / Bunga
                </span>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  +
                  {formatRupiah(
                    compoundResult.totalInterest,
                    false,
                    user.baseCurrency,
                  )}
                </span>
              </div>
            </div>

            {/* Micro Table */}
            <div className="space-y-1 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                Proyeksi Pertumbuhan Tahunan
              </span>
              <div className="max-h-36 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800 text-xs">
                {compoundResult.yearlyBreakdown.map((row) => (
                  <div
                    key={row.year}
                    className="py-1.5 flex items-center justify-between text-[11px]"
                  >
                    <span className="font-bold text-stone-700 dark:text-stone-300">
                      Tahun ke-{row.year}
                    </span>
                    <div className="flex gap-4 font-mono">
                      <span className="text-stone-400">
                        Pokok:{" "}
                        {formatRupiah(row.principal, false, user.baseCurrency)}
                      </span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                        {formatRupiah(row.total, false, user.baseCurrency)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* SUB-TAB 3: RASIO 50/30/20 */}
      {activeSubTab === "budget5020" && (
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
                Pemeriksa Kaidah Rasio 50/30/20
              </h3>
              <p className="text-[11px] text-stone-400">
                Standar emas alokasi gaji: 50% Kebutuhan, 30% Keinginan, 20%
                Tabungan
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                Pemasukan Bulanan Bersih
              </label>
              {currentMonthIncome > 0 && (
                <button
                  type="button"
                  onClick={() => setRuleIncomeInput(String(currentMonthIncome))}
                  className="text-[10px] font-bold text-teal-600 dark:text-teal-400 hover:underline"
                >
                  Gunakan Pemasukan Bulan Ini
                </button>
              )}
            </div>
            <Input
              type="number"
              value={ruleIncomeInput}
              onChange={(e) => setRuleIncomeInput(e.target.value)}
              placeholder="12000000"
              className="text-xs font-mono font-bold"
            />
          </div>

          <div className="space-y-3">
            {/* 50% Needs */}
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                    50% Kebutuhan Pokok (Needs)
                  </h4>
                  <p className="text-[10px] text-stone-400">
                    Makan, tagihan, transportasi, kesehatan, sewa
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    rule503020.needsRatio <= 50
                      ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
                      : "text-amber-600 bg-amber-500/10 border-amber-500/20"
                  }
                >
                  {rule503020.needsRatio}% (Maks 50%)
                </Badge>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-stone-500">
                  Target Ideal:{" "}
                  {formatRupiah(
                    rule503020.targetNeeds,
                    false,
                    user.baseCurrency,
                  )}
                </span>
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  Realisasi:{" "}
                  {formatRupiah(
                    rule503020.actualNeeds,
                    false,
                    user.baseCurrency,
                  )}
                </span>
              </div>
            </div>

            {/* 30% Wants */}
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                    30% Keinginan & Gaya Hidup (Wants)
                  </h4>
                  <p className="text-[10px] text-stone-400">
                    Belanja pakaian, nongkrong, liburan, streaming
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    rule503020.wantsRatio <= 30
                      ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
                      : "text-rose-600 bg-rose-500/10 border-rose-500/20"
                  }
                >
                  {rule503020.wantsRatio}% (Maks 30%)
                </Badge>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-stone-500">
                  Target Ideal:{" "}
                  {formatRupiah(
                    rule503020.targetWants,
                    false,
                    user.baseCurrency,
                  )}
                </span>
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  Realisasi:{" "}
                  {formatRupiah(
                    rule503020.actualWants,
                    false,
                    user.baseCurrency,
                  )}
                </span>
              </div>
            </div>

            {/* 20% Savings */}
            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    20% Tabungan & Investasi (Savings)
                  </h4>
                  <p className="text-[10px] text-stone-400">
                    Dana darurat, reksadana, saham, emas
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={
                    rule503020.savingsRatio >= 20
                      ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
                      : "text-amber-600 bg-amber-500/10 border-amber-500/20"
                  }
                >
                  {rule503020.savingsRatio}% (Min 20%)
                </Badge>
              </div>
              <div className="flex justify-between text-xs font-mono">
                <span className="text-stone-500">
                  Target Ideal:{" "}
                  {formatRupiah(
                    rule503020.targetSavings,
                    false,
                    user.baseCurrency,
                  )}
                </span>
                <span className="font-bold text-stone-900 dark:text-stone-100">
                  Sisa Tersimpan:{" "}
                  {formatRupiah(
                    rule503020.actualSavings,
                    false,
                    user.baseCurrency,
                  )}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
