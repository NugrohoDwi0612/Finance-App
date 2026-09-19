"use client";

import { useEffect } from "react";
import { supabase } from "@/utils/supabase";
import { syncAllUserDataDB } from "@/services/syncService";
import { UserProfile } from "@/types";

interface UseSupabaseRealtimeProps {
  user: UserProfile;
  setWallets: Function;
  setCategories: Function;
  setTransactions: Function;
  setBudgets: Function;
  setGoals: Function;
  setDebtsLoans: Function;
  setRecurringBills: Function;
  setSplitBills: Function;
}

export function useSupabaseRealtime({
  user,
  setWallets,
  setCategories,
  setTransactions,
  setBudgets,
  setGoals,
  setDebtsLoans,
  setRecurringBills,
  setSplitBills,
}: UseSupabaseRealtimeProps) {
  useEffect(() => {
    // Abaikan tamu demo atau jika belum login
    if (!user.isLoggedIn || user.email === "guest@catatuang.app") return;

    let isSyncing = false;

    // Fungsi debounce sederhana: mencegah penarikan data beruntun jika 1 aksi memicu banyak tabel
    const handleRemoteChange = async (payload: any) => {
      // Abaikan jika payload error
      if (payload.errors) return;

      if (!isSyncing) {
        isSyncing = true;
        
        // Sengaja diberi jeda 300ms agar database Supabase selesai memproses transaksi
        setTimeout(async () => {
          const data = await syncAllUserDataDB();
          if (data) {
            setWallets(data.wallets || []);
            setCategories(data.categories || []);
            setTransactions(data.transactions || []);
            setBudgets(data.budgets || []);
            setGoals(data.goals || []);
            setDebtsLoans(data.debtsLoans || []);
            setRecurringBills(data.recurringBills || []);
            setSplitBills(data.splitBills || []);
          }
          isSyncing = false;
        }, 300);
      }
    };

    // Saluran komunikasi khusus untuk pengguna ini (berdasarkan UID)
    const channelName = `user_data_sync_${user.email}`;

    // Membuka koneksi WebSockets ke Supabase
    const channel = supabase
      .channel(channelName)
      // MENDENGARKAN EVENT TRANSAKSI
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        handleRemoteChange
      )
      // MENDENGARKAN EVENT DOMPET
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallets" },
        handleRemoteChange
      )
      // MENDENGARKAN EVENT KATEGORI
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        handleRemoteChange
      )
      // MENDENGARKAN EVENT GOALS & BUDGETS
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "goals" },
        handleRemoteChange
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "budgets" },
        handleRemoteChange
      )
      // MENDENGARKAN EVENT HUTANG & TAGIHAN
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "debts_loans" },
        handleRemoteChange
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`🟢 Realtime Active: Listening for changes on ${user.email}`);
        } else if (status === "CLOSED") {
          console.log(`🔴 Realtime Disconnected.`);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.isLoggedIn, user.email]); 
}