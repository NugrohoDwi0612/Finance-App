import { supabase } from "@/utils/supabase";
import { Goal } from "@/types";

// Mapper konversi kolom database snake_case ke camelCase
const mapFromDB = (row: any): Goal => ({
  id: row.id,
  title: row.title,
  targetAmount: Number(row.target_amount),
  currentAmount: Number(row.current_amount || 0),
  targetDate: row.target_date,
  walletId: row.wallet_id,
  iconName: row.icon_name || "Target",
  color: row.color || "#0d9488",
  notes: row.notes,
});

/**
 * Mengambil semua target celengan impian milik pengguna
 */
export async function getGoalsDB(): Promise<Goal[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id);

    if (error) throw error;
    return (data || []).map(mapFromDB);
  } catch (err) {
    console.error("Error getGoalsDB:", err);
    return [];
  }
}

/**
 * Menambahkan Target Celengan Impian Baru
 */
export async function addGoalDB(goal: Goal): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from("goals").insert({
      id: goal.id,
      user_id: user.id,
      title: goal.title,
      target_amount: goal.targetAmount,
      current_amount: goal.currentAmount,
      target_date: goal.targetDate,
      wallet_id: goal.walletId || null,
      icon_name: goal.iconName,
      color: goal.color,
      notes: goal.notes || null,
    });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error addGoalDB:", err);
    return false;
  }
}

/**
 * Mengedit Data Target Celengan (Nama, Tanggal Deadline, Target Nominal)
 */
export async function editGoalDB(id: string, updates: Partial<Goal>): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.targetAmount !== undefined) payload.target_amount = updates.targetAmount;
    if (updates.currentAmount !== undefined) payload.current_amount = updates.currentAmount;
    if (updates.targetDate !== undefined) payload.target_date = updates.targetDate;
    if (updates.walletId !== undefined) payload.wallet_id = updates.walletId;
    if (updates.iconName !== undefined) payload.icon_name = updates.iconName;
    if (updates.color !== undefined) payload.color = updates.color;
    if (updates.notes !== undefined) payload.notes = updates.notes;

    const { error } = await supabase
      .from("goals")
      .update(payload)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error editGoalDB:", err);
    return false;
  }
}

/**
 * Memperbarui Jumlah Saldo Celengan saat Setor Tabungan
 */
export async function updateGoalAmountDB(
  id: string,
  currentAmount: number
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from("goals")
      .update({ current_amount: currentAmount })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error updateGoalAmountDB:", err);
    return false;
  }
}

/**
 * Menghapus Target Celengan dari Database
 */
export async function deleteGoalDB(id: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error deleteGoalDB:", err);
    return false;
  }
}