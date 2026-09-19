import { supabase } from "@/utils/supabase";
import { DebtLoan } from "@/types";

const mapFromDB = (row: any): DebtLoan => ({
  id: row.id,
  type: row.type,
  contactName: row.contact_name,
  contactPhone: row.contact_phone,
  totalAmount: Number(row.total_amount),
  paidAmount: Number(row.paid_amount || 0),
  dueDate: row.due_date,
  status: row.status,
  notes: row.notes,
  payments: row.payments || [],
  createdAt: row.created_at,
});

export async function getDebtsLoansDB(): Promise<DebtLoan[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("debts_loans")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapFromDB);
  } catch (err) {
    console.error("Error getDebtsLoansDB:", err);
    return [];
  }
}

export async function addDebtLoanDB(debt: DebtLoan): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from("debts_loans").insert({
      id: debt.id,
      user_id: user.id,
      type: debt.type,
      contact_name: debt.contactName,
      contact_phone: debt.contactPhone || null,
      total_amount: debt.totalAmount,
      paid_amount: debt.paidAmount,
      due_date: debt.dueDate,
      status: debt.status,
      notes: debt.notes || null,
      payments: debt.payments,
    });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error addDebtLoanDB:", err);
    return false;
  }
}

export async function updateDebtPaymentDB(
  id: string,
  paidAmount: number,
  status: string,
  payments: any[],
): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from("debts_loans")
      .update({
        paid_amount: paidAmount,
        status: status,
        payments: payments,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error updateDebtPaymentDB:", err);
    return false;
  }
}

export async function deleteDebtLoanDB(id: string): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from("debts_loans")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error deleteDebtLoanDB:", err);
    return false;
  }
}
