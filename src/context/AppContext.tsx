"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  Wallet,
  Transaction,
  Category,
  Budget,
  Goal,
  DebtLoan,
  RecurringBill,
  SplitBill,
  UserProfile,
  CurrencyRate,
  TabType,
  AccentColor,
  QuickTemplate,
  NavSettings,
  ThemeMode,
} from "../types";
import { ColorPreset } from "../utils/themePresets";
import { syncAllUserDataDB } from "@/services/syncService";
import { supabase } from "@/utils/supabase";
import { useSupabaseRealtime } from "@/hooks/useSupabaseRealtime";

// Import 4 Hooks Modular
import { useSecurityState, defaultNavSettings } from "@/hooks/useSecurityState";
import { useWalletCategoryState } from "@/hooks/useWalletCategoryState";
import { useTransactionState } from "@/hooks/useTransactionState";
import { usePlanningState } from "@/hooks/usePlanningState";

export { defaultNavSettings };

const defaultCurrencyRates: CurrencyRate[] = [
  { code: "USD", name: "US Dollar", symbol: "$", rateToIDR: 15850 },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$", rateToIDR: 11980 },
  { code: "EUR", name: "Euro", symbol: "€", rateToIDR: 17200 },
  { code: "JPY", name: "Japanese Yen", symbol: "¥", rateToIDR: 106.5 },
  { code: "MYR", name: "Malaysian Ringgit", symbol: "RM", rateToIDR: 3580 },
];

const initialUserProfile: UserProfile = {
  name: "",
  email: "",
  avatarUrl: "",
  baseCurrency: "IDR",
  pinEnabled: false,
  pinCode: "",
  biometricsEnabled: false,
  isLoggedIn: false,
  isOnboarded: false,
  streakDays: 1,
};

export interface AppContextType {
  currentTab: TabType;
  setCurrentTab: (tab: TabType) => void;
  navSettings: NavSettings;
  updateNavSettings: (settings: Partial<NavSettings>) => void;
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: Goal[];
  debtsLoans: DebtLoan[];
  recurringBills: RecurringBill[];
  splitBills: SplitBill[];
  quickTemplates: QuickTemplate[];
  user: UserProfile;
  hideBalances: boolean;
  theme: ThemeMode;
  accentColor: AccentColor;
  colorPreset: ColorPreset;
  isLocked: boolean;
  currencyRates: CurrencyRate[];
  totalNetWorth: number;
  currentMonthIncome: number;
  currentMonthExpense: number;
  currentMonthCashflow: number;

