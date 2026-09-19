import { supabase } from "@/utils/supabase";
import { CurrencyCode } from "@/types";
import { parseSmartMoneyInput } from "@/utils/formatters";

export interface RegisterParams {
  name: string;
  email: string;
  password: string;
  currency: CurrencyCode;
  initialBalanceStr: string;
  pinCode: string;
  enablePin: boolean;
}

/**
 * Service untuk menangani Login ke Supabase
 */
export async function loginWithEmail(email: string, password: string) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      let friendlyMessage = "Gagal masuk ke akun.";
      if (error.message.includes("Invalid login credentials")) {
        friendlyMessage =
          "Email atau kata sandi salah. Silakan periksa kembali.";
      } else if (error.message.includes("Email not confirmed")) {
        friendlyMessage =
          "Email belum dikonfirmasi. Periksa kotak masuk email Anda.";
      } else {
        friendlyMessage = error.message;
      }
      // Return error secara rapi tanpa melempar throw error (mencegah layar merah)
      return {
        success: false,
        error: friendlyMessage,
        user: null,
        profile: null,
      };
    }

    // Ambil data profil pengguna dari tabel profiles
    const { data: profile } = await supabase
      .from("profiles")
      .select("name, base_currency, pin_code, pin_enabled")
      .eq("id", data.user.id)
      .single();

    return {
      success: true,
      error: null,
      user: data.user,
      profile,
    };
  } catch (err: any) {
    return {
      success: false,
      error: "Terjadi gangguan koneksi internet. Silakan coba lagi.",
      user: null,
      profile: null,
    };
  }
}

/**
 * Service untuk menangani Pendaftaran Akun, Profil, & Rekening Awal
 */
export async function registerWithEmail(params: RegisterParams) {
  try {
    // 1. Buat user di Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: params.email.trim(),
      password: params.password,
      options: {
        data: {
          name: params.name.trim(),
        },
      },
    });

    if (authError) {
      let friendlyMessage = authError.message;
      if (authError.message.includes("User already registered")) {
        friendlyMessage = "Email ini sudah terdaftar. Silakan pilih 'Masuk'.";
      }
      return { success: false, error: friendlyMessage, user: null };
    }

    if (!authData.user) {
      return {
        success: false,
        error: "Gagal membuat akun pengguna.",
        user: null,
      };
    }

    const userId = authData.user.id;
    const balanceNum = parseSmartMoneyInput(params.initialBalanceStr);

    // 2. Buat profil di tabel profiles
    await supabase.from("profiles").upsert({
      id: userId,
      name: params.name.trim(),
      email: params.email.trim(),
      base_currency: params.currency,
      pin_code:
        params.enablePin && params.pinCode.length === 6 ? params.pinCode : null,
      pin_enabled: params.enablePin && params.pinCode.length === 6,
      updated_at: new Date().toISOString(),
    });

    // 3. Buat rekening awal jika ada saldo
    if (balanceNum > 0) {
      await supabase.from("wallets").insert({
        id: `w-cash-${Date.now()}`,
        user_id: userId,
        name: "Dompet Tunai",
        category: "cash",
        balance: balanceNum,
        color: "#10b981",
        icon_name: "Banknote",
        institution: "Cash Fisik",
      });
    }

    return {
      success: true,
      error: null,
      user: authData.user,
      balanceNum,
    };
  } catch (err: any) {
    return {
      success: false,
      error: "Gagal menyelesaikan pendaftaran ke cloud. Periksa jaringan Anda.",
      user: null,
    };
  }
}
