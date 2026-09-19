"use client";

import React, { useState } from "react";
import {
  Wallet,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  PieChart,
  ArrowRight,
  Check,
  Lock,
  Mail,
  User,
  Banknote,
  Coins,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { CurrencyCode } from "@/types";
import { formatMoneyInput } from "@/utils/formatters";
import { loginWithEmail, registerWithEmail } from "@/services/authService";
import { Badge } from "@/components/ui/badge";

interface WelcomeAuthScreenProps {
  onComplete?: () => void;
}

type AuthMode = "welcome" | "login" | "register" | "setup";

export const WelcomeAuthScreen: React.FC<WelcomeAuthScreenProps> = ({
  onComplete,
}) => {
  const { colorPreset, loginUser, completeOnboarding, setCurrentTab } =
    useApp();

  const [mode, setMode] = useState<AuthMode>("welcome");
  const [welcomeSlide, setWelcomeSlide] = useState(0);

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [currency, setCurrency] = useState<CurrencyCode>("IDR");
  const [initialBalance, setInitialBalance] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [enablePin, setEnablePin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const slides = [
    {
      icon: TrendingUp,
      badge: "FINANSIAL CERDAS",
      title: "Kendalikan Alur Keuangan Pribadi",
      desc: "Pantau arus kas masuk, pengeluaran harian, dan mutasi saldo di puluhan rekening secara real-time.",
      highlightColor: "#3b82f6",
    },
    {
      icon: PieChart,
      badge: "ANGGARAN & IMPIAN",
      title: "Target Menabung & Batas Anggaran",
      desc: "Hindari pemborosan dengan sistem alokasi budget cerdas, visualisasi chart, dan tabungan wishlist masa depan.",
      highlightColor: "#10b981",
    },
    {
      icon: ShieldCheck,
      badge: "PRIVASI 100% OFFLINE",
      title: "Data Tersimpan Aman di Perangkat",
      desc: "Akses penuh tanpa internet (PWA), proteksi sensor privasi saldo, enkripsi PIN 6-digit, dan biometrik sidik jari.",
      highlightColor: "#8b5cf6",
    },
  ];

  const handleNextSlide = () => {
    if (welcomeSlide < slides.length - 1) {
      setWelcomeSlide(welcomeSlide + 1);
    } else {
      setMode("login");
    }
  };

  const handleQuickGuestAccess = () => {
    completeOnboarding({
      name: "Tamu Eksplorasi",
      email: "guest@catatuang.app",
      baseCurrency: "IDR",
      initialBalance: 1500000,
    });
    setCurrentTab("dashboard");
    toast.success("Masuk dalam mode Tamu Demo!");
    if (onComplete) onComplete();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error("Harap masukkan email dan kata sandi.");
      return;
    }

    setIsLoading(true);
    const res = await loginWithEmail(email, password);

    if (!res.success) {
      toast.error(res.error || "Gagal masuk.");
      setIsLoading(false);
      return;
    }

    if (res.user) {
      loginUser(
        res.user.email || email,
        res.profile?.name || res.user.user_metadata?.name || undefined,
      );
      setCurrentTab("dashboard");
      toast.success("Berhasil masuk! Membuka dashboard...");
      if (onComplete) onComplete();
    }
    setIsLoading(false);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Harap masukkan nama lengkap Anda.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      toast.error("Harap masukkan alamat email yang valid.");
      return;
    }
    if (password.length < 6) {
      toast.error("Kata sandi minimal 6 karakter.");
      return;
    }
    setMode("setup");
  };

  const handleFinishSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const res = await registerWithEmail({
      name,
      email,
      password,
      currency,
      initialBalanceStr: initialBalance,
      pinCode,
      enablePin,
    });

    if (!res.success) {
      toast.error(res.error || "Gagal menyelesaikan pendaftaran.");
      setIsLoading(false);
      return;
    }

    completeOnboarding({
      name: name.trim(),
      email: email.trim(),
      baseCurrency: currency,
      initialBalance: res.balanceNum,
      pinCode: enablePin && pinCode.length === 6 ? pinCode : undefined,
    });
    setCurrentTab("dashboard");
    toast.success("Akun berhasil dibuat! Selamat datang di CatatUang.");

    setIsLoading(false);
    if (onComplete) onComplete();
  };

  return (
    // overflow-hidden mengunci layar agar bebas scroll 100%
    <div className="h-full w-full bg-stone-50 dark:bg-stone-950 flex flex-col justify-between p-4 text-stone-900 dark:text-stone-100 transition-colors animate-fadeIn relative overflow-hidden select-none">
      {/* Ambient background glow */}
      <div
        className="absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: colorPreset.primaryHex }}
      />
      <div
        className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-15 pointer-events-none"
        style={{ backgroundColor: colorPreset.secondaryHex }}
      />

      {/* Top Brand Bar */}
      <div className="relative z-10 flex items-center justify-between pt-safe shrink-0">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-xs"
            style={{
              background: `linear-gradient(135deg, ${colorPreset.primaryHex}, ${colorPreset.secondaryHex})`,
            }}
          >
            <Wallet className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none">
              <span className="font-black text-base tracking-tight">
                CatatUang
              </span>
              <Badge
                variant="outline"
                className="text-[8px] uppercase font-black px-1.5 py-0 h-3.5 border"
                style={{
                  backgroundColor: `${colorPreset.primaryHex}15`,
                  color: colorPreset.primaryHex,
                  borderColor: `${colorPreset.primaryHex}30`,
                }}
              >
                PRO
              </Badge>
            </div>
            <p className="text-[9px] text-stone-400 font-medium">
              Asisten Finansial Pintar
            </p>
          </div>
        </div>

        {mode !== "welcome" && (
          <button
            onClick={() => setMode("welcome")}
            disabled={isLoading}
            className="text-xs font-semibold text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition"
          >
            Kembali
          </button>
        )}
      </div>

      {/* ======================= VIEW 1: WELCOME SLIDES ======================= */}
      {mode === "welcome" && (
        <div className="relative z-10 my-auto py-2 flex flex-col items-center text-center">
          <div className="relative mb-3">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg mx-auto transition-transform duration-300 transform hover:scale-105"
              style={{
                background: `linear-gradient(135deg, ${slides[welcomeSlide].highlightColor}, ${colorPreset.primaryHex})`,
              }}
            >
              {React.createElement(slides[welcomeSlide].icon, {
                className: "w-10 h-10 text-white stroke-[2.2]",
              })}
            </div>

            <div className="mt-2.5">
              <span
                className="inline-block text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border"
                style={{
                  backgroundColor: `${slides[welcomeSlide].highlightColor}15`,
                  color: slides[welcomeSlide].highlightColor,
                  borderColor: `${slides[welcomeSlide].highlightColor}30`,
                }}
              >
                {slides[welcomeSlide].badge}
              </span>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100 tracking-tight max-w-xs leading-tight">
            {slides[welcomeSlide].title}
          </h1>

          <p className="text-xs text-stone-500 dark:text-stone-400 mt-2 max-w-xs leading-relaxed line-clamp-3">
            {slides[welcomeSlide].desc}
          </p>

          <div className="flex items-center gap-1.5 mt-4">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setWelcomeSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  welcomeSlide === idx
                    ? "w-5 shadow-xs"
                    : "w-1.5 bg-stone-200 dark:bg-stone-800"
                }`}
                style={
                  welcomeSlide === idx
                    ? { backgroundColor: colorPreset.primaryHex }
                    : {}
                }
              />
            ))}
          </div>

          <div className="w-full max-w-xs space-y-2 mt-5">
            <button
              onClick={handleNextSlide}
              style={{
                background: `linear-gradient(135deg, ${colorPreset.primaryHex}, ${colorPreset.secondaryHex})`,
                boxShadow: `0 6px 16px -4px ${colorPreset.primaryHex}40`,
              }}
              className="w-full py-3 px-4 rounded-2xl text-white font-bold text-xs shadow-md transition active:scale-98 flex items-center justify-center gap-2 hover:brightness-105"
            >
              <span>
                {welcomeSlide === slides.length - 1
                  ? "Mulai Sekarang"
                  : "Lanjut"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleQuickGuestAccess}
              className="w-full py-2.5 px-4 rounded-2xl bg-stone-100 dark:bg-stone-900 hover:bg-stone-200 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold text-xs transition active:scale-98 flex items-center justify-center gap-1.5 border border-stone-200/80 dark:border-stone-800"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Masuk Mode Demo Cepat (Tamu)</span>
            </button>
          </div>
        </div>
      )}

      {/* ======================= VIEW 2: LOGIN FORM ======================= */}
      {mode === "login" && (
        <div className="relative z-10 my-auto py-2 w-full max-w-sm mx-auto">
          <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xl space-y-4">
            <div>
              <h2 className="text-lg font-black text-stone-900 dark:text-stone-100">
                Selamat Datang Kembali 👋
              </h2>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Masuk untuk mengakses pembukuan keuangan Anda.
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                  Email Akun
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                  Kata Sandi
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    disabled={isLoading}
                    className="w-full pl-9 pr-9 py-2 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  background: `linear-gradient(135deg, ${colorPreset.primaryHex}, ${colorPreset.secondaryHex})`,
                  boxShadow: `0 6px 16px -4px ${colorPreset.primaryHex}40`,
                }}
                className="w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition active:scale-98 flex items-center justify-center gap-1.5 hover:brightness-105 mt-1 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Akun</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 text-center space-y-1.5">
              <p className="text-xs text-stone-400">
                Belum punya akun?{" "}
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  style={{ color: colorPreset.primaryHex }}
                  className="font-bold hover:underline"
                >
                  Daftar Sekarang
                </button>
              </p>

              <button
                type="button"
                onClick={handleQuickGuestAccess}
                className="text-[10px] font-semibold text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 block w-full py-0.5"
              >
                Atau lanjutkan dengan Mode Tamu Demo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= VIEW 3: REGISTER FORM ======================= */}
      {mode === "register" && (
        <div className="relative z-10 my-auto py-2 w-full max-w-sm mx-auto">
          <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xl space-y-4">
            <div>
              <h2 className="text-lg font-black text-stone-900 dark:text-stone-100">
                Buat Akun Baru ✨
              </h2>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Langkah 1 dari 2: Profil dasar akun Anda.
              </p>
            </div>

            <form onSubmit={handleRegisterSubmit} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                  Nama Lengkap
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Budi Santoso"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                  Alamat Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="budi@example.com"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    required
                    className="w-full pl-9 pr-9 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-medium focus:outline-hidden focus:ring-1 focus:ring-teal-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                style={{
                  background: `linear-gradient(135deg, ${colorPreset.primaryHex}, ${colorPreset.secondaryHex})`,
                  boxShadow: `0 6px 16px -4px ${colorPreset.primaryHex}40`,
                }}
                className="w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition active:scale-98 flex items-center justify-center gap-1.5 hover:brightness-105 mt-1"
              >
                <span>Lanjut Pengaturan Awal</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="pt-2 border-t border-stone-100 dark:border-stone-800 text-center">
              <p className="text-xs text-stone-400">
                Sudah memiliki akun?{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  style={{ color: colorPreset.primaryHex }}
                  className="font-bold hover:underline"
                >
                  Masuk Saja
                </button>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================= VIEW 4: INITIAL WALLET SETUP ======================= */}
      {mode === "setup" && (
        <div className="relative z-10 my-auto py-2 w-full max-w-sm mx-auto">
          <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xl space-y-3.5">
            <div>
              <span
                className="text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${colorPreset.primaryHex}15`,
                  color: colorPreset.primaryHex,
                }}
              >
                Langkah 2 dari 2
              </span>
              <h2 className="text-lg font-black text-stone-900 dark:text-stone-100 mt-1">
                Atur Dompet Pertama 💰
              </h2>
            </div>

            <form onSubmit={handleFinishSetup} className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                  Mata Uang Utama
                </label>
                <div className="relative">
                  <Coins className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={currency}
                    onChange={(e) =>
                      setCurrency(e.target.value as CurrencyCode)
                    }
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold focus:outline-hidden"
                  >
                    <option value="IDR">Rupiah Indonesia (Rp - IDR)</option>
                    <option value="USD">US Dollar ($ - USD)</option>
                    <option value="EUR">Euro (€ - EUR)</option>
                    <option value="JPY">Japanese Yen (¥ - JPY)</option>
                    <option value="SGD">Singapore Dollar (S$ - SGD)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-stone-400 mb-1">
                  Saldo Awal Dompet Tunai (Opsional)
                </label>
                <div className="relative">
                  <Banknote className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={initialBalance}
                    onChange={(e) =>
                      setInitialBalance(formatMoneyInput(e.target.value))
                    }
                    placeholder="Rp 0"
                    disabled={isLoading}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-mono font-bold focus:outline-hidden"
                  />
                </div>
              </div>

              {/* PIN Security */}
              <div className="p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-stone-400" />
                    <div>
                      <p className="text-xs font-bold text-stone-900 dark:text-stone-100 leading-none">
                        Kunci PIN 6-Digit
                      </p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={enablePin}
                    onChange={(e) => setEnablePin(e.target.checked)}
                    disabled={isLoading}
                    className="w-3.5 h-3.5 rounded text-teal-600 focus:ring-teal-500"
                  />
                </div>

                {enablePin && (
                  <div className="pt-1.5 border-t border-stone-200 dark:border-stone-700">
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      value={pinCode}
                      onChange={(e) =>
                        setPinCode(e.target.value.replace(/\D/g, ""))
                      }
                      placeholder="Ketik 6 Angka PIN"
                      disabled={isLoading}
                      className="w-full py-1.5 px-3 text-center tracking-widest font-mono text-sm rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 font-bold"
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  background: `linear-gradient(135deg, ${colorPreset.primaryHex}, ${colorPreset.secondaryHex})`,
                  boxShadow: `0 6px 16px -4px ${colorPreset.primaryHex}40`,
                }}
                className="w-full py-2.5 rounded-xl text-white font-bold text-xs shadow-md transition active:scale-98 flex items-center justify-center gap-1.5 hover:brightness-105 mt-1 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Mendaftarkan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Selesaikan & Masuk</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Footer Note */}
      <div className="relative z-10 text-center pb-safe pt-1 shrink-0">
        <p className="text-[9px] text-stone-400">
          Data tersinkronisasi aman dengan Supabase Cloud & tersimpan offline.
        </p>
      </div>
    </div>
  );
};
