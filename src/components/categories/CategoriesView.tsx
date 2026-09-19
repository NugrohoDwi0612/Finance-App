"use client";

import React, { useState } from "react";
import { Plus, Edit2, Trash2, Tag, AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner"; // <-- Notifikasi Toast
import { useApp } from "@/context/AppContext";
import { Category } from "@/types";
import { IconRenderer } from "@/components/common/IconRenderer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export const CategoriesView: React.FC = () => {
  const { categories, addCategory, editCategory, deleteCategory, colorPreset } =
    useApp();

  const [activeTab, setActiveTab] = useState<"expense" | "income">("expense");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State Modal Konfirmasi Hapus
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [color, setColor] = useState("#f97316");
  const [iconName, setIconName] = useState("Utensils");

  const colorPalette = [
    "#f97316",
    "#3b82f6",
    "#ec4899",
    "#eab308",
    "#8b5cf6",
    "#ef4444",
    "#14b8a6",
    "#10b981",
    "#06b6d4",
    "#64748b",
  ];

  const iconOptions = [
    "Utensils",
    "Car",
    "ShoppingBag",
    "Receipt",
    "Film",
    "HeartPulse",
    "GraduationCap",
    "Briefcase",
    "Laptop",
    "TrendingUp",
    "Gift",
    "Plane",
    "Coffee",
    "Home",
    "Smartphone",
    "Zap",
  ];

  const filteredCategories = categories.filter((c) => c.type === activeTab);

  const openCreateModal = () => {
    setEditingCategory(null);
    setName("");
    setColor(activeTab === "income" ? "#10b981" : "#f97316");
    setIconName(activeTab === "income" ? "Briefcase" : "Utensils");
    setIsModalOpen(true);
  };

  const openEditModal = (c: Category) => {
    setEditingCategory(c);
    setName(c.name);
    setColor(c.color);
    setIconName(c.iconName);
    setIsModalOpen(true);
  };

  // 1. Simpan Tambah / Edit Kategori dengan Notifikasi Toast
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) {
      toast.error("Nama kategori wajib diisi!");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await editCategory(editingCategory.id, {
          name: name.trim(),
          color,
          iconName,
        });
        toast.success(`Kategori "${name.trim()}" berhasil diperbarui!`);
      } else {
        await addCategory({
          name: name.trim(),
          type: activeTab,
          color,
          iconName,
        });
        toast.success(`Kategori "${name.trim()}" berhasil ditambahkan!`);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      toast.error("Gagal menyimpan kategori ke server.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Eksekusi Hapus Kategori dengan Notifikasi Toast
  const handleConfirmDelete = async () => {
    if (!deletingCategory || isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteCategory(deletingCategory.id);
      toast.info(`Kategori "${deletingCategory.name}" telah dihapus.`);
      setDeletingCategory(null);
    } catch (err: any) {
      toast.error("Gagal menghapus kategori dari server.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 pb-28 animate-fadeIn">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Tag
              className="w-5 h-5"
              style={{ color: colorPreset.primaryHex }}
            />
            <span>Kategori Transaksi</span>
          </h2>
          <p className="text-xs text-stone-400">
            Atur dan kustomisasi kategori pengeluaran & pemasukan
          </p>
        </div>
        <Button
          size="sm"
          onClick={openCreateModal}
          style={{
            background: `linear-gradient(135deg, ${colorPreset.primaryHex}, ${colorPreset.secondaryHex})`,
          }}
          className="gap-1.5 font-bold text-xs h-8 shadow-xs text-white hover:brightness-110"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Tambah Kategori</span>
        </Button>
      </div>

      {/* Tabs using shadcn Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "expense" | "income")}
      >
        <TabsList className="w-full grid grid-cols-2 bg-stone-100 dark:bg-stone-800">
          <TabsTrigger value="expense" className="text-xs font-bold">
            Pengeluaran ({categories.filter((c) => c.type === "expense").length}
            )
          </TabsTrigger>
          <TabsTrigger value="income" className="text-xs font-bold">
            Pemasukan ({categories.filter((c) => c.type === "income").length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {filteredCategories.map((c) => (
          <Card
            key={c.id}
            className="p-3.5 flex items-center justify-between bg-white dark:bg-stone-900 border border-stone-200/80 dark:border-stone-800"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-xs shrink-0"
                style={{ backgroundColor: c.color }}
              >
                <IconRenderer name={c.iconName} size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-stone-900 dark:text-stone-100 truncate">
                  {c.name}
                </p>
                <Badge
                  variant={c.isDefault ? "secondary" : "outline"}
                  className="text-[9px] h-4 mt-0.5 px-1.5 font-medium"
                >
                  {c.isDefault ? "Bawaan" : "Kustom"}
                </Badge>
              </div>
            </div>

            {/* Tombol Aksi Edit & Hapus */}
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => openEditModal(c)}
                className="h-8 w-8 text-stone-400 hover:text-stone-100 hover:bg-stone-800"
                title="Edit Kategori"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </Button>

              {!c.isDefault ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeletingCategory(c)}
                  className="h-8 w-8 text-stone-400 hover:text-rose-500 hover:bg-rose-500/10"
                  title="Hapus Kategori"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              ) : (
                <span
                  className="text-[10px] text-stone-500 font-semibold px-2 select-none"
                  title="Kategori bawaan sistem tidak dapat dihapus"
                >
                  Terkunci
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Modal Add / Edit with shadcn Dialog */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <DialogHeader>
            <DialogTitle className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
              {editingCategory ? "Edit Kategori" : "Tambah Kategori Baru"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold uppercase text-stone-400">
                Nama Kategori
              </label>
              <Input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Langganan Kursus, Hobi Gaming..."
                className="text-xs font-semibold h-9"
              />
            </div>

            {/* Pilihan Warna */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-stone-400">
                Pilihan Warna
              </label>
              <div className="flex flex-wrap gap-2">
                {colorPalette.map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setColor(col)}
                    className={`w-6 h-6 rounded-full transition-transform ${
                      color === col
                        ? "scale-125 ring-2 ring-stone-900 dark:ring-white ring-offset-2 ring-offset-stone-900"
                        : ""
                    }`}
                    style={{ backgroundColor: col }}
                  />
                ))}
              </div>
            </div>

            {/* Pilihan Ikon */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase text-stone-400">
                Pilihan Ikon
              </label>
              <div className="grid grid-cols-6 gap-2 max-h-36 overflow-y-auto p-1 scrollbar-none">
                {iconOptions.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIconName(ic)}
                    className={`p-2 rounded-xl border flex items-center justify-center transition ${
                      iconName === ic
                        ? "border-teal-500 bg-teal-500/10 text-teal-400"
                        : "border-stone-200 dark:border-stone-800 text-stone-500"
                    }`}
                  >
                    <IconRenderer name={ic} size={18} />
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => setIsModalOpen(false)}
                className="flex-1 text-xs font-semibold"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                style={{
                  background: `linear-gradient(135deg, ${colorPreset.primaryHex}, ${colorPreset.secondaryHex})`,
                }}
                className="flex-1 text-xs font-bold text-white shadow-md hover:brightness-110"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </div>
                ) : editingCategory ? (
                  "Simpan Perubahan"
                ) : (
                  "Buat Kategori"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Hapus Kategori */}
      <Dialog
        open={!!deletingCategory}
        onOpenChange={(open) =>
          !open && !isDeleting && setDeletingCategory(null)
        }
      >
        <DialogContent className="max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
          <DialogHeader>
            <div className="w-10 h-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <DialogTitle className="text-sm font-extrabold text-stone-900 dark:text-stone-100">
              Hapus Kategori?
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-400">
              Apakah Anda yakin ingin menghapus kategori{" "}
              <strong className="text-stone-900 dark:text-stone-100">
                "{deletingCategory?.name}"
              </strong>
              ? Data transaksi yang menggunakan kategori ini mungkin akan
              kehilangan labelnya.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 pt-3 sm:justify-start">
            <Button
              type="button"
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeletingCategory(null)}
              className="flex-1 text-xs font-semibold"
            >
              Batal
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
              className="flex-1 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white"
            >
              {isDeleting ? (
                <div className="flex items-center justify-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menghapus...</span>
                </div>
              ) : (
                "Ya, Hapus"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
