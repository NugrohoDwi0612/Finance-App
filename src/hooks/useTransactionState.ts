"use client";

import { useState, useEffect, useMemo } from "react";
import { Transaction, QuickTemplate, Wallet, UserProfile } from "@/types";
import { loadLocal } from "@/utils/localStorage";
import { addTransactionDB, deleteTransactionDB } from "@/services/transactionService";
import { reconcileWalletBalanceDB } from "@/services/walletService";
import { supabase } from "@/utils/supabase";

const defaultQuickTemplates: QuickTemplate[] = [
  {
    id: "qt-1",
    name: "Kopi Pagi / Cafe",
    amount: 25000,
    categoryId: "cat-food",
    walletId: "w-gopay",
    type: "expense",
    iconName: "Coffee",
  },
  {
    id: "qt-2",
    name: "Makan Siang",
    amount: 35000,
    categoryId: "cat-food",
    walletId: "w-cash",
    type: "expense",
    iconName: "Utensils",
  },
  {
    id: "qt-3",
    name: "Bensin BBM",
    amount: 40000,
    categoryId: "cat-transport",
    walletId: "w-cash",
    type: "expense",
    iconName: "Fuel",
  },
];

export function useTransactionState(
  user: UserProfile,
  wallets: Wallet[],
  setWallets: React.Dispatch<React.SetStateAction<Wallet[]>>
) {
  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    loadLocal("transactions", [])
  );
  const [quickTemplates, setQuickTemplates] = useState<QuickTemplate[]>(() =>
    loadLocal("quickTemplates", defaultQuickTemplates)
  );

  // Sinkronisasi LocalStorage
  useEffect(() => {
    localStorage.setItem("catatuang_transactions", JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem("catatuang_quickTemplates", JSON.stringify(quickTemplates));
  }, [quickTemplates]);

  // Kalkulasi Keuangan Real-Time
  const totalNetWorth = useMemo(() => {
    return wallets.reduce((acc, w) => acc + w.balance, 0);
  }, [wallets]);

  const currentMonthTransactions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    return transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return (
        txDate.getFullYear() === currentYear &&
        txDate.getMonth() === currentMonth
      );
    });
  }, [transactions]);

  const currentMonthIncome = useMemo(() => {
    return currentMonthTransactions
      .filter((tx) => tx.type === "income")
      .reduce((acc, tx) => acc + tx.amount, 0);
  }, [currentMonthTransactions]);

  const currentMonthExpense = useMemo(() => {
    return currentMonthTransactions
      .filter((tx) => tx.type === "expense")
      .reduce((acc, tx) => acc + tx.amount, 0);
  }, [currentMonthTransactions]);

  const currentMonthCashflow = useMemo(() => {
    return currentMonthIncome - currentMonthExpense;
  }, [currentMonthIncome, 

      // =========================================================================
  // TAMBAH TRANSAKSI CEPAT (PARALEL PROMISE.ALL)
  // =========================================================================
  const addTransaction = async (txData: Omit<Transaction, "id" | "createdAt">) => {
    const id = `tx-${Date.now()}`;
    const newTx: Transaction = {
      ...txData,
      id,
      createdAt: new Date().toISOString(),
    };

    let updatedSourceWallet: Wallet | undefined;
    let updatedTargetWallet: Wallet | undefined;

    // 1. Tampilkan di layar HP seketika
    setWallets((prev) =>
      prev.map((w) => {
        if (newTx.type === "expense" && w.id === newTx.walletId) {
          const updated = { ...w, balance: w.balance - newTx.amount };
          updatedSourceWallet = updated;
          return updated;
        }
        if (newTx.type === "income" && w.id === newTx.walletId) {
          const updated = { ...w, balance: w.balance + newTx.amount };
          updatedSourceWallet = updated;
          return updated;
        }
        if (newTx.type === "transfer") {
          if (w.id === newTx.walletId) {
            const updated = { ...w, balance: w.balance - newTx.amount };
            updatedSourceWallet = updated;
            return updated;
          }
          if (w.id === newTx.toWalletId) {
            const updated = { ...w, balance: w.balance + newTx.amount };
            updatedTargetWallet = updated;
            return updated;
          }
        }
        return w;
      })
    );

    setTransactions((prev) => [newTx, ...prev]);

    // 2. KUNCI KECEPATAN: Jalankan Simpan Transaksi & Potong Saldo secara PARALEL!
    if (user.isLoggedIn && user.email !== "guest@catatuang.app") {
      const tasks: Promise<any>[] = [addTransactionDB(newTx)];

      if (updatedSourceWallet) {
        tasks.push(reconcileWalletBalanceDB(updatedSourceWallet.id, updatedSourceWallet.balance));
      }
      if (updatedTargetWallet) {
        tasks.push(reconcileWalletBalanceDB(updatedTargetWallet.id, updatedTargetWallet.balance));
      }

      // Eksekusi serentak dalam satu waktu
      await Promise.all(tasks);
    }
  };

  // =========================================================================
  // 2. EDIT TRANSAKSI
  // =========================================================================
  const editTransaction = async (id: string, updatedData: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updatedData } : t))
    );

    if (user.isLoggedIn && user.email !== "guest@catatuang.app") {
      await supabase
        .from("transactions")
        .update({
          description: updatedData.description,
          amount: updatedData.amount,
          category_id: updatedData.categoryId,
          wallet_id: updatedData.walletId,
          date: updatedData.date,
        })
        .eq("id", id);
    }
  };

  // =========================================================================
  // 3. HAPUS TRANSAKSI (KEMBALIKAN SALDO DI HP & DATABASE SUPABASE)
  // =========================================================================
  const deleteTransaction = async (id: string) => {
    const target = transactions.find((t) => t.id === id);
    if (!target) return;

    let restoredSourceWallet: Wallet | undefined;
    let restoredTargetWallet: Wallet | undefined;

    // A. Kembalikan Saldo di Layar HP Seketika
    setWallets((prev) =>
      prev.map((w) => {
        if (target.type === "expense" && w.id === target.walletId) {
          const updated = { ...w, balance: w.balance + target.amount };
          restoredSourceWallet = updated;
          return updated;
        }
        if (target.type === "income" && w.id === target.walletId) {
          const updated = { ...w, balance: w.balance - target.amount };
          restoredSourceWallet = updated;
          return updated;
        }
        if (target.type === "transfer") {
          if (w.id === target.walletId) {
            const updated = { ...w, balance: w.balance + target.amount };
            restoredSourceWallet = updated;
            return updated;
          }
          if (w.id === target.toWalletId) {
            const updated = { ...w, balance: w.balance - target.amount };
            restoredTargetWallet = updated;
            return updated;
          }
        }
        return w;
      })
    );

    setTransactions((prev) => prev.filter((t) => t.id !== id));

    // B. Hapus Transaksi & Simpan Saldo yang Dipulihkan ke Cloud Supabase
    if (user.isLoggedIn && user.email !== "guest@catatuang.app") {
      await deleteTransactionDB(id);

      if (restoredSourceWallet) {
        await reconcileWalletBalanceDB(restoredSourceWallet.id, restoredSourceWallet.balance);
      }
      if (restoredTargetWallet) {
        await reconcileWalletBalanceDB(restoredTargetWallet.id, restoredTargetWallet.balance);
      }
    }
  };

  // Duplikasi Transaksi
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
      receiptImage: source.receiptImage,
    });
  };

  // Quick Templates
  const addQuickTemplate = (tmpl: Omit<QuickTemplate, "id">) => {
    const newTmpl: QuickTemplate = { ...tmpl, id: `qt-${Date.now()}` };
    setQuickTemplates((prev) => [...prev, newTmpl]);
  };

  const deleteQuickTemplate = (id: string) => {
    setQuickTemplates((prev) => prev.filter((t) => t.id !== id));
  };

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
    });
  };

  return {
    transactions,
    setTransactions,
    quickTemplates,
    setQuickTemplates,
    totalNetWorth,
    currentMonthIncome,
    currentMonthExpense,
    currentMonthCashflow,
    addTransaction,
    editTransaction,
    deleteTransaction,
    duplicateTransaction,
    addQuickTemplate,
    deleteQuickTemplate,
    executeQuickTemplate,
  };
}
