import { supabase } from "@/utils/supabase";
import { Transaction } from "@/types";

const mapFromDB = (row: any): Transaction => ({
  id: row.id,
  type: row.type,
  amount: Number(row.amount),
  categoryId: row.category_id,
  walletId: row.wallet_id,
  toWalletId: row.to_wallet_id,
  date: row.date,
  description: row.description || "",
  receiptImage: row.receipt_image,
  createdAt: row.created_at,
});

export async function getTransactionsDB(): Promise<Transaction[]> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapFromDB);
  } catch (err) {
    console.error("Error getTransactionsDB:", err);
    return [];
  }
}

export async function addTransactionDB(tx: Transaction): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase.from("transactions").insert({
      id: tx.id,
      user_id: user.id,
      type: tx.type,
      amount: tx.amount,
      category_id: tx.categoryId || null,
      wallet_id: tx.walletId,
      to_wallet_id: tx.toWalletId || null,
      date: tx.date,
      description: tx.description,
      receipt_image: tx.receiptImage || null,
    });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error addTransactionDB:", err);
    return false;
  }
}

export async function deleteTransactionDB(id: string): Promise<boolean> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error deleteTransactionDB:", err);
    return false;
  }
}
