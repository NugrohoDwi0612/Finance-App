"use client";

import React, { useState, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  TrendingUp,
  TrendingDown,
  ReceiptText,
  Clock,
  Plus,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { formatRupiah, formatDateID } from "../../utils/formatters";
import { Transaction } from "../../types";
import { IconRenderer } from "../common/IconRenderer";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

interface CashflowCalendarProps {
  onSelectTransaction?: (tx: Transaction) => void;
  onOpenAddTransaction?: () => void;
}

export const CashflowCalendar: React.FC<CashflowCalendarProps> = ({
  onSelectTransaction,
  onOpenAddTransaction,
}) => {
  const { transactions, categories, wallets, hideBalances, user, colorPreset } =
    useApp();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<number>(() =>
    new Date().getDate(),
  );

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const monthNames = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDay(1);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDay(1);
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDay(today.getDate());
  };

  // Calendar math
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon ...
  // Convert so Monday = 0, Sunday = 6
  const startDayOffset = (firstDayIndex + 6) % 7;

  // Aggregate daily transactions
  const dailyData = useMemo(() => {
    const map = new Map<
      number,
      { income: number; expense: number; txs: Transaction[] }
    >();

    for (let d = 1; d <= daysInMonth; d++) {
      map.set(d, { income: 0, expense: 0, txs: [] });
    }

    transactions.forEach((tx) => {
      const txDate = new Date(tx.date);
      if (txDate.getFullYear() === year && txDate.getMonth() === month) {
        const d = txDate.getDate();
        const entry = map.get(d) || { income: 0, expense: 0, txs: [] };
        if (tx.type === "income") {
          entry.income += tx.amount;
        } else if (tx.type === "expense") {
          entry.expense += tx.amount;
        }
        entry.txs.push(tx);
        map.set(d, entry);
      }
    });

    return map;
  }, [transactions, year, month, daysInMonth]);

  // Selected date transactions
  const selectedDayEntry = dailyData.get(selectedDay);
  const selectedDateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(selectedDay).padStart(2, "0")}`;

  // Monthly summary
  const monthTotalIncome = useMemo(() => {
    let sum = 0;
    dailyData.forEach((val) => (sum += val.income));
    return sum;
  }, [dailyData]);

  const monthTotalExpense = useMemo(() => {
    let sum = 0;
    dailyData.forEach((val) => (sum += val.expense));
    return sum;
  }, [dailyData]);

  const today = new Date();
  const isCurrentMonthToday =
    today.getFullYear() === year && today.getMonth() === month;

  return (
    <div className="space-y-4">
      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-700 dark:text-stone-300">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
              {monthNames[month]} {year}
            </h3>
            <span className="text-[10px] text-stone-400">
              Arus Kas Harian & Kalender Transaksi
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="text-[11px] h-7 px-2 font-bold"
          >
            Hari Ini
          </Button>
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg border border-stone-200 dark:border-stone-800 hover:bg-stone-100 dark:hover:bg-stone-800 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mini Month Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
          <span className="text-[9px] uppercase font-bold text-stone-400 block">
            Total Masuk
          </span>
          <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400 truncate block">
            +{formatRupiah(monthTotalIncome, hideBalances, user.baseCurrency)}
          </span>
        </div>
        <div className="p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
          <span className="text-[9px] uppercase font-bold text-stone-400 block">
            Total Keluar
          </span>
          <span className="text-xs font-mono font-black text-rose-600 dark:text-rose-400 truncate block">
            -{formatRupiah(monthTotalExpense, hideBalances, user.baseCurrency)}
          </span>
        </div>
        <div className="p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
          <span className="text-[9px] uppercase font-bold text-stone-400 block">
            Net Saldo
          </span>
          <span
            className={`text-xs font-mono font-black truncate block ${
              monthTotalIncome - monthTotalExpense >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {monthTotalIncome - monthTotalExpense >= 0 ? "+" : ""}
            {formatRupiah(
              monthTotalIncome - monthTotalExpense,
              hideBalances,
              user.baseCurrency,
            )}
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      <Card className="p-3 border-stone-200/80 dark:border-stone-800">
        {/* Day Headers (Sen - Min) */}
        <div className="grid grid-cols-7 text-center mb-1 text-[10px] font-bold text-stone-400">
          <div>Sen</div>
          <div>Sel</div>
          <div>Rab</div>
          <div>Kam</div>
          <div>Jum</div>
          <div className="text-amber-500">Sab</div>
          <div className="text-rose-500">Min</div>
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {/* Offset leading empty cells */}
          {Array.from({ length: startDayOffset }).map((_, i) => (
            <div
              key={`empty-${i}`}
              className="min-h-14 p-1 rounded-xl bg-transparent"
            />
          ))}

          {/* Actual Month Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const data = dailyData.get(dayNum);
            const isToday = isCurrentMonthToday && today.getDate() === dayNum;
            const isSelected = selectedDay === dayNum;
            const hasActivity =
              (data?.income || 0) > 0 || (data?.expense || 0) > 0;

            return (
              <button
                key={dayNum}
                type="button"
                onClick={() => setSelectedDay(dayNum)}
                className={`min-h-14 p-1 rounded-xl border flex flex-col justify-between text-left transition-all relative ${
                  isSelected
                    ? "border-stone-900 dark:border-white bg-stone-100 dark:bg-stone-800 shadow-xs"
                    : "border-stone-100 dark:border-stone-800/60 hover:bg-stone-50 dark:hover:bg-stone-800/40"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs font-bold leading-none ${
                      isToday
                        ? "w-5 h-5 rounded-full bg-teal-500 text-white flex items-center justify-center font-black"
                        : "text-stone-700 dark:text-stone-300"
                    }`}
                  >
                    {dayNum}
                  </span>
                  {data && data.txs.length > 0 && (
                    <span className="text-[8px] font-bold text-stone-400">
                      {data.txs.length}
                    </span>
                  )}
                </div>

                {/* Micro indicators */}
                <div className="space-y-0.5 mt-1 w-full overflow-hidden">
                  {data && data.income > 0 && (
                    <div className="text-[8px] font-mono font-bold text-emerald-600 dark:text-emerald-400 truncate leading-none">
                      +
                      {data.income >= 1000000
                        ? `${(data.income / 1000000).toFixed(1)}jt`
                        : `${Math.round(data.income / 1000)}k`}
                    </div>
                  )}
                  {data && data.expense > 0 && (
                    <div className="text-[8px] font-mono font-bold text-rose-600 dark:text-rose-400 truncate leading-none">
                      -
                      {data.expense >= 1000000
                        ? `${(data.expense / 1000000).toFixed(1)}jt`
                        : `${Math.round(data.expense / 1000)}k`}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Selected Day Transaction Breakdown */}
      <Card className="p-4 border-stone-200/80 dark:border-stone-800 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>
                Detail Transaksi: {selectedDay} {monthNames[month]} {year}
              </span>
            </h4>
            <span className="text-[10px] text-stone-400">
              {selectedDayEntry?.txs.length || 0} Transaksi tercatat
            </span>
          </div>

          {selectedDayEntry && (
            <div className="text-right">
              {selectedDayEntry.expense > 0 && (
                <div className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
                  Keluar: -
                  {formatRupiah(
                    selectedDayEntry.expense,
                    hideBalances,
                    user.baseCurrency,
                  )}
                </div>
              )}
              {selectedDayEntry.income > 0 && (
                <div className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  Masuk: +
                  {formatRupiah(
                    selectedDayEntry.income,
                    hideBalances,
                    user.baseCurrency,
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {selectedDayEntry && selectedDayEntry.txs.length > 0 ? (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {selectedDayEntry.txs.map((tx) => {
              const cat = categories.find((c) => c.id === tx.categoryId);
              const w = wallets.find((wal) => wal.id === tx.walletId);
              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction && onSelectTransaction(tx)}
                  className="py-2.5 flex items-center justify-between gap-2 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-800/50 rounded-xl px-2 -mx-2 transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 text-xs shadow-2xs"
                      style={{
                        backgroundColor: cat?.color || colorPreset.primaryHex,
                      }}
                    >
                      <IconRenderer
                        name={cat?.iconName || "Receipt"}
                        size={14}
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                        {tx.description}
                      </p>
                      <p className="text-[10px] text-stone-400 truncate">
                        {cat?.name || "Umum"} • {w?.name || "Kas"}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-mono font-black ${
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
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-stone-400 space-y-2">
            <ReceiptText className="w-8 h-8 mx-auto opacity-30" />
            <p className="text-xs">
              Tidak ada catatan transaksi pada tanggal ini.
            </p>
            {onOpenAddTransaction && (
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenAddTransaction}
                className="text-xs font-bold gap-1 mt-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Catat Transaksi Tanggal Ini</span>
              </Button>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};
