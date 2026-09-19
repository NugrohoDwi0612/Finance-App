import { supabase } from "@/utils/supabase";
import { Budget } from "@/types";

const mapFromDB = (row: any): Budget => ({
  id: row.id,
  categoryId: row.category_id,
  monthlyLimit: Number(row.monthly_limit),
  period: row.period,
});

export async function getBudgetsDB(): Promise<Budget[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", user.id);

    if (error) throw error;
    return (data || []).map(mapFromDB);
  } catch (err) {
    console.error("Error getBudgetsDB:", err);
    return [];
  }
}

// 1. QUERY KHUSUS MENAMBAH ANGGARAN BARU (MURNI INSERT)
export async function addBudgetDB(budget: Budget): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from("budgets").insert({
      id: budget.id,
      user_id: user.id,
      category_id: budget.categoryId,
      monthly_limit: budget.monthlyLimit,
      period: budget.period,
    });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error addBudgetDB:", err);
    return false;
  }
}

// 2. QUERY KHUSUS MENGEDIT ANGGARAN (MURNI UPDATE PADA ID LAMA)
export async function editBudgetDB(id: string, limit: number): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from("budgets")
      .update({ monthly_limit: limit })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error editBudgetDB:", err);
    return false;
  }
}

// 3. QUERY KHUSUS MENGHAPUS ANGGARAN (DELETE)
export async function deleteBudgetDB(id: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from("budgets")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error deleteBudgetDB:", err);
    return false;
  }
}