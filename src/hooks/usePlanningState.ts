"use client";

import { useState, useEffect } from "react";
import { Budget, Goal, DebtLoan, RecurringBill, SplitBill, Wallet, UserProfile, Transaction } from "@/types";
import { loadLocal } from "@/utils/localStorage";
import { addBudgetDB, editBudgetDB, deleteBudgetDB } from "@/services/budgetService";
import { addGoalDB, updateGoalAmountDB, deleteGoalDB, editGoalDB } from "@/services/goalService";
import { addDebtLoanDB, updateDebtPaymentDB, deleteDebtLoanDB } from "@/services/debtService";
import { addRecurringBillDB, updateRecurringDueDateDB, deleteRecurringBillDB } from "@/services/recurringService";
import { addSplitBillDB, deleteSplitBillDB } from "@/services/splitBillService";

export function usePlanningState(
  user: UserProfile,
  setWallets: React.Dispatch<React.SetStateAction<Wallet[]>>,
  addTransaction: (tx: Omit<Transaction, "id" | "createdAt">) => Promise<void>
) {
  const [budgets, setBudgets] = useState<Budget[]>(() => loadLocal("budgets", []));
  const [goals, setGoals] = useState<Goal[]>(() => loadLocal("goals", []));
  const [debtsLoans, setDebtsLoans] = useState<DebtLoan[]>(() => loadLocal("debtsLoans", []));
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>(() => loadLocal("recurringBills", []));
  const [splitBills, setSplitBills] = useState<SplitBill[]>(() => loadLocal("splitBills", []));

  useEffect(() => { localStorage.setItem("catatuang_budgets", JSON.stringify(budgets)); }, [budgets]);
  useEffect(() => { localStorage.setItem("catatuang_goals", JSON.stringify(goals)); }, [goals]);
  useEffect(() => { localStorage.setItem("catatuang_debtsLoans", JSON.stringify(debtsLoans)); }, [debtsLoans]);
  useEffect(() => { localStorage.setItem("catatuang_recurringBills", JSON.stringify(recurringBills)); }, [recurringBills]);
  useEffect(() => { localStorage.setItem("catatuang_splitBills", JSON.stringify(splitBills)); }, [splitBills]);

  // Budgets
 // Aksi 1: Tambah Anggaran Baru
  const addBudget = async (categoryId: string, limit: number, period: string) => {
    const bId = `b-${Date.now()}`;
    const newBudget: Budget = { id: bId, categoryId, monthlyLimit: limit, period };
    
    setBudgets((prev) => [...prev, newBudget]);

    if (user.isLoggedIn && user.email !== "guest@catatuang.app") {
      await addBudgetDB(newBudget);
    }
  };

  // Aksi 2: Edit Anggaran yang Sudah Ada (Berdasarkan ID)
  const editBudget = async (id: string, limit: number) => {
    setBudgets((prev) =>
      prev.map((b) => (b.id === id ? { ...b, monthlyLimit: limit } : b))
    );

    if (user.isLoggedIn && user.email !== "guest@catatuang.app") {
      await editBudgetDB(id, limit);
    }
  };
  const deleteBudget = async (id: string) => {
    setBudgets((p) => p.filter((b) => b.id !== id));
    if (user.isLoggedIn && user.email !== "guest@catatuang.app") await deleteBudgetDB(id);
  };

  // Goals
  const addGoal = async (goalData: Omit<Goal, "id">) => {
    const newGoal: Goal = { ...goalData, id: `g-${Date.now()}` };
    setGoals((p) => [...p, newGoal]);
    if (user.isLoggedIn && user.email !== "guest@catatuang.app") await addGoalDB(newGoal);
  };
 const editGoal = async (id: string, updated: Partial<Goal>) => {
    setGoals((p) => p.map((g) => (g.id === id ? { ...g, ...updated } : g)));
    if (user.isLoggedIn && user.email !== "guest@catatuang.app") {
      await editGoalDB(id, updated);
    }
  };
  const deleteGoal = async (id: string) => {
    setGoals((p) => p.filter((g) => g.id !== id));
    if (user.isLoggedIn && user.email !== "guest@catatuang.app") await deleteGoalDB(id);
  };
  const depositToGoal = async (id: string, amount: number, walletId: string) => {
    const targetGoal = goals.find((g) => g.id === id);
    if (!targetGoal) return;
    setWallets((p) => p.map((w) => (w.id === walletId ? { ...w, balance: w.balance - amount } : w)));
    setGoals((p) => p.map((g) => (g.id === id ? { ...g, currentAmount: g.currentAmount + amount } : g)));
    await addTransaction({ type: "expense", amount, categoryId: "cat-investment-inc", walletId, date: new Date().toISOString().slice(0, 16), description: `Setor Tabungan: ${targetGoal.title}` });
    if (user.isLoggedIn && user.email !== "guest@catatuang.app") await updateGoalAmountDB(id, targetGoal.currentAmount + amount);
  };

  // Debts
  const addDebtLoan = async (item: Omit<DebtLoan, "id" | "paidAmount" | "status" | "payments" | "createdAt">) => {
    const newItem: DebtLoan = { ...item, id: `dl-${Date.now()}`, paidAmount: 0, status: "unpaid", payments: [], createdAt: new Date().toISOString() };
    setDebtsLoans((p) => [newItem, ...p]);
    if (user.isLoggedIn && user.email !== "guest@catatuang.app") await addDebtLoanDB(newItem);
  };
  const addDebtPayment = async (debtId: string, amount: number, walletId?: string, note?: string) => {
    const item = debtsLoans.find((d) => d.id === debtId);
    if (!item) return;
    const payment = { id: `p-${Date.now()}`, amount, date: new Date().toISOString().slice(0, 10), walletId, note };
    const newPaid = item.paidAmount + amount;
    const newStatus = newPaid >= item.totalAmount ? "paid" : "partial";
    const nextPayments = [...item.payments, payment];

    if (walletId) {
      setWallets((p) => p.map((w) => (w.id === walletId ? { ...w, balance: item.type === "debt" ? w.balance - amount : w.balance + amount } : w)));
      await addTransaction({ type: item.type === "debt" ? "expense" : "income", amount, walletId, date: new Date().toISOString().slice(0, 16), description: item.type === "debt" ? `Bayar Cicilan Hutang: ${item.contactName}` : `Terima Pelunasan: ${item.contactName}` });
    }
    setDebtsLoans((p) => p.map((d) => (d.id === debtId ? { ...d, paidAmount: newPaid, status: newStatus as any, payments: nextPayments } : d)));
    if (user.isLoggedIn && user.email !== "guest@catatuang.app") await updateDebtPaymentDB(debtId, newPaid, newStatus, nextPayments);
  };
  const deleteDebtLoan = async (id: string) => {
    setDebtsLoans((p) => p.filter((d) => d.id !== id));
    if (user.isLoggedIn && user.email !== "guest@catatuang.app") await deleteDebtLoanDB(id);
  };

  // Recurring & Split
  const addRecurringBill = async (bill: Omit<RecurringBill, "id">) => {
    const newBill = { ...bill, id: `rec-${Date.now()}` };
    setRecurringBills((p) => [...p, newBill]);
    if (user.isLoggedIn && user.email !== "guest@catatuang.app") await addRecurringBillDB(newBill);
  };
  const editRecurringBill = (id: string, bill: Partial<RecurringBill>) => setRecurringBills((p) => p.map((b) => (b.id === id ? { ...b, ...bill } : b)));
  const deleteRecurringBill = async (id: string) => {
    setRecurringBills((p) => p.filter((b) => b.id !== id));
    if (user.isLoggedIn && user.email !== "guest@catatuang.app") await deleteRecurringBillDB(id);
  };
  const markRecurringPaid = async (id: string) => {
    const bill = recurringBills.find((b) => b.id === id);
    if (!bill) return;
    await addTransaction({ type: "expense", amount: bill.amount, categoryId: bill.categoryId, walletId: bill.walletId, date: new Date().toISOString().slice(0, 16), description: `Tagihan Rutin: ${bill.title}` });
    const curDate = new Date(bill.nextDueDate);
    curDate.setMonth(curDate.getMonth() + 1);
    const nextDateStr = curDate.toISOString().slice(0, 10);
    setRecurringBills((p) => p.map((b) => (b.id === id ? { ...b, nextDueDate: nextDateStr } : b)));
    if (user.isLoggedIn && user.email !== "guest@catatuang.app") await updateRecurringDueDateDB(id, nextDateStr);
  };

  const addSplitBill = async (bill: Omit<SplitBill, "id">) => {
    const newBill = { ...bill, id: `sb-${Date.now()}` };
    setSplitBills((p) => [...p, newBill]);
    if (user.isLoggedIn && user.email !== "guest@catatuang.app") await addSplitBillDB(newBill);
  };
  const deleteSplitBill = async (id: string) => {
    setSplitBills((p) => p.filter((b) => b.id !== id));
    if (user.isLoggedIn && user.email !== "guest@catatuang.app") await deleteSplitBillDB(id);
  };
  const convertSplitPersonToLoan = (billId: string, personId: string) => {
    const bill = splitBills.find((b) => b.id === billId);
    const person = bill?.people.find((p) => p.id === personId);
    if (!person) return;
    addDebtLoan({ type: "loan", contactName: person.name, totalAmount: person.total, dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), notes: `Patungan Split Bill: ${bill?.title}` });
  };

  return {
  budgets, setBudgets, addBudget, editBudget, deleteBudget,
    goals, setGoals, addGoal, editGoal, deleteGoal, depositToGoal,
    debtsLoans, setDebtsLoans, addDebtLoan, addDebtPayment, deleteDebtLoan,
    recurringBills, setRecurringBills, addRecurringBill, editRecurringBill, deleteRecurringBill, markRecurringPaid,
    splitBills, setSplitBills, addSplitBill, deleteSplitBill, convertSplitPersonToLoan,
  };
}