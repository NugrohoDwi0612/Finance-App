"use client";

import React, { useState, useEffect } from "react"; // <-- Ditambahkan useEffect
import { AppProvider, useApp } from "@/context/AppContext";
import { Header } from "@/components/common/Header";
import { BottomNav } from "@/components/common/BottomNav";
import { AppLockModal } from "@/components/common/AppLockModal";
import { OfflineIndicator } from "@/components/common/OfflineIndicator";
import { PWAInstallBanner } from "@/components/common/PWAInstallBanner";

// Views
import { DashboardView } from "@/components/dashboard/DashboardView";
import { TransactionListView } from "@/components/transactions/TransactionListView";
import { TransactionModal } from "@/components/transactions/TransactionModal";
import { WalletsView } from "@/components/wallets/WalletsView";
import { CategoriesView } from "@/components/categories/CategoriesView";
import { BudgetsAndGoalsView } from "@/components/budgets/BudgetsAndGoalsView";
import { DebtsLoansView } from "@/components/debts/DebtsLoansView";
import { RecurringBillsView } from "@/components/recurring/RecurringBillsView";
import { AnalyticsView } from "@/components/analytics/AnalyticsView";
import { SmartToolsView } from "@/components/smart/SmartToolsView";
import { ProfileSettingsView } from "@/components/profile/ProfileSettingsView";
import { MoreMenuView } from "@/components/more/MoreMenuView";
import { WelcomeAuthScreen } from "@/components/auth/WelcomeAuthScreen";
import { ArrowLeft, Wallet as WalletSplash } from "lucide-react";

import { Transaction } from "@/types";
import { ParsedReceiptData } from "@/utils/ocrScanner";

const MainAppContent: React.FC = () => {
  const { currentTab, setCurrentTab, colorPreset, user } = useApp();

  // Transaction Modal State
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [scannedReceiptData, setScannedReceiptData] =
    useState<ParsedReceiptData | null>(null);

  // Jika user belum login / belum onboarding -> Tampilkan Welcome Screen
  if (!user.isLoggedIn || user.isOnboarded === false) {
    return <WelcomeAuthScreen />;
  }

  const handleOpenAddTransaction = () => {
    setSelectedTx(null);
    setScannedReceiptData(null);
    setIsTxModalOpen(true);
  };

  const handleSelectTransaction = (tx: Transaction) => {
    setSelectedTx(tx);
    setScannedReceiptData(null);
    setIsTxModalOpen(true);
  };

  const handleScanComplete = (data: ParsedReceiptData) => {
    setSelectedTx(null);
    setScannedReceiptData(data);
    setIsTxModalOpen(true);
  };

  const isSubView = [
    "wallets",
    "categories",
    "debts",
    "recurring",
    "smart",
    "profile",
    "budgets",
  ].includes(currentTab);

  return (
    <div className="h-full w-full flex flex-col justify-between overflow-hidden relative">
      {/* App Lock Screen (PIN & Biometric) */}
      <AppLockModal />

      {/* Offline Toast Banner */}
      <OfflineIndicator />

      {/* Application Mobile Header */}
      <Header onOpenSettings={() => setCurrentTab("profile")} />

      {/* Main Scrollable Content */}
      <main className="flex-1 w-full px-3.5 pt-3 pb-[calc(100px+env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain scrollbar-none relative z-0">
        {isSubView && (
          <div className="mb-3 flex items-center justify-between">
            <button
              onClick={() => setCurrentTab("more")}
              style={{ color: colorPreset.primaryHex }}
              className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full bg-stone-200/70 dark:bg-stone-800/70 text-xs font-bold hover:bg-stone-200 dark:hover:bg-stone-800 active:scale-95 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Menu Lainnya</span>
            </button>
          </div>
        )}

        {currentTab === "dashboard" && (
          <DashboardView
            onNavigateToTransactions={() => setCurrentTab("transactions")}
            onNavigateToWallets={() => setCurrentTab("wallets")}
            onNavigateToBudgets={() => setCurrentTab("budgets")}
            onOpenAddTransaction={handleOpenAddTransaction}
            onSelectTransaction={handleSelectTransaction}
            onOpenSmartScan={() => setCurrentTab("smart")}
          />
        )}

        {currentTab === "transactions" && (
          <TransactionListView
            onOpenAddTransaction={handleOpenAddTransaction}
            onSelectTransaction={handleSelectTransaction}
          />
        )}

        {currentTab === "wallets" && <WalletsView />}
        {currentTab === "categories" && <CategoriesView />}
        {currentTab === "budgets" && <BudgetsAndGoalsView />}
        {currentTab === "debts" && <DebtsLoansView />}
        {currentTab === "recurring" && <RecurringBillsView />}
        {currentTab === "analytics" && <AnalyticsView />}
        {currentTab === "smart" && (
          <SmartToolsView onScanComplete={handleScanComplete} />
        )}
        {currentTab === "profile" && <ProfileSettingsView />}
        {currentTab === "more" && <MoreMenuView />}
      </main>

      {/* PWA Install Banner */}
      <PWAInstallBanner />

      {/* Floating Bottom Navigation Dock */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenAddTransaction={handleOpenAddTransaction}
      />

      {/* Transaction Entry & Edit Modal */}
      <TransactionModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setSelectedTx(null);
          setScannedReceiptData(null);
        }}
        initialTransaction={selectedTx}
        initialScanData={
          scannedReceiptData
            ? {
                merchantName: scannedReceiptData.merchantName,
                totalAmount: scannedReceiptData.totalAmount,
                date: scannedReceiptData.date,
              }
            : null
        }
      />
    </div>
  );
};

// =========================================================================
// HYDRATION GUARD: Menghindari bentrok Server vs Browser (LocalStorage)
// =========================================================================
export default function App() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Selama render awal di server/SSR, tampilkan Splash Screen serasi
  if (!isMounted) {
    return (
      <div className="h-[100dvh] w-full bg-stone-950 flex flex-col items-center justify-center text-white">
        <div className="w-16 h-16 rounded-3xl bg-teal-500/20 text-teal-400 flex items-center justify-center animate-pulse mb-3">
          <WalletSplash size={32} />
        </div>
        <p className="text-xs font-bold text-stone-400 tracking-wider uppercase animate-pulse">
          Memuat CatatUang...
        </p>
      </div>
    );
  }

  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
