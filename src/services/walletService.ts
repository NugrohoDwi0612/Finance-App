import { supabase } from "@/utils/supabase";
import { Wallet } from "@/types";

// Helper mapper: Mengubah format snake_case Supabase ke camelCase TypeScript
const mapFromDB = (row: any): Wallet => ({
  id: row.id,
  name: row.name,
  category: row.category,
  balance: Number(row.balance),
  color: row.color,
  iconName: row.icon_name || "CreditCard",
  accountNumber: row.account_number || "",
  institution: row.institution || "",
});

/**
 * 1. Mengambil Semua Dompet Milik User yang Sedang Login
 */
export async function getWalletsDB(): Promise<{
  success: boolean;
  data: Wallet[];
  error: string | null;
}> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return {
        success: false,
        data: [],
        error: "Pengguna belum terotentikasi.",
      };

    const { data, error } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return {
      success: true,
      data: (data || []).map(mapFromDB),
      error: null,
    };
  } catch (err: any) {
    console.warn(
      "Gagal fetch wallets dari DB (menggunakan cache lokal):",
      err.message,
    );
    return { success: false, data: [], error: err.message };
  }
}

/**
 * 2. Menambah Dompet Baru ke Database
 */
export async function addWalletDB(
  wallet: Wallet 
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Silakan login terlebih dahulu." };

    const { error } = await supabase.from("wallets").insert({
      id: wallet.id, 
      user_id: user.id,
      name: wallet.name,
      category: wallet.category,
      balance: wallet.balance,
      color: wallet.color,
      icon_name: wallet.iconName,
      institution: wallet.institution || null,
      account_number: wallet.accountNumber || null,
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    console.error("Gagal addWalletDB:", err);
    return { success: false, error: err.message };
  }
}

/**
 * 3. Memperbarui Data Dompet (Edit)
 */
export async function editWalletDB(
  id: string,
  updates: Partial<Wallet>
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Silakan login terlebih dahulu." };

    const updatePayload: any = {};
    if (updates.name !== undefined) updatePayload.name = updates.name;
    if (updates.category !== undefined) updatePayload.category = updates.category;
    if (updates.balance !== undefined) updatePayload.balance = updates.balance;
    if (updates.color !== undefined) updatePayload.color = updates.color;
    if (updates.iconName !== undefined) updatePayload.icon_name = updates.iconName;
    if (updates.institution !== undefined) updatePayload.institution = updates.institution;
    if (updates.accountNumber !== undefined) updatePayload.account_number = updates.accountNumber;

    // Eksekusi update langsung berdasarkan ID
    const { data, error } = await supabase
      .from("wallets")
      .update(updatePayload)
      .eq("id", id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      console.warn("Peringatan: Dompet tidak ditemukan atau bukan milik akun Anda.");
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error("Gagal editWalletDB:", err);
    return { success: false, error: err.message || "Gagal memperbarui data dompet di server." };
  }
}

/**
 * 4. Menyesuaikan Saldo Riil (Reconcile)
 */
export async function reconcileWalletBalanceDB(
  id: string,
  newBalance: number
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Silakan login terlebih dahulu." };

    const { data, error } = await supabase
      .from("wallets")
      .update({ balance: newBalance })
      .eq("id", id)
      .select();

    if (error) throw error;

    if (!data || data.length === 0) {
      console.warn("Peringatan: Baris saldo tidak terupdate di server.");
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error("Gagal reconcileWalletBalanceDB:", err);
    return { success: false, error: err.message || "Gagal menyesuaikan saldo di server." };
  }
}

/**
 * 5. Menghapus Dompet dari Database
 */
export async function deleteWalletDB(
  id: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return { success: false, error: "Silakan login terlebih dahulu." };

    const { error } = await supabase
      .from("wallets")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return { success: true, error: null };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal menghapus dompet dari database.",
    };
  }
}
