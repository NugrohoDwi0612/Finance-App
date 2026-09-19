"use client";

import React, { useState } from "react";
import {
  Copy,
  Check,
  Code,
  Sparkles,
  Download,
  Share2,
  FileCode,
  FileText,
  Boxes,
  Layers,
  Terminal,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

interface ExportAIViewProps {
  onBack?: () => void;
}

export const ExportAIStudioView: React.FC<ExportAIViewProps> = () => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [selectedPromptType, setSelectedPromptType] = useState<
    "full_app" | "data_schema" | "system_prompt" | "component_bundle"
  >("full_app");

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const systemPromptTemplate = `# Google AI Studio Playground - System Prompt CatatUang Financial App

Kamu adalah Financial Assistant & Core Engineer untuk aplikasi Personal Finance "CatatUang".
Aplikasi ini adalah full-stack/offline-first Personal Finance PWA dengan standar Fintech Indonesia.

## Panduan Perilaku & Format:
1. Satuan mata uang standar adalah Rupiah (IDR), dengan format Rp X.XXX.XXX.
2. Terapkan prinsip Zero-Waste Financial Architecture:
   - Manajemen multi-dompet (Kas Tunai, Rekening Bank, E-Wallet, Investasi).
   - Perhitungan otomatis net worth dan cash flow (Pemasukan - Pengeluaran).
   - Pengenalan struk belanja OCR (Merchant, Total, Tanggal, Rincian Barang).
   - Fitur Split Bill cerdas (Bagi Rata & Per Pesanan + Pajak PB1 10% & Service 5%).
   - Tracking hutang & piutang (dengan status lunas/sebagian).
   - Tagihan berulang (Recurring subscriptions & bills).
3. Desain & Komponen:
   - Dibuat menggunakan React, Tailwind CSS (palette Stone), dan shadcn/ui.
   - Responsif Mobile-First dengan touch targets nyaman (min 44px) dan PWA Safe Area.
`;

  const schemaJsonTemplate = `{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "CatatUangFinancialModel",
  "type": "object",
  "properties": {
    "wallets": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "category": { "enum": ["cash", "bank", "ewallet", "investment"] },
          "balance": { "type": "number" },
          "institution": { "type": "string" },
          "accountNumber": { "type": "string" }
        },
        "required": ["id", "name", "category", "balance"]
      }
    },
    "transactions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "type": { "enum": ["expense", "income", "transfer"] },
          "amount": { "type": "number" },
          "categoryId": { "type": "string" },
          "walletId": { "type": "string" },
          "toWalletId": { "type": "string" },
          "date": { "type": "string" },
          "description": { "type": "string" }
        },
        "required": ["id", "type", "amount", "walletId", "date"]
      }
    },
    "budgets": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "categoryId": { "type": "string" },
          "monthlyLimit": { "type": "number" },
          "period": { "type": "string" }
        }
      }
    },
    "debtsLoans": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "personName": { "type": "string" },
          "type": { "enum": ["debt", "loan"] },
          "totalAmount": { "type": "number" },
          "paidAmount": { "type": "number" },
          "dueDate": { "type": "string" },
          "status": { "enum": ["unpaid", "partial", "paid"] }
        }
      }
    },
    "recurringBills": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "name": { "type": "string" },
          "amount": { "type": "number" },
          "billingCycle": { "enum": ["monthly", "weekly", "yearly"] },
          "dueDay": { "type": "number" },
          "isActive": { "type": "boolean" }
        }
      }
    }
  }
}`;

  const fullPromptAiStudio = `Buatkan aplikasi full personal finance PWA offline-first berbasis React, TypeScript, Tailwind CSS, dan shadcn/ui bernama CatatUang dengan fitur lengkap:
1. Layar Selamat Datang / Registrasi & Login (WelcomeAuthScreen) saat user baru install aplikasi dengan carousel fitur & setup akun awal.
2. Dashboard keuangan lengkap: Net Worth, Saldo Per Akun, Arus Kas Bulanan, Grafik Tren, dan Transaksi Terbaru.
3. Manajemen Multi-Dompet (Kas, BCA/Mandiri Bank, GoPay/OVO/ShopeePay E-wallet, Rekening Investasi) dengan fitur Reconcile saldo riil.
4. Pencatatan Transaksi Cepat dengan kalkulator instan (+, -, *, /), penandaan struk, kategori, tag, dan transfer antar dompet.
5. Pemindai OCR Struk Belanja otomatis menggunakan kamera ponsel atau galeri foto lokal.
6. Kalkulator Split Bill patungan cerdas (mode bagi rata atau per menu pesanan + PPN 10% & Service 5% + ekspor salin teks ke WhatsApp).
7. Anggaran Bulanan & Celengan Target Impian dengan persentase progress bar.
8. Catatan Hutang & Piutang Teman lengkap dengan histori cicilan pembayaran.
9. Tagihan Rutin & Pengingat Langganan Berulang.
10. Laporan Grafik Analisis Kategori & Tren Pengeluaran dengan ekspor data format JSON dan CSV.
11. Keamanan Kunci PIN 6-digit, autentikasi biometrik WebAuthn, mode privasi sensor saldo, dan pemilih 7 palet warna tema aksen.`;

  const singleFileBundleGuide = `// =====================================================================
// CATATUANG ALL-IN-ONE RESOURCE BUNDLE FOR GOOGLE AI STUDIO PLAYGROUND
// =====================================================================
// Salin bundle ini langsung ke Google AI Studio Playground (System Instructions
// atau User Prompt) untuk menginstruksikan Gemini membangun atau mereplikasi
// keseluruhan modul CatatUang dalam 1 prompt terstruktur.
// =====================================================================

${systemPromptTemplate}

// DATA STRUCTURE & JSON SCHEMA:
${schemaJsonTemplate}

// CORE ARCHITECTURE REQUIREMENTS:
${fullPromptAiStudio}
`;

  const getActiveContent = () => {
    switch (selectedPromptType) {
      case "full_app":
        return singleFileBundleGuide;
      case "system_prompt":
        return systemPromptTemplate;
      case "data_schema":
        return schemaJsonTemplate;
      case "component_bundle":
        return fullPromptAiStudio;
      default:
        return singleFileBundleGuide;
    }
  };

  const handleDownloadFile = () => {
    const content = getActiveContent();
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `CatatUang_Google_AI_Studio_${selectedPromptType}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 pb-28 animate-fadeIn">
      {/* Header View */}
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
            Ekspor Resource Google AI Studio
          </h2>
          <Badge
            variant="outline"
            className="text-[10px] font-bold text-teal-600 bg-teal-50 dark:bg-teal-950/60"
          >
            1 File 1 Menu
          </Badge>
        </div>
        <p className="text-xs text-stone-400">
          Semua resource, skema data, system prompt, dan instruksi lengkap
          disatukan dalam 1 file & 1 menu agar bisa langsung Anda salin ke
          Playground Google AI Studio.
        </p>
      </div>

      {/* Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Button
          variant={selectedPromptType === "full_app" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedPromptType("full_app")}
          className="text-xs font-bold gap-1.5 h-9"
        >
          <Boxes className="w-3.5 h-3.5" />
          <span>All-in-One Bundle</span>
        </Button>
        <Button
          variant={
            selectedPromptType === "system_prompt" ? "default" : "outline"
          }
          size="sm"
          onClick={() => setSelectedPromptType("system_prompt")}
          className="text-xs font-bold gap-1.5 h-9"
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>System Prompt</span>
        </Button>
        <Button
          variant={selectedPromptType === "data_schema" ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedPromptType("data_schema")}
          className="text-xs font-bold gap-1.5 h-9"
        >
          <Code className="w-3.5 h-3.5" />
          <span>Skema JSON Data</span>
        </Button>
        <Button
          variant={
            selectedPromptType === "component_bundle" ? "default" : "outline"
          }
          size="sm"
          onClick={() => setSelectedPromptType("component_bundle")}
          className="text-xs font-bold gap-1.5 h-9"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Full Prompt Gemini</span>
        </Button>
      </div>

      {/* Main Content Card */}
      <Card className="p-4 space-y-3.5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
          <div>
            <span className="text-xs font-black text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-teal-600" />
              {selectedPromptType === "full_app" &&
                "Bundle Lengkap 1 File (Playground Ready)"}
              {selectedPromptType === "system_prompt" &&
                "System Instruction Template"}
              {selectedPromptType === "data_schema" &&
                "JSON Data Schema Structure"}
              {selectedPromptType === "component_bundle" &&
                "Instruksi Detail Fitur & Logika"}
            </span>
            <p className="text-[11px] text-stone-400 mt-0.5">
              Tinggal klik tombol salin dan paste ke input box Google AI Studio
              Playground.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              onClick={() =>
                copyToClipboard(getActiveContent(), selectedPromptType)
              }
              className="flex-1 sm:flex-none text-xs font-bold gap-1.5 h-8.5 shadow-sm"
            >
              {copiedKey === selectedPromptType ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin ke Clipboard</span>
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadFile}
              className="text-xs font-bold gap-1.5 h-8.5"
              title="Download format .txt"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh .txt</span>
            </Button>
          </div>
        </div>

        {/* Code / Text Preview Block */}
        <div className="relative">
          <pre className="p-3.5 rounded-2xl bg-stone-900 text-stone-100 font-mono text-[11px] leading-relaxed max-h-[380px] overflow-y-auto whitespace-pre-wrap select-all border border-stone-800">
            {getActiveContent()}
          </pre>
        </div>

        {/* Quick Instructions */}
        <div className="p-3 rounded-2xl bg-stone-100 dark:bg-stone-800/60 text-xs text-stone-600 dark:text-stone-300 space-y-1.5">
          <p className="font-bold flex items-center gap-1.5 text-stone-900 dark:text-stone-100">
            <Sparkles className="w-3.5 h-3.5 text-teal-600" />
            Cara Memakai di Google AI Studio Playground:
          </p>
          <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-stone-500 dark:text-stone-400">
            <li>
              Buka <strong>aistudio.google.com</strong> dan pilih menu{" "}
              <strong>Playground / Create Prompt</strong>.
            </li>
            <li>
              Klik tombol <strong>Salin ke Clipboard</strong> di atas.
            </li>
            <li>
              Tempelkan ke bagian <strong>System Instructions</strong> atau{" "}
              <strong>User Prompt</strong>.
            </li>
            <li>
              Pilih model <strong>Gemini 2.5 Flash</strong> atau{" "}
              <strong>Gemini 1.5 Pro</strong> untuk generasi kode terbaik.
            </li>
          </ol>
        </div>
      </Card>
    </div>
  );
};
