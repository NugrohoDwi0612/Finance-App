"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/utils/supabase";
import { syncAllUserDataDB } from "@/services/syncService";
import { UserProfile, Transaction } from "@/types";

interface UseSupabaseRealtimeProps {
  user: UserProfile;
  setWallets: Function;
  setCategories: Function;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
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
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Abaikan tamu demo atau jika belum login
    if (!user.isLoggedIn || user.email === "guest@catatuang.app") return;

    const handleRemoteChange = async (payload: any) => {
      if (payload.errors) return;

      // 1. Batalkan antrean sinkronisasi sebelumnya jika ada event beruntun (Debounce)
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // 2. Beri jeda 1 detik agar Supabase benar-benar selesai menyimpan data ke database
      timerRef.current = setTimeout(async () => {
        const data = await syncAllUserDataDB();
        if (data) {
          setWallets(data.wallets || []);
          setCategories(data.categories || []);
          setBudgets(data.budgets || []);
          setGoals(data.goals || []);
          setDebtsLoans(data.debtsLoans || []);
          setRecurringBills(data.recurringBills || []);
          setSplitBills(data.splitBills || []);

          // =====================================================================
          // 3. KUNCI PERBAIKAN: SMART MERGE (Mencegah Transaksi Baru Hilang!)
          // =====================================================================
          setTransactions((prev) => {
            const incoming = data.transactions || [];
            const incomingIds = new Set(incoming.map((t) => t.id));

            // Pertahankan transaksi yang baru dicatat di HP dalam 15 detik terakhir
            // agar tidak terhapus jika koneksi Supabase sedikit terlambat merespon
            const recentLocals = prev.filter((localTx) => {
              const txTime = new Date(localTx.createdAt || Date.now()).getTime();
              const isRecent = Date.now() - txTime < 15000; // 15 detik
              return isRecent && !incomingIds.has(localTx.id);
            });

            return [...recentLocals, ...incoming];
          });
        }
      }, 1000); // Jeda 1 detik yang aman
    };

    const channelName = `user_data_sync_${user.email}`;

    // Membuka koneksi WebSockets ke Supabase
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        handleRemoteChange
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallets" },
        handleRemoteChange
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        handleRemoteChange
      )
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
      if (timerRef.current) clearTimeout(timerRef.current);
      supabase.removeChannel(channel);
    };
  }, [user.isLoggedIn, user.email]);
}
