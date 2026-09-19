"use client";

import React from "react";
import {
  Wallet,
  Tags,
  HandCoins,
  CalendarClock,
  Sparkles,
  Settings,
  ChevronRight,
  ShieldCheck,
  Zap,
  BarChart3,
  Target,
  FileCode,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { TabType } from "../../types";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";

interface MoreMenuItem {
  id: TabType;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  badge?: string;
}

export const MoreMenuView: React.FC = () => {
  const { setCurrentTab, wallets, debtsLoans, recurringBills, budgets } =
    useApp();

  const activeDebtsCount = debtsLoans.filter(
    (d) => d.status !== "paid", //
  ).length;
  const activeBillsCount = recurringBills.filter((b) => b.isActive).length;

  const menuItems: MoreMenuItem[] = [
    {
      id: "analytics",
      title: "Laporan Keuangan Lengkap",
      subtitle: "Arus kas, grafik kategori, tren bulanan & ekspor PDF/CSV",
      icon: BarChart3,
      iconBg: "bg-stone-100 dark:bg-stone-800",
      iconColor: "text-stone-800 dark:text-stone-200",
      badge: "Lengkap",
    },
    {
      id: "budgets",
      title: "Anggaran & Target Impian",
      subtitle: `${budgets.length} Anggaran bulanan & celengan impian`,
      icon: Target,
      iconBg: "bg-stone-100 dark:bg-stone-800",
      iconColor: "text-stone-800 dark:text-stone-200",
    },
    {
      id: "wallets",
      title: "Dompet & Rekening",
      subtitle: `${wallets.length} Akun terdaftar (Bank, E-Wallet, Tunai)`,
      icon: Wallet,
      iconBg: "bg-stone-100 dark:bg-stone-800",
      iconColor: "text-stone-800 dark:text-stone-200",
    },
    {
      id: "categories",
      title: "Kategori Transaksi",
      subtitle: "Sesuaikan pos pemasukan & pos pengeluaran",
      icon: Tags,
      iconBg: "bg-stone-100 dark:bg-stone-800",
      iconColor: "text-stone-800 dark:text-stone-200",
    },
    {
      id: "debts",
      title: "Catatan Hutang & Piutang",
      subtitle: `${activeDebtsCount} Catatan aktif belum lunas`,
      icon: HandCoins,
      iconBg: "bg-stone-100 dark:bg-stone-800",
      iconColor: "text-stone-800 dark:text-stone-200",
      badge: activeDebtsCount > 0 ? `${activeDebtsCount} Aktif` : undefined,
    },
    {
      id: "recurring",
      title: "Tagihan Rutin & Langganan",
      subtitle: `${activeBillsCount} Tagihan berulang aktif`,
      icon: CalendarClock,
      iconBg: "bg-stone-100 dark:bg-stone-800",
      iconColor: "text-stone-800 dark:text-stone-200",
      badge: activeBillsCount > 0 ? `${activeBillsCount} Tagihan` : undefined,
    },
    {
      id: "smart",
      title: "OCR Struk & Alat Cerdas",
      subtitle: "Pindai otomatis struk belanja dengan kamera / galeri",
      icon: Sparkles,
      iconBg: "bg-stone-100 dark:bg-stone-800",
      iconColor: "text-stone-800 dark:text-stone-200",
      badge: "AI Smart",
    },
    {
      id: "profile",
      title: "Pengaturan & Keamanan",
      subtitle: "Transparansi navigasi liquid glass, tema, PIN & cadangan",
      icon: Settings,
      iconBg: "bg-stone-100 dark:bg-stone-800",
      iconColor: "text-stone-800 dark:text-stone-200",
    },
  ];

  return (
    <div className="space-y-4 pb-28 animate-fadeIn">
      {/* Header Info */}
      <div>
        <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
          Menu & Fitur Lainnya
        </h2>
        <p className="text-xs text-stone-400">
          Pusat pengaturan akun, manajemen dompet, tagihan, dan alat cerdas
        </p>
      </div>

      {/* Grid of Menu Items with shadcn Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Card
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className="flex items-center gap-3.5 p-4 hover:border-stone-400 dark:hover:border-stone-600 shadow-xs hover:shadow-md transition text-left group cursor-pointer"
            >
              <div
                className={`w-12 h-12 rounded-2xl ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}
              >
                <Icon className="w-6 h-6" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100 truncate">
                    {item.title}
                  </h3>
                  {item.badge && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-stone-400 truncate mt-0.5">
                  {item.subtitle}
                </p>
              </div>

              <ChevronRight className="w-5 h-5 text-stone-300 dark:text-stone-600 group-hover:text-stone-900 dark:group-hover:text-stone-100 group-hover:translate-x-0.5 transition-all shrink-0" />
            </Card>
          );
        })}
      </div>

      {/* Security & Offline Banner Card */}
      <Card className="p-4 bg-stone-100/70 dark:bg-stone-900/60 border-stone-200/80 dark:border-stone-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-stone-900 dark:bg-stone-100 text-stone-100 dark:text-stone-900 flex items-center justify-center shrink-0 shadow-xs">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-stone-900 dark:text-stone-100">
            Privasi 100% Aman & Terenkripsi Lokal
          </h4>
          <p className="text-[11px] text-stone-500 dark:text-stone-400">
            Data keuangan disimpan di perangkat Anda sendiri tanpa server pihak
            ketiga.
          </p>
        </div>
      </Card>
    </div>
  );
};