  setHideBalances: (val: boolean | ((prev: boolean) => boolean)) => void;
  setTheme: (theme: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
  setIsLocked: (locked: boolean) => void;
  unlockApp: (pin?: string) => boolean;
  lockApp: () => void;

  addTransaction: (tx: Omit<Transaction, "id" | "createdAt">) => Promise<void>;
  editTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  duplicateTransaction: (id: string) => void;
  addQuickTemplate: (template: Omit<QuickTemplate, "id">) => void;
  deleteQuickTemplate: (id: string) => void;
  executeQuickTemplate: (id: string) => void;

  addWallet: (wallet: Omit<Wallet, "id">) => Promise<void>;
  editWallet: (id: string, wallet: Partial<Wallet>) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  reconcileWalletBalance: (
    id: string,
    newBalance: number,
    note?: string,
  ) => Promise<void>;

  addCategory: (category: Omit<Category, "id">) => Promise<void>;
  editCategory: (id: string, category: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  addBudget: (
    categoryId: string,
    limit: number,
    period: string,
  ) => Promise<void>;
  editBudget: (id: string, limit: number) => Promise<void>;
  deleteBudget: (id: string) => Promise<void>;

  addGoal: (goal: Omit<Goal, "id">) => Promise<void>;
  editGoal: (id: string, goal: Partial<Goal>) => void;
  deleteGoal: (id: string) => Promise<void>;
  depositToGoal: (
    id: string,
    amount: number,
    walletId: string,
  ) => Promise<void>;

  addDebtLoan: (
    item: Omit<
      DebtLoan,
      "id" | "paidAmount" | "status" | "payments" | "createdAt"
    >,
  ) => Promise<void>;
  addDebtPayment: (
    debtId: string,
    amount: number,
    walletId?: string,
    note?: string,
  ) => Promise<void>;
  deleteDebtLoan: (id: string) => Promise<void>;

  addRecurringBill: (bill: Omit<RecurringBill, "id">) => Promise<void>;
  editRecurringBill: (id: string, bill: Partial<RecurringBill>) => void;
  deleteRecurringBill: (id: string) => Promise<void>;
  markRecurringPaid: (id: string) => Promise<void>;
  addSplitBill: (bill: Omit<SplitBill, "id">) => Promise<void>;
  deleteSplitBill: (id: string) => Promise<void>;
  convertSplitPersonToLoan: (billId: string, personId: string) => void;

  updateUserProfile: (profile: Partial<UserProfile>) => void;
  loginUser: (email: string, name?: string) => void;
  registerUser: (data: {
    name: string;
    email: string;
    baseCurrency?: any;
    pinCode?: string;
  }) => void;
  completeOnboarding: (data: {
    name: string;
    email: string;
    baseCurrency?: any;
    pinCode?: string;
    initialBalance?: number;
  }) => void;
  logoutUser: () => Promise<void>;
  setAppPin: (pin: string) => Promise<void>;
  removeAppPin: () => void;
  exportDataJSON: () => void;
  importDataJSON: (jsonStr: string) => boolean;
  resetAllData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentTab, setCurrentTab] = useState<TabType>("dashboard");
  const [currencyRates] = useState<CurrencyRate[]>(defaultCurrencyRates);

  // 1. Eksekusi Hook Modular
  const security = useSecurityState();
  const walletCat = useWalletCategoryState(security.user);
  const txOps = useTransactionState(
    security.user,
    walletCat.wallets,
    walletCat.setWallets,
  );
  const planning = usePlanningState(
    security.user,
    walletCat.setWallets,
    txOps.addTransaction,
  );

  useSupabaseRealtime({
    user: security.user,
    setWallets: walletCat.setWallets,
    setCategories: walletCat.setCategories,
    setTransactions: txOps.setTransactions,
    setBudgets: planning.setBudgets,
    setGoals: planning.setGoals,
    setDebtsLoans: planning.setDebtsLoans,
    setRecurringBills: planning.setRecurringBills,
    setSplitBills: planning.setSplitBills,
  });

  // =========================================================================
  // 1. SINKRONISASI SUPABASE: SELALU SET DATA (MESKIPUN ARRAY KOSONG [])
  // =========================================================================
  useEffect(() => {
    if (
      security.user.isLoggedIn &&
      security.user.email !== "guest@catatuang.app"
    ) {
      syncAllUserDataDB().then((data) => {
        if (data) {
          // KUNCI: Hapus syarat `if (length > 0)` agar data akun lama ditimpa bersih!
          walletCat.setWallets(data.wallets || []);
          walletCat.setCategories(data.categories || []);
          txOps.setTransactions(data.transactions || []);
          planning.setBudgets(data.budgets || []);
          planning.setGoals(data.goals || []);
          planning.setDebtsLoans(data.debtsLoans || []);
          planning.setRecurringBills(data.recurringBills || []);
          planning.setSplitBills(data.splitBills || []);
        }
      });
    }
  }, [security.user.isLoggedIn, security.user.email]);

  // =========================================================================
  // 2. LOGOUT BERSIH TOTAL: KOSONGKAN SEMUA STATE DARI AKUN SEBELUMNYA
  // =========================================================================
  const logoutUser = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("Gagal logout cloud:", err);
    }

    // 1. Hapus Storage
    localStorage.clear();

    // 2. Kosongkan seluruh memori React seketika
    security.setUser(initialUserProfile);
    security.setIsLocked(false);
    walletCat.setWallets([]);
    walletCat.setCategories([]);
    txOps.setTransactions([]);
    planning.setBudgets([]);
    planning.setGoals([]);
    planning.setDebtsLoans([]);
    planning.setRecurringBills([]);
    planning.setSplitBills([]);
  };

  // Ekspor / Impor Cadangan Data JSON
  const exportDataJSON = () => {
    const data = {
      wallets: walletCat.wallets,
      transactions: txOps.transactions,
      categories: walletCat.categories,
      budgets: planning.budgets,
      goals: planning.goals,
      debtsLoans: planning.debtsLoans,
      recurringBills: planning.recurringBills,
      splitBills: planning.splitBills,
      quickTemplates: txOps.quickTemplates,
      user: security.user,
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.href = url;
    downloadAnchor.download = `CatatUang_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    downloadAnchor.click();
    // Revoke asynchronously to give the browser time to initiate the download
    setTimeout(() => URL.revokeObjectURL(url), 100);
  };

  const importDataJSON = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.wallets) walletCat.setWallets(data.wallets);
      if (data.transactions) txOps.setTransactions(data.transactions);
      if (data.categories) walletCat.setCategories(data.categories);
      if (data.budgets) planning.setBudgets(data.budgets);
      if (data.goals) planning.setGoals(data.goals);
      if (data.debtsLoans) planning.setDebtsLoans(data.debtsLoans);
      if (data.recurringBills) planning.setRecurringBills(data.recurringBills);
      if (data.splitBills) planning.setSplitBills(data.splitBills);
      if (data.quickTemplates) txOps.setQuickTemplates(data.quickTemplates);
      if (data.user) security.setUser(data.user);
      return true;
    } catch {
      return false;
    }
  };

  const resetAllData = () => {
    logoutUser();
  };

  return (
    <AppContext.Provider
      value={{
        currentTab,
        setCurrentTab,
        currencyRates,
        ...security,
        ...walletCat,
        ...txOps,
        ...planning,
        logoutUser,
        exportDataJSON,
        importDataJSON,
        resetAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within an AppProvider");
  return context;
};
