"use client";

import React from "react";
import { Moon, Sun, Lock, Flame, Wallet as WalletIcon } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  onOpenSettings?: () => void;
  onOpenHabitStreak?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenSettings = () => {},
  onOpenHabitStreak = () => {},
}) => {
  const { user, theme, setTheme, lockApp, colorPreset } = useApp();

  // Nama aman dari crash jika user baru belum isi nama
  const displayName = user?.name ? user.name.trim() : "Pengguna";
  const firstName = displayName.split(" ")[0] || "Pengguna";
  const initialLetter = displayName.charAt(0).toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-30 bg-stone-50 dark:bg-stone-950 border-b border-stone-200/80 dark:border-stone-800/80 px-3.5 pb-2.5 pt-[max(0.85rem,env(safe-area-inset-top))] transition-colors duration-200">
      <div className="w-full flex items-center justify-between gap-2">
        {/* Brand Logo & Sapaan Pengguna (Kiri) */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-2xl bg-stone-950 dark:bg-white text-white dark:text-stone-950 flex items-center justify-center font-black shadow-xs shrink-0 ring-1 ring-black/5 dark:ring-white/20">
            <WalletIcon className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-black text-[15px] tracking-tight text-stone-900 dark:text-stone-100">
                CatatUang
              </span>
              <Badge
                variant="outline"
                className="text-[9px] font-black uppercase px-1.5 py-0 h-4 border transition-colors"
                style={{
                  backgroundColor: `${colorPreset.primaryHex}15`,
                  color: colorPreset.primaryHex,
                  borderColor: `${colorPreset.primaryHex}30`,
                }}
              >
                PRO
              </Badge>
            </div>
            <p className="text-[11px] text-stone-400 font-medium mt-0.5 flex items-center gap-1 truncate">
              <span className="truncate">Hai, {firstName}</span>
              <span
                className="inline-block w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                style={{ backgroundColor: colorPreset.primaryHex }}
              />
            </p>
          </div>
        </div>

        {/* Kontrol Aksi Cepat (Kanan) */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Lencana Streak Harian */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenHabitStreak}
            className="h-7 px-2 rounded-full gap-1 text-[11px] font-bold border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 shadow-2xs"
            title="Disiplin Mencatat Transaksi Tiap Hari!"
          >
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-bounce" />
            <span className="font-mono text-stone-800 dark:text-stone-200">
              {user.streakDays || 1}d
            </span>
          </Button>

          {/* Toggle Ganti Tema */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="w-8 h-8 rounded-full text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800"
            title={
              theme === "light"
                ? "Beralih ke Mode Gelap"
                : "Beralih ke Mode Terang"
            }
          >
            {theme === "light" ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4 text-amber-400" />
            )}
          </Button>

          {/* Tombol Kunci Aplikasi (Jika PIN Aktif) */}
          {user.pinEnabled && (
            <Button
              variant="ghost"
              size="icon"
              onClick={lockApp}
              className="w-8 h-8 rounded-full text-stone-500 hover:text-stone-900 dark:hover:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800"
              title="Kunci Aplikasi Sekarang"
            >
              <Lock className="w-4 h-4" />
            </Button>
          )}

          {/* Avatar Profil dengan Ring Aksen Dinamis */}
          <button
            onClick={onOpenSettings}
            className="w-8 h-8 rounded-full overflow-hidden transition active:scale-90 relative ring-2 ml-0.5 cursor-pointer shrink-0"
            style={{
              boxShadow: `0 0 0 2px ${colorPreset.primaryHex}40`,
            }}
            title="Pengaturan & Profil Akun"
          >
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div
                className="w-full h-full text-white flex items-center justify-center text-xs font-black"
                style={{
                  background: `linear-gradient(135deg, ${colorPreset.primaryHex}, ${colorPreset.secondaryHex})`,
                }}
              >
                {initialLetter}
              </div>
            )}
            <span
              className="absolute bottom-0 right-0 w-2 h-2 rounded-full ring-1 ring-white dark:ring-stone-900"
              style={{ backgroundColor: colorPreset.primaryHex }}
            />
          </button>
        </div>
      </div>
    </header>
  );
};
