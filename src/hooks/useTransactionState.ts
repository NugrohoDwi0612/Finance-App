"use client";

import { useState, useEffect, useMemo } from "react";
import { Transaction, QuickTemplate, Wallet, UserProfile } from "@/types";
import { loadLocal } from "@/utils/localStorage";
import { addTransactionDB, deleteTransactionDB } from "@/services/transactionService";
import { supabase } from "@/utils/supabase";

const defaultQuickTemplates: QuickTemplate[] = [
  { id: "qt-1", name: "Kopi Pagi / Cafe", amount: 25000, categoryId: "cat-food", walletId: "w-gopay", type: "expense", iconName: "Coffee" },
  { id: "qt-2", name: "Makan Siang", amount: 35000, categoryId: "cat-food", walletId: "w-cash", type: "expense", iconName: "Utensils" },
  { id: "qt-3", name: "Bensin BBM", amount: 40000, categoryId: "cat-transport", walletId: "w-cash", type: "expense", iconName: "Fuel" },
];

export function useTransactionState(
  user: UserProfile,
  wallets: Wallet[],
  setWallets: React.Dispatch<React.SetStateAction<Wallet[]>>
) {
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadLocal("transactions", []));
  const [quickTemplates, setQuickTemplates] = useState<QuickTemplate[]>(() => loadLocal("quickTemplates", defaultQuickTemplates));

  useEffect(() => { localStorage.setItem("catatuang_transactions", JSON.stringify(transactions)); }, [transactions]);
  useEffect(() => { localStorage.setItem("catatuang_quickTemplates", JSON.stringify(quickTemplates)); }, [quickTemplates]);

  // Kalkulasi Keuangan Real-Time
  const totalNetWorth = useMemo(() => wallets.reduce((acc, w) => acc + w.balance, 0), [wallets]);

  const currentMonthTransactions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    return transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate.getFullYear() === currentYear && txDate.getMonth() === currentMonth;
    });
  }, [transactions]);

  const currentMonthIncome = useMemo(() => {
    return currentMonthTransactions.filter((tx) => tx.type === "income").reduce((acc, tx) => acc + tx.amount, 0);
  }, [currentMonthTransactions]);

  const currentMonthExpense = useMemo(() => {
    return currentMonthTransactions.filter((tx) => tx.type === "expense").reduce((acc, tx) => acc + tx.amount, 0);
  }, [currentMonthTransactions]);

  const currentMonthCashflow = useMemo(() => currentMonthIncome - currentMonthExpense, [currentMonthIncome, currentMonthExpense]);

  // Aksi Transaksi
  const addTransaction = async (txData: Omit<Transaction, "id" | "createdAt">) => {
    const id = `tx-${Date.now()}`;
    const newTx: Transaction = { ...txData, id, createdAt: new Date().toISOString() };

    setWallets((prev) =>
      prev.map((w) => {
        if (newTx.type === "expense" && w.id === newTx.walletId) return { ...w, balance: w.balance - newTx.amount };
        if (newTx.type === "income" && w.id === newTx.walletId) return { ...w, balance: w.balance + newTx.amount };
        if (newTx.type === "transfer") {
          if (w.id === newTx.walletId) return { ...w, balance: w.balance - newTx.amount };
          if (w.id === newTx.toWalletId) return { ...w, balance: w.balance + newTx.amount };
        }
        return w;
      })
    );

    setTransactions((prev) => [newTx, ...prev]);
    if (user.isLoggedIn && user.email !== "guest@catatuang.app") await addTransactionDB(newTx);
  };

  const editTransaction = async (id: string, updatedData: Partial<Transaction>) => {
    setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updatedData } : t)));
    if (user.isLoggedIn && user.email !== "guest@catatuang.app") {
      await supabase.from("transactions").update({
        description: updatedData.description,
        amount: updatedData.amount,
        category_id: updatedData.categoryId,
        wallet_id: updatedData.walletId,
        date: updatedData.date,
      }).eq("id", id);
    }
  };

  const deleteTransaction = async (id: string) => {
    const target = transactions.find((t) => t.id === id);
    if (!target) return;

    setWallets((prev) =>
      prev.map((w) => {
        if (target.type === "expense" && w.id === target.walletId) return { ...w, balance: w.balance + target.amount };
        if (target.type === "income" && w.id === target.walletId) return { ...w, balance: w.balance - target.amount };
        return w;
      })
    );

    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (user.isLoggedIn && user.email !== "guest@catatuang.app") await deleteTransactionDB(id);
  };

  const duplicateTransaction = (id: string) => {
    const source = transactions.find((t) => t.id === id);
    if (!source) return;
    addTransaction({
      type: source.type,
      amount: source.amount,
      categoryId: source.categoryId,
      walletId: source.walletId,
      toWalletId: source.toWalletId,
      date: new Date().toISOString().slice(0, 16),
      description: `${source.description} (Salinan)`,
    });
  };

  // Quick Template
  const addQuickTemplate = (tmpl: Omit<QuickTemplate, "id">) => setQuickTemplates((p) => [...p, { ...tmpl, id: `qt-${Date.now()}` }]);
  const deleteQuickTemplate = (id: string) => setQuickTemplates((p) => p.filter((t) => t.id !== id));
  const executeQuickTemplate = (id: string) => {
    const tmpl = quickTemplates.find((t) => t.id === id);
    if (!tmpl) return;
    addTransaction({
      type: tmpl.type,
      amount: tmpl.amount,
      categoryId: tmpl.categoryId,
      walletId: tmpl.walletId,
      description: tmpl.name,
      date: new Date().toISOString().slice(0, 16),
      tags: ["Cepat"],
    });
  };

  return {
    transactions, setTransactions, quickTemplates, setQuickTemplates,
    totalNetWorth, currentMonthIncome, currentMonthExpense, currentMonthCashflow,
    addTransaction, editTransaction, deleteTransaction, duplicateTransaction,
    addQuickTemplate, deleteQuickTemplate, executeQuickTemplate,
  };
}