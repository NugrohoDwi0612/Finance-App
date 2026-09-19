import { getWalletsDB } from "./walletService";
import { getCategoriesDB } from "./categoryService";
import { getTransactionsDB } from "./transactionService";
import { getBudgetsDB } from "./budgetService";
import { getGoalsDB } from "./goalService";
import { getDebtsLoansDB } from "./debtService";
import { getRecurringBillsDB } from "./recurringService";
import { getSplitBillsDB } from "./splitBillService";

/**
 * Menjalankan penarikan seluruh data secara paralel (Promise.all)
 * Sangat cepat saat aplikasi dibuka setelah login
 */
export async function syncAllUserDataDB() {
  try {
    const [
      walletsRes,
      categoriesRes,
      transactions,
      budgets,
      goals,
      debtsLoans,
      recurringBills,
      splitBills,
    ] = await Promise.all([
      getWalletsDB(),
      getCategoriesDB(),
      getTransactionsDB(),
      getBudgetsDB(),
      getGoalsDB(),
      getDebtsLoansDB(),
      getRecurringBillsDB(),
      getSplitBillsDB(),
    ]);

    return {
      wallets: walletsRes.success ? walletsRes.data : [],
      categories: categoriesRes.success ? categoriesRes.data : [],
      transactions,
      budgets,
      goals,
      debtsLoans,
      recurringBills,
      splitBills,
    };
  } catch (err) {
    console.error("Gagal melakukan syncAllUserDataDB:", err);
    return null;
  }
}
