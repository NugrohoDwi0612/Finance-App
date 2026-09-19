import { supabase } from "@/utils/supabase";
import { RecurringBill } from "@/types";

const mapFromDB = (row: any): RecurringBill => ({
  id: row.id,
  title: row.title,
  amount: Number(row.amount),
  categoryId: row.category_id,
  walletId: row.wallet_id,
  frequency: row.frequency,
  dueDay: Number(row.due_day),
  nextDueDate: row.next_due_date,
  isActive: Boolean(row.is_active),
  notes: row.notes,
});

export async function getRecurringBillsDB(): Promise<RecurringBill[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("recurring_bills")
      .select("*")
      .eq("user_id", user.id);

    if (error) throw error;
    return (data || []).map(mapFromDB);
  } catch (err) {
    console.error("Error getRecurringBillsDB:", err);
    return [];
  }
}

export async function addRecurringBillDB(
  bill: RecurringBill,
): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from("recurring_bills").insert({
      id: bill.id,
      user_id: user.id,
      title: bill.title,
      amount: bill.amount,
      category_id: bill.categoryId,
      wallet_id: bill.walletId,
      frequency: bill.frequency,
      due_day: bill.dueDay,
      next_due_date: bill.nextDueDate,
      is_active: bill.isActive,
      notes: bill.notes || null,
    });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error addRecurringBillDB:", err);
    return false;
  }
}

export async function updateRecurringDueDateDB(
  id: string,
  nextDueDate: string,
): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from("recurring_bills")
      .update({ next_due_date: nextDueDate })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error updateRecurringDueDateDB:", err);
    return false;
  }
}

export async function deleteRecurringBillDB(id: string): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from("recurring_bills")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error deleteRecurringBillDB:", err);
    return false;
  }
}
