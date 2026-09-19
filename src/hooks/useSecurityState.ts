"use client";

import { useState, useEffect, useMemo } from "react";
import { UserProfile, ThemeMode, AccentColor, NavSettings } from "@/types";
import { COLOR_PRESETS, ColorPreset } from "@/utils/themePresets";
import { loadLocal } from "@/utils/localStorage";
import { supabase } from "@/utils/supabase";

export const defaultNavSettings: NavSettings = {
  transparency: 25,
  blurIntensity: "ultra",
  styleVariant: "floating",
  showLabels: false,
  showProfileAvatar: true,
};

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

export function useSecurityState() {
  const [user, setUser] = useState<UserProfile>(() => loadLocal("user", initialUserProfile));
  const [hideBalances, setHideBalances] = useState<boolean>(() => loadLocal("hideBalances", false));
  const [theme, setThemeState] = useState<ThemeMode>(() => loadLocal("theme", "light"));
  const [accentColor, setAccentColorState] = useState<AccentColor>(() => loadLocal("accentColor", "indigo"));
  const [navSettings, setNavSettings] = useState<NavSettings>(() => loadLocal("navSettings", defaultNavSettings));
  const [isLocked, setIsLocked] = useState<boolean>(() => {
    const u = loadLocal("user", initialUserProfile);
    return Boolean(u.pinEnabled && u.pinCode);
  });

  useEffect(() => { localStorage.setItem("catatuang_user", JSON.stringify(user)); }, [user]);
  useEffect(() => { localStorage.setItem("catatuang_hideBalances", JSON.stringify(hideBalances)); }, [hideBalances]);
  useEffect(() => { localStorage.setItem("catatuang_theme", JSON.stringify(theme)); }, [theme]);
  useEffect(() => { localStorage.setItem("catatuang_accentColor", JSON.stringify(accentColor)); }, [accentColor]);
  useEffect(() => { localStorage.setItem("catatuang_navSettings", JSON.stringify(navSettings)); }, [navSettings]);

  // Handle Theme
   useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (isDark: boolean) => {
      const targetColor = isDark ? "#09090b" : "#fafaf9";

      // 1. Ubah class CSS Tailwind & paksa warna latar paling belakang
      if (isDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      root.style.backgroundColor = targetColor;
      if (document.body) {
        document.body.style.backgroundColor = targetColor;
      }

      // 2. PAKSA UPDATE SEMUA META TAG THEME-COLOR DI BROWSER
      const metaTags = document.querySelectorAll('meta[name="theme-color"]');
      if (metaTags.length > 0) {
        metaTags.forEach((tag) => {
          tag.removeAttribute("media"); // HAPUS kuncian Dark Mode bawaan HP!
          tag.setAttribute("content", targetColor);
        });
      } else {
        const meta = document.createElement("meta");
        meta.name = "theme-color";
        meta.content = targetColor;
        document.head.appendChild(meta);
      }
    };

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      applyTheme(mediaQuery.matches);
      const listener = (e: MediaQueryListEvent) => applyTheme(e.matches);
      mediaQuery.addEventListener("change", listener);
      return () => mediaQuery.removeEventListener("change", listener);
    } else {
      applyTheme(theme === "dark");
    }
  }, [theme]);

  const colorPreset: ColorPreset = useMemo(() => {
    return COLOR_PRESETS.find((p) => p.id === accentColor) || COLOR_PRESETS[0];
  }, [accentColor]);

  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--accent-primary", colorPreset.primaryHex);
    root.style.setProperty("--accent-secondary", colorPreset.secondaryHex);
    root.setAttribute("data-accent", accentColor);
  }, [accentColor, colorPreset]);

  // Auth Actions
  const updateUserProfile = (profile: Partial<UserProfile>) => setUser((prev) => ({ ...prev, ...profile }));
  const loginUser = (email: string, name?: string) => {
    setUser((prev) => ({ ...prev, email, name: name || email.split("@")[0], isLoggedIn: true, isOnboarded: true }));
  };
  const registerUser = (data: { name: string; email: string; baseCurrency?: any; pinCode?: string }) => {
    setUser((prev) => ({ ...prev, name: data.name, email: data.email, baseCurrency: data.baseCurrency || "IDR", pinEnabled: Boolean(data.pinCode), pinCode: data.pinCode || "", isLoggedIn: true, isOnboarded: true }));
  };
  const completeOnboarding = (data: { name: string; email: string; baseCurrency?: any; pinCode?: string; initialBalance?: number }) => {
    setUser((prev) => ({ ...prev, name: data.name || prev.name, email: data.email || prev.email, baseCurrency: data.baseCurrency || prev.baseCurrency, pinEnabled: Boolean(data.pinCode), pinCode: data.pinCode || "", isLoggedIn: true, isOnboarded: true }));
  };

  const logoutUser = async () => {
    try { await supabase.auth.signOut(); } catch (err) {}
    localStorage.clear();
    setUser(initialUserProfile);
    setIsLocked(false);
  };

  const hashPin = async (rawPin: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(rawPin + "_catatuang_salt");
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, "0")).join("");
  };

  const setAppPin = async (pin: string) => {
    const hashed = await hashPin(pin);
    setUser((prev) => ({ ...prev, pinEnabled: true, pinCode: hashed }));
  };
  const removeAppPin = () => setUser((prev) => ({ ...prev, pinEnabled: false, pinCode: "" }));

  const unlockApp = (pin?: string) => {
    if (!user.pinEnabled) { setIsLocked(false); return true; }
    hashPin(pin || "").then((hashed) => {
      if (hashed === user.pinCode || pin === user.pinCode) { setIsLocked(false); return true; }
      return false;
    });
    return pin === user.pinCode;
  };
  const lockApp = () => { if (user.pinEnabled && user.pinCode) setIsLocked(true); };

  return {
    user, setUser, hideBalances, setHideBalances, theme, setTheme: setThemeState,
    accentColor, setAccentColor: setAccentColorState, colorPreset,
    navSettings, updateNavSettings: (s: Partial<NavSettings>) => setNavSettings(p => ({ ...p, ...s })),
    isLocked, setIsLocked, unlockApp, lockApp,
    updateUserProfile, loginUser, registerUser, completeOnboarding, logoutUser,
    setAppPin, removeAppPin,
  };
}