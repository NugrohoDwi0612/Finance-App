import { supabase } from "@/utils/supabase";
import { SplitBill } from "@/types";

const mapFromDB = (row: any): SplitBill => ({
  id: row.id,
  title: row.title,
  date: row.date,
  taxPercentage: Number(row.tax_percentage || 0),
  servicePercentage: Number(row.service_percentage || 0),
  people: row.people || [],
  bankAccountInfo: row.bank_account_info,
  totalBill: Number(row.total_bill || 0),
});

export async function getSplitBillsDB(): Promise<SplitBill[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("split_bills")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapFromDB);
  } catch (err) {
    console.error("Error getSplitBillsDB:", err);
    return [];
  }
}

export async function addSplitBillDB(bill: SplitBill): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from("split_bills").insert({
      id: bill.id,
      user_id: user.id,
      title: bill.title,
      date: bill.date,
      tax_percentage: bill.taxPercentage,
      service_percentage: bill.servicePercentage,
      people: bill.people,
      bank_account_info: bill.bankAccountInfo || null,
      total_bill: bill.totalBill,
    });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error addSplitBillDB:", err);
    return false;
  }
}

export async function deleteSplitBillDB(id: string): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from("split_bills")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error deleteSplitBillDB:", err);
    return false;
  }
}
