"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Receipt,
  Users,
  Camera,
  Upload,
  Plus,
  Trash2,
  Share2,
  Check,
  Percent,
  Sparkles,
  ArrowRight,
  Calculator,
  RotateCcw,
  Save,
  Loader2,
  Edit2,
} from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { scanReceiptLocally, ParsedReceiptData } from "@/utils/ocrScanner";
import {
  formatRupiah,
  formatMoneyInput,
  parseSmartMoneyInput,
} from "@/utils/formatters";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialCalculators } from "./FinancialCalculators";

interface SplitBillPerson {
  id: string;
  name: string;
  itemAmount: number;
}

interface SmartToolsViewProps {
  onScanComplete: (data: ParsedReceiptData) => void;
}

const defaultPeople: SplitBillPerson[] = [
  { id: "1", name: "Saya", itemAmount: 70000 },
  { id: "2", name: "Teman 1", itemAmount: 60000 },
  { id: "3", name: "Teman 2", itemAmount: 50000 },
];

export const SmartToolsView: React.FC<SmartToolsViewProps> = ({
  onScanComplete,
}) => {
  const { hideBalances, user, colorPreset, addSplitBill } = useApp();

  const [activeTab, setActiveTab] = useState<"ocr" | "split" | "calc">("ocr");

  // ==========================================
  // 1. STATE OCR SCANNER DENGAN EDIT MANUAL
  // ==========================================
  const [isScanning, setIsScanning] = useState(false);
  const [scannedResult, setScannedResult] = useState<ParsedReceiptData | null>(
    null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Field Edit Hasil Scan
  const [editMerchant, setEditMerchant] = useState("");
  const [editTotalStr, setEditTotalStr] = useState("");
  const [editDate, setEditDate] = useState("");

  // ==========================================
  // 2. STATE SPLIT BILL TERPERSISTENSI (LOKAL + CLOUD)
  // ==========================================
  const loadSplitLocal = <T,>(key: string, fallback: T): T => {
    if (typeof window === "undefined") return fallback;
    try {
      const stored = localStorage.getItem(`catatuang_split_${key}`);
      return stored ? JSON.parse(stored) : fallback;
    } catch {
      return fallback;
    }
  };

  const [subtotalInput, setSubtotalInput] = useState<string>(() =>
    loadSplitLocal("subtotal", "180000"),
  );
  const [taxPercent, setTaxPercent] = useState<string>(() =>
    loadSplitLocal("tax", "10"),
  );
  const [servicePercent, setServicePercent] = useState<string>(() =>
    loadSplitLocal("service", "5"),
  );
  const [discountInput, setDiscountInput] = useState<string>(() =>
    loadSplitLocal("discount", "0"),
  );
  const [splitMode, setSplitMode] = useState<"equal" | "itemized">(() =>
    loadSplitLocal("mode", "equal"),
  );
  const [peopleCount, setPeopleCount] = useState<number>(() =>
    loadSplitLocal("peopleCount", 3),
  );
  const [people, setPeople] = useState<SplitBillPerson[]>(() =>
    loadSplitLocal("people", defaultPeople),
  );
  const [billTitle, setBillTitle] = useState<string>(() =>
    loadSplitLocal("title", "Makan Bersama"),
  );
  const [copiedShareText, setCopiedShareText] = useState(false);

  // Simpan otomatis ke LocalStorage setiap kali data split bill diubah
  useEffect(() => {
    localStorage.setItem(
      "catatuang_split_subtotal",
      JSON.stringify(subtotalInput),
    );
  }, [subtotalInput]);
  useEffect(() => {
    localStorage.setItem("catatuang_split_tax", JSON.stringify(taxPercent));
  }, [taxPercent]);
  useEffect(() => {
    localStorage.setItem(
      "catatuang_split_service",
      JSON.stringify(servicePercent),
    );
  }, [servicePercent]);
  useEffect(() => {
    localStorage.setItem(
      "catatuang_split_discount",
      JSON.stringify(discountInput),
    );
  }, [discountInput]);
  useEffect(() => {
    localStorage.setItem("catatuang_split_mode", JSON.stringify(splitMode));
  }, [splitMode]);
  useEffect(() => {
    localStorage.setItem(
      "catatuang_split_peopleCount",
      JSON.stringify(peopleCount),
    );
  }, [peopleCount]);
  useEffect(() => {
    localStorage.setItem("catatuang_split_people", JSON.stringify(people));
  }, [people]);
  useEffect(() => {
    localStorage.setItem("catatuang_split_title", JSON.stringify(billTitle));
  }, [billTitle]);

  // Handler OCR File
  const handleReceiptFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setIsScanning(true);
      try {
        const result = await scanReceiptLocally(base64);

        // Jika AI sibuk atau gagal, munculkan toast error yang ramah
        if (result.error) {
          toast.error(result.error);
          setScannedResult(null);
        } else {
          setScannedResult(result);
          setEditMerchant(result.merchantName);
          setEditTotalStr(formatMoneyInput(result.totalAmount));
          setEditDate(result.date);
          toast.success("Struk berhasil dipindai dengan AI!");
        }
      } catch (err) {
        toast.error("Gagal membaca foto struk.");
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Terapkan hasil scan ke modal pencatatan transaksi
  const handleApplyScan = () => {
    const finalAmount = parseSmartMoneyInput(editTotalStr);

    // Gabungkan tanggal nota dengan jam saat ini agar format ISO valid (YYYY-MM-DDTHH:mm)
    let finalDate = new Date().toISOString().slice(0, 16); // Default: Sekarang

    if (editDate) {
      // Ambil jam dan menit saat ini
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, "0");
      const minutes = String(now.getMinutes()).padStart(2, "0");
      // Format: "2026-09-18T14:30"
      finalDate = `${editDate}T${hours}:${minutes}`;
    }

    onScanComplete({
      merchantName: editMerchant.trim() || "Struk Belanja",
      totalAmount: finalAmount,
      date: finalDate, // <-- Tanggal + Jam valid dikirim ke modal
    });
  };

  // Kalkulasi Split Bill
  const rawSubtotal =
    splitMode === "itemized"
      ? people.reduce((acc, p) => acc + p.itemAmount, 0)
      : parseSmartMoneyInput(subtotalInput);

  const taxAmount = Math.round(
    (rawSubtotal * (parseFloat(taxPercent) || 0)) / 100,
  );
  const serviceAmount = Math.round(
    (rawSubtotal * (parseFloat(servicePercent) || 0)) / 100,
  );
  const discountAmount = parseSmartMoneyInput(discountInput);
  const grandTotal = Math.max(
    0,
    rawSubtotal + taxAmount + serviceAmount - discountAmount,
  );
  const perPersonEqual =
    peopleCount > 0 ? Math.round(grandTotal / peopleCount) : 0;

  // Simpan ke Supabase (Database Patungan)
  const handleSaveSplitToDatabase = async () => {
    try {
      const splitPeopleData =
        splitMode === "equal"
          ? Array.from({ length: peopleCount }).map((_, i) => ({
              id: `p-${i + 1}`,
              name: i === 0 ? "Saya" : `Teman ${i + 1}`,
              items: [],
              subtotal: Math.round(rawSubtotal / peopleCount),
              taxAmount: Math.round(taxAmount / peopleCount),
              serviceAmount: Math.round(serviceAmount / peopleCount),
              total: perPersonEqual,
              isPaid: i === 0,
            }))
          : people.map((p) => {
              const multiplier = rawSubtotal > 0 ? grandTotal / rawSubtotal : 1;
              return {
                id: p.id,
                name: p.name,
                items: [{ name: "Pesanan", price: p.itemAmount }],
                subtotal: p.itemAmount,
                taxAmount: 0,
                serviceAmount: 0,
                total: Math.round(p.itemAmount * multiplier),
                isPaid: p.name.toLowerCase() === "saya",
              };
            });

      await addSplitBill({
        title: billTitle.trim() || "Patungan Makan",
        date: new Date().toISOString().slice(0, 10),
        taxPercentage: parseFloat(taxPercent) || 0,
        servicePercentage: parseFloat(servicePercent) || 0,
        people: splitPeopleData,
        totalBill: grandTotal,
      });

      toast.success("Patungan berhasil disimpan permanen ke database!");
    } catch (err) {
      toast.error("Gagal menyimpan ke server.");
    }
  };

  const handleResetSplit = () => {
    setSubtotalInput("180000");
    setTaxPercent("10");
    setServicePercent("5");
    setDiscountInput("0");
    setSplitMode("equal");
    setPeopleCount(3);
    setPeople(defaultPeople);
    setBillTitle("Makan Bersama");
    toast.info("Data kalkulator patungan diatur ulang.");
  };

  // Generate Teks WhatsApp
  const generateShareText = () => {
    let msg = `🧾 *RINCIAN PATUNGAN: ${billTitle.toUpperCase()}*\n`;
    msg += `--------------------------------\n`;
    msg += `Subtotal: ${formatRupiah(rawSubtotal, false, user.baseCurrency)}\n`;
    if (taxAmount > 0)
      msg += `Pajak (${taxPercent}%): ${formatRupiah(taxAmount, false, user.baseCurrency)}\n`;
    if (serviceAmount > 0)
      msg += `Service (${servicePercent}%): ${formatRupiah(serviceAmount, false, user.baseCurrency)}\n`;
    if (discountAmount > 0)
      msg += `Diskon: -${formatRupiah(discountAmount, false, user.baseCurrency)}\n`;
    msg += `*Total Tagihan: ${formatRupiah(grandTotal, false, user.baseCurrency)}*\n\n`;

    msg += `*Rincian Pembayaran:*\n`;
    if (splitMode === "equal") {
      msg += `Bagi Rata (${peopleCount} orang):\n`;
      msg += `👉 Masing-masing: *${formatRupiah(perPersonEqual, false, user.baseCurrency)}*\n`;
    } else {
      const multiplier = rawSubtotal > 0 ? grandTotal / rawSubtotal : 1;
      people.forEach((p) => {
        const finalShare = Math.round(p.itemAmount * multiplier);
        msg += `• ${p.name}: *${formatRupiah(finalShare, false, user.baseCurrency)}* (Pesanan: ${formatRupiah(p.itemAmount, false, user.baseCurrency)})\n`;
      });
    }

    msg += `\nSilakan transfer ke rekening/QRIS ya! Terima kasih 🙏`;
    return msg;
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(generateShareText());
    setCopiedShareText(true);
    toast.success("Rincian tagihan tersalin! Siap ditempel di WhatsApp.");
    setTimeout(() => setCopiedShareText(false), 2500);
  };

  return (
    <div className="space-y-4 pb-28 animate-fadeIn">
      {/* Header */}
      <div>
        <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100">
          Fitur Cerdas (Smart Tools)
        </h2>
        <p className="text-xs text-stone-400">
          Scan struk otomatis OCR & kalkulator bagi tagihan (Split Bill)
        </p>
      </div>

      {/* Tabs Switcher */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "ocr" | "split" | "calc")}
      >
        <TabsList className="w-full grid grid-cols-3 bg-stone-100 dark:bg-stone-800">
          <TabsTrigger value="ocr" className="text-xs font-bold gap-1.5">
            <Receipt className="w-4 h-4" />
            <span className="truncate">Scan OCR</span>
          </TabsTrigger>
          <TabsTrigger value="split" className="text-xs font-bold gap-1.5">
            <Users className="w-4 h-4" />
            <span className="truncate">Split Bill</span>
          </TabsTrigger>
          <TabsTrigger value="calc" className="text-xs font-bold gap-1.5">
            <Calculator className="w-4 h-4 text-emerald-500" />
            <span className="truncate">Kalkulator</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* =========================================================================
          TAB 1: OCR SCANNER DENGAN EDIT KOREKSI
         ========================================================================= */}
      {activeTab === "ocr" && (
        <div className="space-y-4">
          <Card className="p-5 text-center space-y-3 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
            <div className="w-14 h-14 rounded-3xl bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 flex items-center justify-center mx-auto shadow-xs">
              <Sparkles className="w-7 h-7 text-teal-600" />
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
                Pindai Struk Belanja Otomatis
              </h3>
              <p className="text-xs text-stone-400 max-w-sm mx-auto mt-1">
                Foto struk belanja Anda. Sistem akan mengekstrak nama toko,
                tanggal, dan nominal total secara otomatis.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleReceiptFile}
                className="hidden"
              />
              <input
                type="file"
                ref={cameraInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleReceiptFile}
                className="hidden"
              />

              <Button
                onClick={() => cameraInputRef.current?.click()}
                className="gap-2 font-bold text-xs bg-teal-600 hover:bg-teal-500 text-white"
              >
                <Camera className="w-4 h-4" />
                <span>Buka Kamera HP</span>
              </Button>

              <Button
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="gap-2 font-bold text-xs"
              >
                <Upload className="w-4 h-4" />
                <span>Pilih Galeri</span>
              </Button>
            </div>
          </Card>

          {isScanning && (
            <div className="p-6 rounded-3xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-center space-y-2 animate-pulse">
              <Loader2 className="w-6 h-6 text-teal-600 mx-auto animate-spin" />
              <p className="text-xs font-bold text-teal-800 dark:text-teal-200">
                Membaca teks nota & mendeteksi total belanja...
              </p>
            </div>
          )}

          {/* Kartu Hasil Scan yang Bisa Diedit / Dikoreksi */}
          {scannedResult && !isScanning && (
            <Card className="p-4 space-y-3.5 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800 animate-slideUp">
              <div className="flex items-center justify-between border-b pb-2 border-stone-100 dark:border-stone-800">
                <span className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
                  Hasil Pindai (Bisa Anda Sesuaikan)
                </span>
                <Badge
                  variant="outline"
                  className="text-[10px] text-teal-600 bg-teal-500/10 border-teal-500/20 font-bold"
                >
                  OCR Siap
                </Badge>
              </div>

              <div className="space-y-2.5">
                <div>
                  <label className="text-[10px] font-bold uppercase text-stone-400 block mb-1">
                    Nama Toko / Merchant
                  </label>
                  <Input
                    type="text"
                    value={editMerchant}
                    onChange={(e) => setEditMerchant(e.target.value)}
                    className="text-xs font-bold h-9"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-stone-400 block mb-1">
                      Total Belanja (Rp)
                    </label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      value={editTotalStr}
                      onChange={(e) =>
                        setEditTotalStr(formatMoneyInput(e.target.value))
                      }
                      className="text-sm font-black font-mono h-9 text-emerald-600 dark:text-emerald-400"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase text-stone-400 block mb-1">
                      Tanggal Nota
                    </label>
                    <Input
                      type="date"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                      className="text-xs font-semibold h-9"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleApplyScan}
                className="w-full font-bold text-xs bg-teal-600 hover:bg-teal-500 text-white gap-1.5 h-9"
              >
                <span>Catat Transaksi Ini Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Card>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: SPLIT BILL DENGAN PERSISTENSI PENUH (DATA TIDAK AKAN HILANG)
         ========================================================================= */}
      {activeTab === "split" && (
        <div className="space-y-4">
          <Card className="p-4 space-y-3.5 bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800">
            {/* Header Form & Reset */}
            <div className="flex items-center justify-between">
              <div className="flex-1 mr-2">
                <input
                  type="text"
                  value={billTitle}
                  onChange={(e) => setBillTitle(e.target.value)}
                  placeholder="Nama Acara (Makan Bersama)..."
                  className="w-full text-sm font-black bg-transparent border-b border-dashed border-stone-300 dark:border-stone-700 pb-0.5 focus:outline-hidden text-stone-900 dark:text-stone-100"
                />
              </div>
              <button
                onClick={handleResetSplit}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
                title="Reset Form"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mode Bagi Rata vs Per Pesanan */}
            <Tabs
              value={splitMode}
              onValueChange={(val) => setSplitMode(val as "equal" | "itemized")}
            >
              <TabsList className="w-full grid grid-cols-2 bg-stone-100 dark:bg-stone-800">
                <TabsTrigger value="equal" className="text-xs font-bold">
                  Bagi Rata (Equal)
                </TabsTrigger>
                <TabsTrigger value="itemized" className="text-xs font-bold">
                  Per Pesanan Masing-Masing
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {splitMode === "equal" ? (
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-400 mb-1">
                    Subtotal Tagihan (Rp)
                  </label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    value={subtotalInput}
                    onChange={(e) =>
                      setSubtotalInput(formatMoneyInput(e.target.value))
                    }
                    className="text-xs font-black font-mono h-9"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-stone-400 mb-1">
                    Jumlah Orang
                  </label>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        setPeopleCount(Math.max(1, peopleCount - 1))
                      }
                      className="w-8 h-9"
                    >
                      -
                    </Button>
                    <span className="flex-1 text-center text-xs font-extrabold font-mono text-stone-900 dark:text-stone-100">
                      {peopleCount}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setPeopleCount(peopleCount + 1)}
                      className="w-8 h-9"
                    >
                      +
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase text-stone-400">
                    Daftar Pesanan Teman
                  </span>
                  <button
                    onClick={() =>
                      setPeople([
                        ...people,
                        {
                          id: Date.now().toString(),
                          name: `Teman ${people.length + 1}`,
                          itemAmount: 40000,
                        },
                      ])
                    }
                    className="text-[11px] font-bold text-teal-600 dark:text-teal-400 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Tambah Orang
                  </button>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {people.map((p, idx) => (
                    <div key={p.id} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => {
                          const updated = [...people];
                          updated[idx].name = e.target.value;
                          setPeople(updated);
                        }}
                        className="flex-1 px-2.5 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold"
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={p.itemAmount.toLocaleString("id-ID")}
                        onChange={(e) => {
                          const updated = [...people];
                          updated[idx].itemAmount = parseSmartMoneyInput(
                            e.target.value,
                          );
                          setPeople(updated);
                        }}
                        className="w-28 px-2.5 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-black font-mono text-right"
                      />
                      {people.length > 1 && (
                        <button
                          onClick={() =>
                            setPeople(people.filter((x) => x.id !== p.id))
                          }
                          className="p-1.5 text-stone-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pajak, Service & Diskon */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
              <div>
                <label className="block text-[9px] font-bold uppercase text-stone-400 mb-0.5">
                  Pajak PB1 (%)
                </label>
                <input
                  type="number"
                  value={taxPercent}
                  onChange={(e) => setTaxPercent(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold font-mono text-center"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase text-stone-400 mb-0.5">
                  Service (%)
                </label>
                <input
                  type="number"
                  value={servicePercent}
                  onChange={(e) => setServicePercent(e.target.value)}
                  className="w-full px-2 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold font-mono text-center"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold uppercase text-stone-400 mb-0.5">
                  Diskon (Rp)
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={discountInput}
                  onChange={(e) =>
                    setDiscountInput(formatMoneyInput(e.target.value))
                  }
                  className="w-full px-2 py-1.5 rounded-xl bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-bold font-mono text-right"
                />
              </div>
            </div>

            {/* Kalkulasi Total */}
            <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-2xl space-y-1 text-xs">
              <div className="flex justify-between text-stone-500">
                <span>Subtotal:</span>
                <span className="font-semibold text-stone-900 dark:text-stone-100 font-mono">
                  {formatRupiah(rawSubtotal, false, user.baseCurrency)}
                </span>
              </div>
              {taxAmount > 0 && (
                <div className="flex justify-between text-stone-500">
                  <span>Pajak ({taxPercent}%):</span>
                  <span className="font-mono">
                    +{formatRupiah(taxAmount, false, user.baseCurrency)}
                  </span>
                </div>
              )}
              {serviceAmount > 0 && (
                <div className="flex justify-between text-stone-500">
                  <span>Service ({servicePercent}%):</span>
                  <span className="font-mono">
                    +{formatRupiah(serviceAmount, false, user.baseCurrency)}
                  </span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Diskon:</span>
                  <span className="font-mono">
                    -{formatRupiah(discountAmount, false, user.baseCurrency)}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm font-black pt-1.5 border-t border-stone-200 dark:border-stone-700">
                <span>Total Tagihan:</span>
                <span className="text-teal-600 dark:text-teal-400 font-mono">
                  {formatRupiah(grandTotal, false, user.baseCurrency)}
                </span>
              </div>
            </div>

            {/* Rincian Bayar Per Orang */}
            {splitMode === "equal" ? (
              <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-center">
                <span className="text-[10px] font-bold text-teal-800 dark:text-teal-200 uppercase">
                  Masing-Masing Bayar ({peopleCount} Orang)
                </span>
                <p className="text-xl font-black font-mono text-teal-700 dark:text-teal-300 mt-0.5">
                  {formatRupiah(perPersonEqual, false, user.baseCurrency)}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-stone-400">
                  Rincian Bersih Termasuk Pajak
                </span>
                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  {people.map((p) => {
                    const multiplier =
                      rawSubtotal > 0 ? grandTotal / rawSubtotal : 1;
                    const finalShare = Math.round(p.itemAmount * multiplier);
                    return (
                      <div
                        key={p.id}
                        className="p-2 rounded-xl bg-stone-50 dark:bg-stone-800 flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-stone-800 dark:text-stone-200">
                          {p.name}
                        </span>
                        <span className="font-black font-mono text-teal-600 dark:text-teal-400">
                          {formatRupiah(finalShare, false, user.baseCurrency)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Dua Tombol Aksi: Simpan ke Cloud & Kirim ke WhatsApp */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <Button
                onClick={handleSaveSplitToDatabase}
                variant="outline"
                className="font-bold text-xs gap-1.5 h-9"
              >
                <Save className="w-3.5 h-3.5 text-teal-600" />
                <span>Simpan Tagihan</span>
              </Button>

              <Button
                onClick={handleCopyShare}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 h-9 shadow-md"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{copiedShareText ? "Tersalin!" : "Salin ke WA"}</span>
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* TAB 3: KALKULATOR FINANSIAL */}
      {activeTab === "calc" && <FinancialCalculators />}
    </div>
  );
};
