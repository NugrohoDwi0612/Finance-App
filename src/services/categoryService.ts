import { supabase } from "@/utils/supabase";
import { Category } from "@/types";

// Helper mapper: Mengubah format snake_case Supabase ke camelCase TypeScript
const mapFromDB = (row: any): Category => ({
  id: row.id,
  name: row.name,
  type: row.type as "expense" | "income",
  iconName: row.icon_name || "Receipt",
  color: row.color || "#3b82f6",
  isDefault: Boolean(row.is_default),
});

const defaultCategoriesToSeed: Omit<Category, "id">[] = [
  {
    name: "Makanan & Minuman",
    type: "expense",
    iconName: "Utensils",
    color: "#f97316",
    isDefault: true,
  },
  {
    name: "Transportasi",
    type: "expense",
    iconName: "Car",
    color: "#3b82f6",
    isDefault: true,
  },
  {
    name: "Belanja",
    type: "expense",
    iconName: "ShoppingBag",
    color: "#ec4899",
    isDefault: true,
  },
  {
    name: "Tagihan & Utilitas",
    type: "expense",
    iconName: "Receipt",
    color: "#eab308",
    isDefault: true,
  },
  {
    name: "Hiburan",
    type: "expense",
    iconName: "Film",
    color: "#8b5cf6",
    isDefault: true,
  },
  {
    name: "Kesehatan",
    type: "expense",
    iconName: "HeartPulse",
    color: "#ef4444",
    isDefault: true,
  },
  {
    name: "Gaji Pokok",
    type: "income",
    iconName: "Briefcase",
    color: "#10b981",
    isDefault: true,
  },
  {
    name: "Freelance / Side Job",
    type: "income",
    iconName: "Laptop",
    color: "#06b6d4",
    isDefault: true,
  },
  {
    name: "Investasi & Bunga",
    type: "income",
    iconName: "TrendingUp",
    color: "#84cc16",
    isDefault: true,
  },
  {
    name: "Bonus & Hadiah",
    type: "income",
    iconName: "Gift",
    color: "#a855f7",
    isDefault: true,
  },
];

/**
 * 1. Mengambil Semua Kategori Milik User dari Supabase
 */
export async function getCategoriesDB(): Promise<{
  success: boolean;
  data: Category[];
  error: string | null;
}> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return { success: false, data: [], error: "Pengguna belum login." };

    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id);

    if (error) throw error;

    // Jika user baru dan belum punya kategori di DB, lakukan Auto-Seed kategori awal
    if (!data || data.length === 0) {
      const seedPayload = defaultCategoriesToSeed.map((c, idx) => ({
        id: `cat-seed-${Date.now()}-${idx}`,
        user_id: user.id,
        name: c.name,
        type: c.type,
        icon_name: c.iconName,
        color: c.color,
        is_default: true,
      }));

      await supabase.from("categories").insert(seedPayload);
      return {
        success: true,
        data: seedPayload.map(mapFromDB),
        error: null,
      };
    }

    return {
      success: true,
      data: data.map(mapFromDB),
      error: null,
    };
  } catch (err: any) {
    console.warn("Gagal mengambil kategori dari DB:", err.message);
    return { success: false, data: [], error: err.message };
  }
}

/**
 * 2. Tambah Kategori Baru ke Database
 */
export async function addCategoryDB(
  category: Category 
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Silakan login terlebih dahulu." };

    const { error } = await supabase.from("categories").insert({
      id: category.id, 
      user_id: user.id,
      name: category.name,
      type: category.type,
      icon_name: category.iconName,
      color: category.color,
      is_default: category.isDefault || false,
    });

    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    console.error("Gagal addCategoryDB:", err);
    return { success: false, error: err.message };
  }
}


/**
 * 3. Edit Kategori di Database
 */
export async function editCategoryDB(
  id: string,
  updates: Partial<Category>,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return { success: false, error: "Silakan login terlebih dahulu." };

    const updatePayload: any = {};
    if (updates.name !== undefined) updatePayload.name = updates.name;
    if (updates.color !== undefined) updatePayload.color = updates.color;
    if (updates.iconName !== undefined)
      updatePayload.icon_name = updates.iconName;

    const { error } = await supabase
      .from("categories")
      .update(updatePayload)
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return { success: true, error: null };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || "Gagal memperbarui kategori.",
    };
  }
}

/**
 * 4. Hapus Kategori dari Database
 */
export async function deleteCategoryDB(id: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Silakan login terlebih dahulu." };

    const { data, error } = await supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)
      .select();

    if (error) throw error;
    return { success: true, error: null };
  } catch (err: any) {
    console.error("Gagal deleteCategoryDB:", err);
    return { success: false, error: err.message };
  }
}