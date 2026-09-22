import { Transaction, Category, Wallet, CurrencyCode } from "@/types";
import { formatRupiah, formatDateID } from "./formatters";

export interface ExportOptions {
  fileName?: string;
  currency?: CurrencyCode;
  userName?: string;
  userEmail?: string;
  format?: "csv" | "excel"; // Pilihan format: .csv atau .xls (berwarna)
  delimiter?: "," | ";";
}

/**
 * Helper pembersih karakter khusus CSV
 */
const escapeCSV = (
  str: string | number | undefined | null,
  delimiter = ";",
) => {
  if (str === undefined || str === null) return '""';
  const s = String(str).replace(/"/g, '""');
  return `"${s}"`;
};

/**
 * 1. GENERATOR CSV BERSTANDAR INTERNASIONAL (UTF-8 BOM)
 */
function downloadCSV(
  transactions: Transaction[],
  categories: Category[],
  wallets: Wallet[],
  options: ExportOptions,
) {
  const currency = options.currency || "IDR";
  const delimiter = options.delimiter || ";";
  const fileName =
    options.fileName ||
    `CatatUang_Transaksi_${new Date().toISOString().slice(0, 10)}.csv`;

  const BOM = "\uFEFF"; // Mencegah karakter rusak di Microsoft Excel

  // Kalkulasi Total
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  const netCashflow = totalIncome - totalExpense;

  // Header Ringkasan Eksekutif di Atas CSV
  const metaHeader = [
    [escapeCSV("LAPORAN ARUS KAS KEUANGAN — CATATUANG", delimiter)].join(
      delimiter,
    ),
    [
      escapeCSV("Nama Pengguna:", delimiter),
      escapeCSV(options.userName || "Pengguna", delimiter),
    ].join(delimiter),
    [
      escapeCSV("Tanggal Ekspor:", delimiter),
      escapeCSV(new Date().toLocaleString("id-ID"), delimiter),
    ].join(delimiter),
    [
      escapeCSV("Total Pemasukan:", delimiter),
      escapeCSV(formatRupiah(totalIncome, false, currency), delimiter),
    ].join(delimiter),
    [
      escapeCSV("Total Pengeluaran:", delimiter),
      escapeCSV(formatRupiah(totalExpense, false, currency), delimiter),
    ].join(delimiter),
    [
      escapeCSV("Arus Kas Bersih:", delimiter),
      escapeCSV(formatRupiah(netCashflow, false, currency), delimiter),
    ].join(delimiter),
    [""].join(delimiter), // Baris kosong pemisah
  ].join("\r\n");

  const tableHeaders = [
    "No",
    "Tanggal",
    "Jam",
    "Jenis Alur",
    "Kategori",
    "Dompet Sumber",
    "Dompet Tujuan",
    "Deskripsi / Catatan",
    "Nominal Angka",
    "Nominal Terformat",
  ];

  const rows = transactions.map((tx, idx) => {
    const cat = categories.find((c) => c.id === tx.categoryId);
    const sourceWallet = wallets.find((w) => w.id === tx.walletId);
    const destWallet = tx.toWalletId
      ? wallets.find((w) => w.id === tx.toWalletId)
      : null;

    const [datePart, timePart] = tx.date.split("T");

    const typeLabel =
      tx.type === "income"
        ? "Pemasukan"
        : tx.type === "expense"
          ? "Pengeluaran"
          : "Transfer Antar Rekening";

    return [
      escapeCSV(idx + 1, delimiter),
      escapeCSV(formatDateID(datePart, { short: true }), delimiter),
      escapeCSV(timePart || "00:00", delimiter),
      escapeCSV(typeLabel, delimiter),
      escapeCSV(
        cat?.name || (tx.type === "transfer" ? "Transfer" : "Umum"),
        delimiter,
      ),
      escapeCSV(sourceWallet?.name || "-", delimiter),
      escapeCSV(destWallet?.name || "-", delimiter),
      escapeCSV(tx.description, delimiter),
      escapeCSV(tx.amount, delimiter),
      escapeCSV(formatRupiah(tx.amount, false, currency), delimiter),
    ].join(delimiter);
  });

  const csvContent =
    BOM +
    metaHeader +
    "\r\n" +
    tableHeaders.join(delimiter) +
    "\r\n" +
    rows.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  triggerDownload(blob, fileName);
}

/**
 * 2. GENERATOR EXCEL LAPORAN BERWARNA (.XLS DENGAN INLINE STYLES)
 */
function downloadStyledExcel(
  transactions: Transaction[],
  categories: Category[],
  wallets: Wallet[],
  options: ExportOptions,
) {
  const currency = options.currency || "IDR";
  const fileName =
    options.fileName ||
    `CatatUang_Laporan_${new Date().toISOString().slice(0, 10)}.xls`;

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => acc + t.amount, 0);

  const netCashflow = totalIncome - totalExpense;

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <!--[if gte mso 9]>
      <xml>
        <x:ExcelWorkbook>
          <x:ExcelWorksheets>
            <x:ExcelWorksheet>
              <x:Name>Laporan CatatUang</x:Name>
              <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
            </x:ExcelWorksheet>
          </x:ExcelWorksheets>
        </x:ExcelWorkbook>
      </xml>
      <![endif]-->
      <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
    </head>
    <body style="font-family: Calibri, 'Segoe UI', Arial, sans-serif; background-color: #ffffff;">
      <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; width: 1080px;">
        <colgroup>
          <col width="45" style="width: 45px;">
          <col width="110" style="width: 110px;">
          <col width="75" style="width: 75px;">
          <col width="130" style="width: 130px;">
          <col width="160" style="width: 160px;">
          <col width="170" style="width: 170px;">
          <col width="240" style="width: 240px;">
          <col width="150" style="width: 150px;">
        </colgroup>

        <!-- KOP LAPORAN -->
        <tr style="height: 45px;">
          <td colspan="8" style="background-color: #042f2e; color: #ffffff; font-size: 15pt; font-weight: bold; text-align: center; vertical-align: middle; border: 1pt solid #042f2e;">
            LAPORAN ARUS KAS KEUANGAN — CATATUANG
          </td>
        </tr>

        <tr style="height: 10px;"><td colspan="8"></td></tr>

        <!-- METADATA -->
        <tr style="height: 24px;">
          <td style="font-weight: bold; color: #475569; font-size: 9.5pt; padding-left: 6px; border: 0.5pt solid #cbd5e1; background-color: #f1f5f9;">User:</td>
          <td colspan="3" style="font-size: 9.5pt; padding-left: 6px; border: 0.5pt solid #cbd5e1; background-color: #ffffff; font-weight: bold; color: #0f172a;">
            ${options.userName || "Pengguna"} ${options.userEmail ? `(${options.userEmail})` : ""}
          </td>
          <td style="font-weight: bold; color: #475569; font-size: 9.5pt; padding-left: 6px; border: 0.5pt solid #cbd5e1; background-color: #f1f5f9;">Tgl Cetak:</td>
          <td colspan="3" style="font-size: 9.5pt; padding-left: 6px; border: 0.5pt solid #cbd5e1; background-color: #ffffff; color: #334155;">
            ${new Date().toLocaleString("id-ID")}
          </td>
        </tr>

        <tr style="height: 10px;"><td colspan="8"></td></tr>

        <!-- KARTU RINGKASAN FINANSIAL (BENTO KPIS) -->
        <tr style="height: 20px;">
          <td colspan="3" style="background-color: #f0fdf4; color: #166534; font-size: 9pt; font-weight: bold; text-align: center; border: 1pt solid #bbf7d0;">TOTAL PEMASUKAN</td>
          <td colspan="2" style="background-color: #fef2f2; color: #991b1b; font-size: 9pt; font-weight: bold; text-align: center; border: 1pt solid #fecaca;">TOTAL PENGELUARAN</td>
          <td colspan="3" style="background-color: #eff6ff; color: #1e40af; font-size: 9pt; font-weight: bold; text-align: center; border: 1pt solid #bfdbfe;">ARUS KAS BERSIH</td>
        </tr>
        <tr style="height: 35px;">
          <td colspan="3" style="background-color: #dcfce7; color: #15803d; font-size: 13pt; font-weight: bold; text-align: center; vertical-align: middle; border: 1pt solid #bbf7d0;">
            ${formatRupiah(totalIncome, false, currency)}
          </td>
          <td colspan="2" style="background-color: #fee2e2; color: #b91c1c; font-size: 13pt; font-weight: bold; text-align: center; vertical-align: middle; border: 1pt solid #fecaca;">
            ${formatRupiah(totalExpense, false, currency)}
          </td>
          <td colspan="3" style="background-color: #dbeafe; color: #1d4ed8; font-size: 13pt; font-weight: bold; text-align: center; vertical-align: middle; border: 1pt solid #bfdbfe;">
            ${formatRupiah(netCashflow, false, currency)}
          </td>
        </tr>

        <tr style="height: 15px;"><td colspan="8"></td></tr>

        <!-- HEADER TABEL TRANSAKSI -->
        <tr style="height: 30px;">
          <th style="background-color: #0f766e; color: #ffffff; font-size: 10pt; font-weight: bold; text-align: center; vertical-align: middle; border: 1pt solid #0d9488;">No</th>
          <th style="background-color: #0f766e; color: #ffffff; font-size: 10pt; font-weight: bold; text-align: center; vertical-align: middle; border: 1pt solid #0d9488;">Tanggal</th>
          <th style="background-color: #0f766e; color: #ffffff; font-size: 10pt; font-weight: bold; text-align: center; vertical-align: middle; border: 1pt solid #0d9488;">Jam</th>
          <th style="background-color: #0f766e; color: #ffffff; font-size: 10pt; font-weight: bold; text-align: center; vertical-align: middle; border: 1pt solid #0d9488;">Jenis Alur</th>
          <th style="background-color: #0f766e; color: #ffffff; font-size: 10pt; font-weight: bold; text-align: center; vertical-align: middle; border: 1pt solid #0d9488;">Kategori</th>
          <th style="background-color: #0f766e; color: #ffffff; font-size: 10pt; font-weight: bold; text-align: center; vertical-align: middle; border: 1pt solid #0d9488;">Dompet</th>
          <th style="background-color: #0f766e; color: #ffffff; font-size: 10pt; font-weight: bold; text-align: left; padding-left: 8px; vertical-align: middle; border: 1pt solid #0d9488;">Deskripsi</th>
          <th style="background-color: #0f766e; color: #ffffff; font-size: 10pt; font-weight: bold; text-align: right; padding-right: 8px; vertical-align: middle; border: 1pt solid #0d9488;">Nominal (${currency})</th>
        </tr>

        <!-- DATA TRANSAKSI -->
        ${transactions
          .map((tx, idx) => {
            const cat = categories.find((c) => c.id === tx.categoryId);
            const sourceWallet = wallets.find((w) => w.id === tx.walletId);
            const destWallet = tx.toWalletId
              ? wallets.find((w) => w.id === tx.toWalletId)
              : null;
            const [datePart, timePart] = tx.date.split("T");

            const rowBg = idx % 2 === 0 ? "#ffffff" : "#f8fafc";

            let typeBadgeBg = "#fef2f2";
            let typeBadgeColor = "#b91c1c";
            let typeLabel = "Pengeluaran";
            let amtColor = "#b91c1c";

            if (tx.type === "income") {
              typeBadgeBg = "#f0fdf4";
              typeBadgeColor = "#15803d";
              typeLabel = "Pemasukan";
              amtColor = "#15803d";
            } else if (tx.type === "transfer") {
              typeBadgeBg = "#f5f3ff";
              typeBadgeColor = "#6d28d9";
              typeLabel = "Transfer";
              amtColor = "#6d28d9";
            }

            const walletLabel =
              tx.type === "transfer"
                ? `${sourceWallet?.name || ""} -> ${destWallet?.name || ""}`
                : sourceWallet?.name || "-";

            return `
              <tr style="height: 28px; background-color: ${rowBg};">
                <td style="text-align: center; vertical-align: middle; border: 0.5pt solid #cbd5e1; font-size: 9.5pt; color: #64748b;">${idx + 1}</td>
                <td style="text-align: center; vertical-align: middle; border: 0.5pt solid #cbd5e1; font-size: 9.5pt; color: #334155;">${formatDateID(datePart, { short: true })}</td>
                <td style="text-align: center; vertical-align: middle; border: 0.5pt solid #cbd5e1; font-size: 9pt; color: #64748b;">${timePart || "00:00"}</td>
                <td style="text-align: center; vertical-align: middle; border: 0.5pt solid #cbd5e1; background-color: ${typeBadgeBg}; color: ${typeBadgeColor}; font-weight: bold; font-size: 9pt; border-left: 2pt solid ${typeBadgeColor};">${typeLabel}</td>
                <td style="vertical-align: middle; padding-left: 8px; border: 0.5pt solid #cbd5e1; font-size: 9.5pt; color: #1e293b;">${cat?.name || "-"}</td>
                <td style="vertical-align: middle; padding-left: 8px; border: 0.5pt solid #cbd5e1; font-size: 9.5pt; color: #334155;">${walletLabel}</td>
                <td style="vertical-align: middle; padding-left: 8px; border: 0.5pt solid #cbd5e1; font-size: 9.5pt; color: #0f172a;">${tx.description}</td>
                <td style="text-align: right; padding-right: 8px; vertical-align: middle; border: 0.5pt solid #cbd5e1; font-size: 10pt; font-weight: bold; color: ${amtColor}; white-space: nowrap;">
                  ${tx.type === "income" ? "+" : tx.type === "expense" ? "-" : ""} ${formatRupiah(tx.amount, false, currency)}
                </td>
              </tr>
            `;
          })
          .join("")}
      </table>
    </body>
    </html>
  `;

  const blob = new Blob([htmlContent], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  triggerDownload(blob, fileName);
}

/**
 * Helper Trigger Unduh File di Browser
 */
function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * FUNGSI UTAMA EKSPOR TRANSAKSI (Mendukung CSV & Excel)
 */
export function exportTransactionsToCSV(
  transactions: Transaction[],
  categories: Category[],
  wallets: Wallet[],
  options: ExportOptions = {},
) {
  if (options.format === "excel") {
    downloadStyledExcel(transactions, categories, wallets, options);
  } else {
    downloadCSV(transactions, categories, wallets, options);
  }
}
