"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { Lock, Delete, Fingerprint, ScanFace } from "lucide-react";
import { toast } from "sonner";
import { authenticateWithBiometrics } from "@/utils/biometrics";

export const AppLockModal: React.FC = () => {
  const { isLocked, unlockApp, user } = useApp();
  const [pinInput, setPinInput] = useState("");

  // Otomatis buka popup FaceID / Sidik Jari jika biometrik aktif saat app dibuka
  useEffect(() => {
    if (isLocked && user.biometricsEnabled) {
      triggerBiometricUnlock();
    }
  }, [isLocked]);

  if (!isLocked) return null;

  const triggerBiometricUnlock = async () => {
    const success = await authenticateWithBiometrics();
    if (success) {
      unlockApp(user.pinCode); // Langsung buka kunci
      toast.success("Kunci aplikasi terbuka via Biometrik!");
    }
  };

  const handleKeyPress = (num: string) => {
    if (pinInput.length < 6) {
      const nextPin = pinInput + num;
      setPinInput(nextPin);
      if (nextPin.length === 6) {
        const success = unlockApp(nextPin);
        if (!success) {
          toast.error("PIN salah!");
          setPinInput("");
        }
      }
    }
  };

  const handleDelete = () => {
    setPinInput((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-white animate-fadeIn">
      <div className="w-14 h-14 rounded-3xl bg-teal-500/20 text-teal-400 flex items-center justify-center mb-3">
        <Lock size={28} />
      </div>
      <h2 className="text-xl font-black">Aplikasi Terkunci</h2>
      <p className="text-xs text-stone-400 mt-0.5 mb-6">
        Masukkan 6-digit PIN keamanan Anda
      </p>

      {/* Dots Indicator */}
      <div className="flex gap-3 mb-8">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className={`w-3.5 h-3.5 rounded-full border border-teal-500/40 transition-all ${
              i < pinInput.length
                ? "bg-teal-400 scale-110 shadow-xs shadow-teal-400"
                : "bg-transparent"
            }`}
          />
        ))}
      </div>

      {/* Numeric Keypad */}
      <div className="grid grid-cols-3 gap-3 w-64">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "bio", "0", "del"].map(
          (key, idx) => {
            if (key === "bio") {
              if (!user.biometricsEnabled) return <div key={idx} />;
              return (
                <button
                  key={idx}
                  onClick={triggerBiometricUnlock}
                  className="h-14 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center active:scale-90 transition"
                  title="Buka dengan Face ID / Sidik Jari"
                >
                  <Fingerprint size={24} />
                </button>
              );
            }
            if (key === "del") {
              return (
                <button
                  key={idx}
                  onClick={handleDelete}
                  className="h-14 rounded-2xl bg-stone-800/70 flex items-center justify-center text-stone-300 active:scale-90 transition"
                >
                  <Delete size={20} />
                </button>
              );
            }
            return (
              <button
                key={idx}
                onClick={() => handleKeyPress(key)}
                className="h-14 rounded-2xl bg-stone-800/70 text-lg font-bold hover:bg-stone-800 active:scale-90 transition"
              >
                {key}
              </button>
            );
          },
        )}
      </div>
    </div>
  );
};
