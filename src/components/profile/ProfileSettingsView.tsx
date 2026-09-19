"use client";

import React, { useState, useRef } from "react";
import {
  User,
  Shield,
  KeyRound,
  Fingerprint,
  Moon,
  Sun,
  Laptop,
  Download,
  Upload,
  RotateCcw,
  Eye,
  EyeOff,
  Check,
  AlertTriangle,
  FileSpreadsheet,
  Globe,
  Camera,
  LogOut,
  Sparkles,
  Info,
  Palette,
  SlidersHorizontal,
  Smartphone,
  Layout,
  Sliders,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { CurrencyCode, ThemeMode, AccentColor, NavSettings } from "../../types";
import { COLOR_PRESETS } from "../../utils/themePresets";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { Separator } from "../ui/separator";
import { Select } from "../ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Alert, AlertDescription } from "../ui/alert";
import { toast } from "sonner";
import {
  checkDeviceBiometrics,
  registerBiometricSensor,
} from "@/utils/biometrics";

export const ProfileSettingsView: React.FC = () => {
  const {
    user,
    updateUserProfile,
    setAppPin,
    removeAppPin,
    hideBalances,
    setHideBalances,
    theme,
    setTheme,
    accentColor,
    colorPreset,
    setAccentColor,
    navSettings,
    updateNavSettings,
    exportDataJSON,
    importDataJSON,
    resetAllData,
    logoutUser,
  } = useApp();

  const [nameInput, setNameInput] = useState(user.name);
  const [emailInput, setEmailInput] = useState(user.email);
  const [currencyInput, setCurrencyInput] = useState<CurrencyCode>(
    user.baseCurrency,
  );
  const [avatarPreview, setAvatarPreview] = useState(user.avatarUrl);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Security PIN states
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinStep, setPinStep] = useState<"current" | "new" | "confirm">("new");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [pinError, setPinError] = useState("");

  // Backup / Import file ref
  const importFileRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({
      name: nameInput.trim() || "Pengguna CatatUang",
      email: emailInput.trim(),
      baseCurrency: currencyInput,
      avatarUrl: avatarPreview,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTogglePinLock = () => {
    if (user.pinEnabled) {
      // Disable PIN
      if (confirm("Nonaktifkan kunci PIN aplikasi?")) {
        removeAppPin();
      }
    } else {
      // Set new PIN
      setPinStep("new");
      setNewPin("");
      setConfirmPin("");
      setPinError("");
      setIsPinModalOpen(true);
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      setPinError("PIN harus berupa 6 angka digit!");
      return;
    }
    if (pinStep === "new") {
      setPinStep("confirm");
      setPinError("");
    } else if (pinStep === "confirm") {
      if (newPin !== confirmPin) {
        setPinError("Konfirmasi PIN tidak cocok!");
        return;
      }
      setAppPin(newPin);
      setIsPinModalOpen(false);
    }
  };

  const handleToggleBiometric = async () => {
    if (!user.biometricsEnabled) {
      // 1. Cek apakah HP punya sensor FaceID / Sidik Jari
      const isAvailable = await checkDeviceBiometrics();
      if (!isAvailable) {
        toast.error(
          "Perangkat ini tidak memiliki sensor Face ID atau Sidik Jari yang aktif.",
        );
        return;
      }

      toast.info("Arahkan wajah ke Face ID atau sentuh sensor sidik jari...");

      // 2. Munculkan popup sensor fisik native HP
      const success = await registerBiometricSensor(user.name);
      if (success) {
        updateUserProfile({ biometricsEnabled: true });
        toast.success(
          "Autentikasi Biometrik (Face ID / Sidik Jari) Berhasil Diaktifkan!",
        );
      } else {
        toast.error("Pemindaian biometrik dibatalkan.");
      }
    } else {
      updateUserProfile({ biometricsEnabled: false });
      toast.info("Kunci biometrik dinonaktifkan.");
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const jsonStr = event.target?.result as string;
        const success = importDataJSON(jsonStr);
        if (success) {
          alert("Data berhasil dipulihkan dari file backup!");
        } else {
          alert("Format file cadangan tidak valid.");
        }
      } catch {
        alert("Gagal membaca file backup.");
      }
    };
    reader.readAsText(file);
  };

  const handleResetApp = () => {
    const confirmation = prompt(
      'PERINGATAN: Tindakan ini akan menghapus seluruh data transaksi, dompet, dan tagihan!\n\nKetik "RESET" untuk konfirmasi:',
    );
    if (confirmation === "RESET") {
      resetAllData();
      alert("Aplikasi telah diatur ulang ke kondisi awal.");
    }
  };

  return (
    <div className="space-y-4 pb-28 animate-fadeIn">
      {/* Profile Header */}
      <div className="p-5 rounded-3xl bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 shadow-xs flex items-center gap-4">
        <div className="relative">
          <input
            type="file"
            ref={avatarInputRef}
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          {avatarPreview ? (
            <img
              src={avatarPreview}
              alt="Avatar"
              className="w-16 h-16 rounded-2xl object-cover border-2 border-teal-500 shadow-xs"
            />
          ) : (
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-extrabold shadow-xs border-2 border-teal-500/40"
              style={{
                background: `linear-gradient(135deg, ${colorPreset.primaryHex}, ${colorPreset.secondaryHex})`,
              }}
            >
              {user.name ? user.name.charAt(0).toUpperCase() : "U"}
            </div>
          )}
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="absolute -bottom-1 -right-1 p-1 rounded-lg bg-teal-600 text-white shadow-xs hover:bg-teal-500 transition"
            title="Ubah Foto Profil"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100 truncate">
            {user.name}
          </h2>
          <p className="text-xs text-stone-400 truncate">{user.email}</p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <Badge
              variant="outline"
              className="text-[10px] bg-stone-100 dark:bg-stone-800"
            >
              PWA Mode: Siap Offline
            </Badge>
          </div>
        </div>
      </div>

      {/* 1. Edit User Profile Form */}
      <Card className="p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
          Pengaturan Akun & Mata Uang
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bold uppercase text-stone-400 mb-1">
              Nama Lengkap
            </label>
            <Input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="text-xs font-semibold h-9"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-stone-400 mb-1">
              Email Pengguna
            </label>
            <Input
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold uppercase text-stone-400">
              Mata Uang Dasar
            </label>
            <Select
              value={currencyInput}
              onChange={(e) => setCurrencyInput(e.target.value as CurrencyCode)}
            >
              <option value="IDR">Rupiah Indonesia (Rp - IDR)</option>
              <option value="USD">US Dollar ($ - USD)</option>
              <option value="EUR">Euro (€ - EUR)</option>
              <option value="JPY">Japanese Yen (¥ - JPY)</option>
              <option value="SGD">Singapore Dollar (S$ - SGD)</option>
            </Select>
          </div>

          <Button
            type="submit"
            style={{
              background: `linear-gradient(135deg, ${colorPreset.primaryHex}, ${colorPreset.secondaryHex})`,
            }}
            className="w-full text-white font-bold text-xs shadow-md transition hover:brightness-105"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Tersimpan!</span>
              </>
            ) : (
              <span>Simpan Profil</span>
            )}
          </Button>
        </form>
      </Card>

      {/* 2. Keamanan & Kunci Aplikasi (Modul 11) */}
      <Card className="p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
          Keamanan & Privasi (Modul 11)
        </h3>

        <div className="divide-y divide-stone-100 dark:divide-stone-800 text-xs">
          {/* PIN Lock Toggle */}
          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <KeyRound className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-stone-900 dark:text-stone-100">
                  Kunci PIN 6-Digit
                </p>
                <span className="text-[10px] text-stone-400">
                  {user.pinEnabled ? "PIN Aktif" : "Nonaktif"}
                </span>
              </div>
            </div>
            <button
              onClick={handleTogglePinLock}
              style={
                !user.pinEnabled
                  ? { backgroundColor: colorPreset.primaryHex }
                  : {}
              }
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                user.pinEnabled
                  ? "bg-rose-50 dark:bg-rose-950 text-rose-600"
                  : "text-white"
              }`}
            >
              {user.pinEnabled ? "Ubah / Matikan" : "Aktifkan PIN"}
            </button>
          </div>

          {/* Biometric Toggle */}
          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                <Fingerprint className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-stone-900 dark:text-stone-100">
                  Biometrik (Sidik Jari / Face ID)
                </p>
                <span className="text-[10px] text-stone-400">
                  WebAuthn Hardware Auth
                </span>
              </div>
            </div>
            <button
              onClick={handleToggleBiometric}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                user.biometricsEnabled
                  ? "bg-indigo-600 text-white"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
              }`}
            >
              {user.biometricsEnabled ? "Aktif" : "Aktifkan"}
            </button>
          </div>

          {/* Privacy Sensor default toggle */}
          <div className="py-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
                {hideBalances ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </div>
              <div>
                <p className="font-bold text-stone-900 dark:text-stone-100">
                  Sensor Privasi Saldo
                </p>
                <span className="text-[10px] text-stone-400">
                  Samarkan nominal uang di layar (Rp •••••••)
                </span>
              </div>
            </div>
            <button
              onClick={() => setHideBalances(!hideBalances)}
              style={
                hideBalances ? { backgroundColor: colorPreset.primaryHex } : {}
              }
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                hideBalances
                  ? "text-white"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300"
              }`}
            >
              {hideBalances ? "Tersamarkan" : "Terlihat"}
            </button>
          </div>
        </div>
      </Card>

      {/* 3. Tampilan & Tema (Modul 11) */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300">
              <Palette className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
              Kustomisasi Tema & Warna
            </h3>
          </div>
          <span className="text-[10px] font-bold text-stone-400">
            {COLOR_PRESETS.length} Pilihan Warna
          </span>
        </div>

        {/* Mode Gelap / Terang */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-stone-400 mb-1.5">
            Mode Tampilan
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTheme("light")}
              className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 transition ${
                theme === "light"
                  ? "border-stone-950 dark:border-white bg-stone-100 dark:bg-stone-800 text-stone-950 dark:text-white font-bold shadow-xs"
                  : "border-stone-200 dark:border-stone-800 text-stone-500 hover:bg-stone-50"
              }`}
            >
              <Sun className="w-4 h-4" />
              <span className="text-[11px]">Terang</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme("dark")}
              className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 transition ${
                theme === "dark"
                  ? "border-stone-950 dark:border-white bg-stone-100 dark:bg-stone-800 text-stone-950 dark:text-white font-bold shadow-xs"
                  : "border-stone-200 dark:border-stone-800 text-stone-500 hover:bg-stone-50"
              }`}
            >
              <Moon className="w-4 h-4" />
              <span className="text-[11px]">Gelap</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme("system")}
              className={`p-2.5 rounded-2xl border flex flex-col items-center gap-1.5 transition ${
                theme === "system"
                  ? "border-stone-950 dark:border-white bg-stone-100 dark:bg-stone-800 text-stone-950 dark:text-white font-bold shadow-xs"
                  : "border-stone-200 dark:border-stone-800 text-stone-500 hover:bg-stone-50"
              }`}
            >
              <Laptop className="w-4 h-4" />
              <span className="text-[11px]">Sistem</span>
            </button>
          </div>
        </div>

        {/* Pilihan Aksen Warna Fleksibel */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-[11px] font-bold uppercase text-stone-400">
              Palet Warna Aksen Aplikasi
            </label>
            <span
              className="text-[11px] font-mono font-bold"
              style={{ color: colorPreset.primaryHex }}
            >
              {colorPreset.name}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {COLOR_PRESETS.map((preset) => {
              const isSelected = accentColor === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setAccentColor(preset.id)}
                  className={`p-2.5 rounded-2xl border flex items-center justify-between transition active:scale-[0.99] text-left ${
                    isSelected
                      ? "border-stone-950 dark:border-white/40 bg-stone-50 dark:bg-stone-800/80 shadow-xs ring-1 ring-stone-900/10 dark:ring-white/20"
                      : "border-stone-200/80 dark:border-stone-800/80 hover:bg-stone-50/50 dark:hover:bg-stone-800/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Color Swatch Circle with Gradient */}
                    <div
                      className="w-8 h-8 rounded-xl shadow-xs flex items-center justify-center shrink-0 border border-white/20"
                      style={{
                        background: `linear-gradient(135deg, ${preset.primaryHex}, ${preset.secondaryHex})`,
                      }}
                    >
                      {isSelected && (
                        <Check className="w-4 h-4 text-white stroke-[3]" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-stone-900 dark:text-stone-100">
                          {preset.name}
                        </span>
                        {preset.id === "indigo" && (
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-md bg-stone-200/70 dark:bg-stone-700 text-stone-700 dark:text-stone-300">
                            Rekomendasi
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-stone-400 font-medium">
                        {preset.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Micro color preview dots */}
                  <div className="flex items-center gap-1 shrink-0">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: preset.primaryHex }}
                    />
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: preset.secondaryHex }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* 4. Kustomisasi Navigasi iPhone Liquid Glass & Transparansi */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-stone-100 dark:bg-stone-800 flex items-center justify-center text-stone-600 dark:text-stone-300">
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Navigasi iPhone Liquid Glass
              </h3>
              <p className="text-[10px] text-stone-500 dark:text-stone-400">
                Kaca oval aktif melayang & dapat diseret untuk pindah menu
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 border border-teal-200/50 dark:border-teal-800/50">
            Kaca Oval Draggable
          </span>
        </div>

        {/* Live Interactive Preview Box with vibrant background */}
        <div className="relative rounded-2xl p-4 overflow-hidden border border-stone-200 dark:border-stone-800 shadow-inner">
          {/* Background colorful elements simulating page content */}
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/20 via-teal-500/25 to-indigo-600/30 dark:from-amber-600/25 dark:via-teal-600/30 dark:to-indigo-700/35" />
          <div className="absolute -top-6 -left-6 w-24 h-24 rounded-full bg-teal-400/40 blur-xl" />
          <div className="absolute -bottom-6 -right-6 w-28 h-28 rounded-full bg-indigo-400/40 blur-xl" />
          <div className="absolute inset-0 flex flex-col justify-between p-3 opacity-30 text-[10px] font-mono select-none">
            <div className="flex justify-between">
              <span>● Arus Kas Rp 12.500.000</span>
              <span>Kategori: Makanan</span>
            </div>
            <div className="flex justify-between">
              <span>BCA 0821xxxx</span>
              <span>+ Rp 4.500.000 Gaji</span>
            </div>
          </div>

          {/* Floating mini glass pill preview */}
          <div className="relative z-10 flex flex-col items-center">
            <p className="text-[10px] font-bold text-stone-700 dark:text-stone-300 mb-2">
              Pratinjau Kaca Transparan & Kaca Oval Geser:
            </p>
            <div
              style={{
                backgroundColor:
                  theme === "dark"
                    ? `rgba(18, 18, 18, ${Math.min(1, Math.max(0, (navSettings?.transparency ?? 25) / 100))})`
                    : `rgba(255, 255, 255, ${Math.min(1, Math.max(0, (navSettings?.transparency ?? 25) / 100))})`,
                borderColor:
                  theme === "dark"
                    ? "rgba(255, 255, 255, 0.15)"
                    : "rgba(255, 255, 255, 0.65)",
              }}
              className="w-full max-w-[290px] rounded-[24px] py-1.5 px-2 flex items-center justify-between border shadow-lg backdrop-blur-2xl transition-all duration-200 relative isolate"
            >
              {/* Active Oval Glass Lens Highlight simulation */}
              <div
                style={{
                  backgroundColor:
                    theme === "dark"
                      ? "rgba(255, 255, 255, 0.11)"
                      : "rgba(255, 255, 255, 0.32)",
                  borderColor:
                    theme === "dark"
                      ? "rgba(255, 255, 255, 0.18)"
                      : "rgba(255, 255, 255, 0.55)",
                }}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-11 h-9 rounded-[16px] border shadow-xs backdrop-blur-xl z-0"
              />

              <div className="relative z-10 w-9 h-9 rounded-xl flex items-center justify-center text-stone-900 dark:text-white text-xs font-bold">
                ⌂
              </div>
              <div className="relative z-10 w-9 h-9 text-stone-600 dark:text-stone-300 flex items-center justify-center text-xs">
                ⌕
              </div>
              <div
                style={{ backgroundColor: colorPreset.primaryHex }}
                className="relative z-10 w-8 h-8 rounded-xl text-white flex items-center justify-center text-xs font-black shadow-xs"
              >
                +
              </div>
              <div className="relative z-10 w-9 h-9 text-stone-600 dark:text-stone-300 flex items-center justify-center text-xs">
                ▦
              </div>
              <div className="relative z-10 w-7 h-7 rounded-full overflow-hidden border border-stone-400">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full text-white flex items-center justify-center text-[10px] font-bold"
                    style={{
                      background: `linear-gradient(135deg, ${colorPreset.primaryHex}, ${colorPreset.secondaryHex})`,
                    }}
                  >
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                )}
              </div>
            </div>
            <p className="text-[10px] text-stone-500 dark:text-stone-400 mt-2 font-medium">
              Transparansi Kaca:{" "}
              <strong className="font-bold text-stone-900 dark:text-white">
                {navSettings?.transparency ?? 25}% Opacity
              </strong>{" "}
              ({100 - (navSettings?.transparency ?? 25)}% Tembus Pandang)
            </p>
          </div>
        </div>

        {/* 1. Pengaturan Slider Transparansi */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold uppercase text-stone-400">
              Tingkat Transparansi (Opacity Kaca)
            </label>
            <span className="text-xs font-mono font-bold text-teal-600 dark:text-teal-400">
              {navSettings?.transparency ?? 25}%
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={navSettings?.transparency ?? 25}
            onChange={(e) =>
              updateNavSettings({ transparency: Number(e.target.value) })
            }
            className="w-full accent-teal-600 cursor-pointer h-2 bg-stone-200 dark:bg-stone-800 rounded-lg"
          />

          <div className="flex items-center justify-between text-[10px] text-stone-400 font-medium">
            <span>0% (Kristal Transparan Penuh)</span>
            <span>50% (Semi-Frosted)</span>
            <span>100% (Solid Pekat)</span>
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-4 gap-1.5 pt-1">
            {[
              { label: "Bening", value: 15, hint: "Transparan" },
              { label: "Liquid iOS", value: 25, hint: "Video Style" },
              { label: "Frosted", value: 50, hint: "Kaca Es" },
              { label: "Solid", value: 90, hint: "Pekat" },
            ].map((preset) => {
              const isActive =
                (navSettings?.transparency ?? 25) === preset.value;
              return (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() =>
                    updateNavSettings({ transparency: preset.value })
                  }
                  className={`py-1.5 px-1 rounded-xl text-center border text-[11px] font-semibold transition active:scale-95 ${
                    isActive
                      ? "border-teal-500 bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold shadow-xs"
                      : "border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800"
                  }`}
                >
                  <div>{preset.label}</div>
                  <div className="text-[9px] opacity-75">{preset.value}%</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Intensitas Efek Blur */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2">
          <label className="text-[11px] font-bold uppercase text-stone-400">
            Intensitas Efek Blur (Backdrop Filter)
          </label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: "none", label: "Mati" },
              { id: "light", label: "Ringan" },
              { id: "medium", label: "Sedang" },
              { id: "ultra", label: "Ultra iOS" },
            ].map((b) => {
              const isSelected =
                (navSettings?.blurIntensity || "ultra") === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() =>
                    updateNavSettings({ blurIntensity: b.id as any })
                  }
                  className={`py-1.5 px-2 rounded-xl text-center border text-[11px] font-semibold transition ${
                    isSelected
                      ? "border-stone-900 dark:border-white bg-stone-900 dark:bg-white text-white dark:text-stone-900 font-bold shadow-xs"
                      : "border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-50"
                  }`}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Gaya Tampilan Navigasi */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2">
          <label className="text-[11px] font-bold uppercase text-stone-400">
            Model Tampilan Bilah Navigasi
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => updateNavSettings({ styleVariant: "floating" })}
              className={`p-2.5 rounded-2xl border text-left flex items-start gap-2.5 transition ${
                (navSettings?.styleVariant || "floating") === "floating"
                  ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 ring-1 ring-teal-500/20"
                  : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50"
              }`}
            >
              <Smartphone className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                  Floating Island Pill
                </div>
                <div className="text-[10px] text-stone-400">
                  Kapsul melayang rounded iOS
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => updateNavSettings({ styleVariant: "docked" })}
              className={`p-2.5 rounded-2xl border text-left flex items-start gap-2.5 transition ${
                navSettings?.styleVariant === "docked"
                  ? "border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 ring-1 ring-teal-500/20"
                  : "border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/50"
              }`}
            >
              <Layout className="w-4 h-4 text-teal-600 mt-0.5 shrink-0" />
              <div>
                <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                  Docked iOS Native
                </div>
                <div className="text-[10px] text-stone-400">
                  Bilah bawah penuh seperti Instagram
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 4. Opsi Minimalis Ikon & Avatar Profil */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                Mode Ikon Bersih Tanpa Label Teks
              </p>
              <p className="text-[10px] text-stone-400">
                Tampilan minimalis persis seperti di video Instagram iOS
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                updateNavSettings({ showLabels: !navSettings?.showLabels })
              }
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                !navSettings?.showLabels
                  ? "bg-teal-600 text-white"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
              }`}
            >
              {!navSettings?.showLabels ? "Ikon Saja (iOS)" : "Ikon + Teks"}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-stone-900 dark:text-stone-100">
                Tampilkan Foto Profil di Tab Menu
              </p>
              <p className="text-[10px] text-stone-400">
                Avatar bulat dengan ring aktif di pojok kanan bawah
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                updateNavSettings({
                  showProfileAvatar:
                    navSettings?.showProfileAvatar === false ? true : false,
                })
              }
              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                navSettings?.showProfileAvatar !== false
                  ? "bg-teal-600 text-white"
                  : "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400"
              }`}
            >
              {navSettings?.showProfileAvatar !== false
                ? "Aktif (Avatar)"
                : "Ikon Biasa"}
            </button>
          </div>
        </div>
      </Card>

      {/* 5. Backup & Restore (Modul 11) */}
      <Card className="p-4 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400">
          Cadangan & Pemulihan Data
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <Button
            variant="secondary"
            onClick={exportDataJSON}
            className="p-3 text-stone-800 dark:text-stone-200 font-bold text-xs gap-2"
          >
            <Download className="w-4 h-4 text-teal-600" />
            <span>Ekspor File Backup JSON</span>
          </Button>

          <div>
            <input
              type="file"
              ref={importFileRef}
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
            <Button
              variant="secondary"
              onClick={() => importFileRef.current?.click()}
              className="w-full p-3 text-stone-800 dark:text-stone-200 font-bold text-xs gap-2"
            >
              <Upload className="w-4 h-4 text-teal-600" />
              <span>Impor Cadangan Data</span>
            </Button>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={handleResetApp}
          className="w-full border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950 font-bold text-xs flex items-center justify-center gap-1.5"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Atur Ulang ke Pengaturan Awal (Factory Reset)</span>
        </Button>

        <Button
          variant="secondary"
          onClick={() => {
            if (
              confirm(
                "Keluar dari sesi akun Anda dan kembali ke layar Selamat Datang?",
              )
            ) {
              logoutUser();
            }
          }}
          className="w-full font-bold text-xs flex items-center justify-center gap-1.5"
        >
          <LogOut className="w-4 h-4" />
          <span>Keluar Akun (Kembali ke Layar Pertama)</span>
        </Button>
      </Card>

      {/* PIN Setup Modal with shadcn Dialog */}
      <Dialog open={isPinModalOpen} onOpenChange={setIsPinModalOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle>
              {pinStep === "new"
                ? "Buat PIN 6-Digit Baru"
                : "Konfirmasi PIN Anda"}
            </DialogTitle>
          </DialogHeader>

          <p className="text-xs text-stone-400">
            {pinStep === "new"
              ? "Masukkan 6 angka PIN keamanan"
              : "Ketik ulang PIN yang sama untuk verifikasi"}
          </p>

          {pinError && (
            <Alert variant="destructive" className="py-2">
              <AlertDescription className="text-xs font-semibold">
                {pinError}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handlePinSubmit} className="space-y-3 pt-1">
            <Input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pinStep === "new" ? newPin : confirmPin}
              onChange={(e) =>
                pinStep === "new"
                  ? setNewPin(e.target.value)
                  : setConfirmPin(e.target.value)
              }
              placeholder="••••••"
              className="w-full py-2 text-center text-2xl font-mono tracking-widest h-12"
              autoFocus
            />

            <div className="flex gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPinModalOpen(false)}
                className="flex-1 text-xs font-semibold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                style={{ backgroundColor: colorPreset.primaryHex }}
                className="flex-1 text-white text-xs font-bold transition hover:brightness-105"
              >
                {pinStep === "new" ? "Lanjut" : "Simpan PIN"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
