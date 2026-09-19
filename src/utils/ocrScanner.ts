export interface ParsedReceiptData {
  merchantName: string;
  totalAmount: number;
  date: string;
  items?: { name: string; price: number }[];
  rawText?: string;
  error?: string; // Menampung pesan jika server AI sedang sibuk
}

/**
 * TURBO COMPRESSION: Mengecilkan foto agar ringan diupload
 */
function compressImageForAI(base64: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return resolve(base64);

      let width = img.width;
      let height = img.height;
      const maxDim = 1000;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.src = base64;
  });
}

/**
 * Pindai Struk dengan AI tanpa memicu layar merah Next.js jika gagal
 */
export async function scanReceiptLocally(base64Image: string): Promise<ParsedReceiptData> {
  try {
    const compressedImage = await compressImageForAI(base64Image);

    const res = await fetch("/api/scan-receipt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: compressedImage }),
    });

    const data = await res.json().catch(() => ({}));

    // Jika server AI sedang sibuk atau error, kembalikan pesan ramah (Tanpa throw error)
    if (!res.ok || data.error) {
      let friendlyError = data.error || "Server AI sedang sibuk. Silakan coba sebentar lagi.";
      if (friendlyError.includes("high demand") || friendlyError.includes("Spikes in demand")) {
        friendlyError = "Lalu lintas server AI sedang padat. Silakan coba beberapa detik lagi.";
      }

      return {
        merchantName: "Struk Belanja",
        totalAmount: 0,
        date: new Date().toISOString().slice(0, 10),
        items: [],
        error: friendlyError,
      };
    }

    return {
      merchantName: data.merchantName || "Struk Belanja",
      totalAmount: Number(data.totalAmount) || 0,
      date: data.date || new Date().toISOString().slice(0, 10),
      items: data.items || [],
    };
  } catch (err: any) {
    // Tangkap error jaringan tanpa memicu crash
    return {
      merchantName: "Struk Belanja",
      totalAmount: 0,
      date: new Date().toISOString().slice(0, 10),
      items: [],
      error: "Koneksi ke AI terputus. Silakan periksa internet Anda.",
    };
  }
}