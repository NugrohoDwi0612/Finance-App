export type TransactionType = "expense" | "income" | "transfer";

export type WalletCategory = "cash" | "bank" | "ewallet" | "investment";

export interface Wallet {
  id: string;
  name: string;
  category: WalletCategory;
  balance: number;
  color: string;
  iconName: string;
  accountNumber?: string;
  institution?: string; // e.g. "BCA", "GoPay", "Bibit"
}

export interface Category {
  id: string;
  name: string;
  type: "expense" | "income";
  iconName: string;
  color: string;
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  categoryId?: string; // for expense / income
  walletId: string; // source wallet (or target for income)
  toWalletId?: string; // target wallet for transfer
  date: string; // ISO string YYYY-MM-DDTHH:mm
  description: string;
  receiptImage?: string; // base64 or URL
  tags?: string[];
  createdAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  monthlyLimit: number;
  period: string; // YYYY-MM
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  walletId?: string;
  iconName: string;
  color: string;
  notes?: string;
}

export type DebtType = "debt" | "loan"; // debt = Hutang Saya, loan = Piutang Teman
export type DebtStatus = "unpaid" | "partial" | "paid";

export interface DebtPayment {
  id: string;
  amount: number;
  date: string;
  walletId?: string;
  note?: string;
}

export interface DebtLoan {
  id: string;
  type: DebtType;
  contactName: string;
  contactPhone?: string;
  totalAmount: number;
  paidAmount: number;
  dueDate: string; // YYYY-MM-DD
  status: DebtStatus;
  notes?: string;
  payments: DebtPayment[];
  createdAt: string;
}

export type RecurringFrequency = "daily" | "weekly" | "monthly" | "yearly";

export interface RecurringBill {
  id: string;
  title: string;
  amount: number;
  categoryId: string;
  walletId: string;
  frequency: RecurringFrequency;
  dueDay: number; // e.g. 15th of the month
  nextDueDate: string; // YYYY-MM-DD
  isActive: boolean;
  notes?: string;
}

export interface SplitBillPerson {
  id: string;
  name: string;
  items: { name: string; price: number }[];
  subtotal: number;
  taxAmount: number;
  serviceAmount: number;
  total: number;
  isPaid: boolean;
}

export interface SplitBill {
  id: string;
  title: string;
  date: string;
  taxPercentage: number; // PB1 e.g. 10%
  servicePercentage: number; // Service charge e.g. 5%
  people: SplitBillPerson[];
  bankAccountInfo?: string;
  totalBill: number;
}

export type CurrencyCode = "IDR" | "USD" | "SGD" | "EUR" | "JPY";
export type ThemeMode = "light" | "dark" | "system";
export type AccentColor =
  | "indigo"
  | "violet"
  | "emerald"
  | "teal"
  | "rose"
  | "amber"
  | "monochrome";

export type TabType =
  | "dashboard"
  | "transactions"
  | "budgets"
  | "analytics"
  | "more"
  | "wallets"
  | "categories"
  | "debts"
  | "recurring"
  | "smart"
  | "profile"
  | "export-ai";

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
  baseCurrency: CurrencyCode;
  pinEnabled: boolean;
  pinCode: string;
  biometricsEnabled: boolean;
  isLoggedIn: boolean;
  isOnboarded?: boolean;
  lastLoginDate?: string;
  streakDays: number;
  lastRecordDate?: string;
}

export interface CurrencyRate {
  code: string;
  name: string;
  symbol: string;
  rateToIDR: number; // e.g. 1 USD = 15800 IDR
}

export interface QuickTemplate {
  id: string;
  name: string;
  amount: number;
  categoryId: string;
  walletId: string;
  type: TransactionType;
  iconName?: string;
}

export interface NavSettings {
  transparency: number; // 0 = ultra transparan/kaca tembus, 100 = pekat/solid
  blurIntensity: "none" | "light" | "medium" | "ultra";
  styleVariant: "floating" | "docked";
  showLabels: boolean;
  showProfileAvatar: boolean;
}
