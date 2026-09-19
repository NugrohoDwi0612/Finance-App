"use client";

import { useState, useEffect } from "react";
import { Wallet, Category, UserProfile } from "@/types";
import { loadLocal } from "@/utils/localStorage";
import { addWalletDB, editWalletDB, deleteWalletDB, reconcileWalletBalanceDB } from "@/services/walletService";
import { addCategoryDB, editCategoryDB, deleteCategoryDB } from "@/services/categoryService";

export function useWalletCategoryState(user: UserProfile) {
  const [wallets, setWallets] = useState<Wallet[]>(() => loadLocal("wallets", []));
  const [categories, setCategories] = useState<Category[]>(() => loadLocal("categories", []));

  useEffect(() => { localStorage.setItem("catatuang_wallets", JSON.stringify(wallets)); }, [wallets]);
  useEffect(() => { localStorage.setItem("catatuang_categories", JSON.stringify(categories)); }, [categories]);

  // Wallet Actions
  const addWallet = async (walletData: Omit<Wallet, "id">) => {
    const id = `w-${Date.now()}`;
    const newWallet: Wallet = { ...walletData, id };
    setWallets((prev) => [...prev, newWallet]);

    if (user.isLoggedIn && user.email !== "guest@catatuang.app") {
      const res = await addWalletDB(newWallet); 
      if (!res.success) {
        setWallets((prev) => prev.filter((w) => w.id !== id));
        throw new Error(res.error || "Gagal menyimpan dompet ke cloud");
      }
    }
  };

  const editWallet = async (id: string, updated: Partial<Wallet>) => {
    setWallets((prev) => prev.map((w) => (w.id === id ? { ...w, ...updated } : w)));
    if (user.isLoggedIn && user.email !== "guest@catatuang.app") await editWalletDB(id, updated);
  };

 const deleteWallet = async (id: string) => {
    setWallets((prev) => prev.filter((w) => w.id !== id));

    if (user.isLoggedIn && user.email !== "guest@catatuang.app") {
      const res = await deleteWalletDB(id);
      if (!res.success) {
        console.error("Gagal menghapus dompet di cloud:", res.error);
      }
    }
  };

  const reconcileWalletBalance = async (id: string, newBalance: number) => {
    setWallets((prev) => prev.map((w) => (w.id === id ? { ...w, balance: newBalance } : w)));
    if (user.isLoggedIn && user.email !== "guest@catatuang.app") await reconcileWalletBalanceDB(id, newBalance);
  };

  // Category Actions
 const addCategory = async (categoryData: Omit<Category, "id">) => {
    const id = `cat-${Date.now()}`;
    const newCat: Category = { ...categoryData, id };
    setCategories((prev) => [...prev, newCat]);

    if (user.isLoggedIn && user.email !== "guest@catatuang.app") {
      const res = await addCategoryDB(newCat); // <-- Kirim newCat dengan ID yang sama
      if (!res.success) {
        setCategories((prev) => prev.filter((c) => c.id !== id));
        throw new Error(res.error || "Gagal menyimpan kategori ke cloud");
      }
    }
  };

  const editCategory = async (id: string, updated: Partial<Category>) => {
    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updated } : c)));
    if (user.isLoggedIn && user.email !== "guest@catatuang.app") await editCategoryDB(id, updated);
  };

 const deleteCategory = async (id: string) => {
    // 1. Hapus dari tampilan lokal seketika
    setCategories((prev) => prev.filter((c) => c.id !== id));

    // 2. Hapus dari Supabase secara pasti
    if (user.isLoggedIn && user.email !== "guest@catatuang.app") {
      const res = await deleteCategoryDB(id);
      if (!res.success) {
        console.error("Gagal menghapus kategori di cloud:", res.error);
      }
    }
  };
  return {
    wallets, setWallets, addWallet, editWallet, deleteWallet, reconcileWalletBalance,
    categories, setCategories, addCategory, editCategory, deleteCategory,
  };
}