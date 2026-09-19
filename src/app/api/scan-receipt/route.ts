import { NextRequest, NextResponse } from "next/server";

/**
 * PARSER JSON KEBAL ERROR (SELF-HEALING)
 * Jika AI menghasilkan JSON cacat (tanda kutip miring, koma berlebih),
 * fungsi ini otomatis memperbaikinya agar tidak terjadi SyntaxError.
 */
function safelyParseJSON(rawStr: string) {
  if (!rawStr) return null;

  // 1. Coba parse langsung
  try {
    return JSON.parse(rawStr);
  } catch (e) {}

  // 2. Ekstrak bagian kurung kurawal { ... }
  const jsonMatch = rawStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    const extracted = jsonMatch[0];
    try {
      return JSON.parse(extracted);
    } catch (e) {}

    // Perbaiki tanda kutip tunggal dan koma menggantung
    const sanitized = extracted
      .replace(/,\s*([\}\]])/g, "$1") // Buang trailing comma
      .replace(/([{,]\s*)'([^']+)'(\s*:)/g, '$1"$2"$3') // Ubah single quote key jadi double quote
      .replace(/:\s*'([^']*)'/g, ': "$1"'); // Ubah single quote value jadi double quote

    try {
      return JSON.parse(sanitized);
    } catch (e) {}
  }

  // 3. Fallback Darurat: Ekstrak manual dengan Regex (Mustahil Error)
  const merchantMatch = rawStr.match(/["']?merchantName["']?\s*:\s*["']([^"']+)["']/i);
  const totalMatch = rawStr.match(/["']?totalAmount["']?\s*:\s*(\d+)/i);
  const dateMatch = rawStr.match(/["']?date["']?\s*:\s*["']([^"']+)["']/i);

  return {
    merchantName: merchantMatch ? merchantMatch[1] : "Struk Belanja",
    totalAmount: totalMatch ? parseInt(totalMatch[1], 10) : 0,
    date: dateMatch ? dateMatch[1] : new Date().toISOString().slice(0, 10),
    items: [],
  };
}

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();
    if (!image) {
      return NextResponse.json(
        { error: "Foto struk tidak ditemukan." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY belum disetel di file .env.local" },
        { status: 500 }
      );
    }

    const mimeType =
      image.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/)?.[1] ||
      "image/jpeg";
    const base64Data = image.replace(/^data:image\/[a-zA-Z0-9-.+]+;base64,/, "");

    const promptText = `
      Anda adalah asisten AI pembaca nota kasir Indonesia.
      Ekstrak dari gambar struk ini:
      1. "merchantName": Nama toko/minimarket/resto.
      2. "totalAmount": Nominal GRAND TOTAL yang sebenarnya dibayar pengguna (hanya angka bulat integer, bukan uang tunai yang diserahkan atau kembalian).
      3. "date": Tanggal transaksi format "YYYY-MM-DD".
      4. "items": Array maksimal 5 barang [{"name": string, "price": number}].
    `;

    // Gunakan model Flash resmi Anda
    const modelsToTry = ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-flash-lite-latest"];

    let resJson = null;
    let lastErrorMsg = "";

    for (const model of modelsToTry) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: promptText },
                  {
                    inline_data: {
                      mime_type: mimeType,
                      data: base64Data,
                    },
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 1000,
              responseMimeType: "application/json",
              thinkingConfig: { thinkingBudget: 0 },
              responseSchema: {
                type: "OBJECT",
                properties: {
                  merchantName: { type: "STRING" },
                  totalAmount: { type: "INTEGER" },
                  date: { type: "STRING" },
                  items: {
                    type: "ARRAY",
                    items: {
                      type: "OBJECT",
                      properties: {
                        name: { type: "STRING" },
                        price: { type: "INTEGER" },
                      },
                    },
                  },
                },
                required: ["merchantName", "totalAmount", "date"],
              },
            },
          }),
        });

        const data = await response.json();

        if (response.ok) {
          resJson = data;
          break; // Berhasil!
        } else {
          lastErrorMsg = data?.error?.message || "Model sedang sibuk.";
          console.warn(`Model ${model} sibuk/gagal, beralih ke cadangan...`);
        }
      } catch (e: any) {
        lastErrorMsg = e.message;
      }
    }

    if (!resJson) {
      return NextResponse.json(
        { error: lastErrorMsg || "Layanan AI sedang sibuk. Silakan coba sesaat lagi." },
        { status: 503 }
      );
    }

    const candidate = resJson?.candidates?.[0];
    const parts = candidate?.content?.parts || [];

    // Cari teks hasil JSON
    let candidateText = "";
    for (const part of parts) {
      if (part.text && !part.thought) {
        candidateText = part.text;
      }
    }

    if (!candidateText && parts.length > 0) {
      candidateText = parts[parts.length - 1].text || "";
    }

    // Bersihkan tag markdown jika ada
    const cleanJson = candidateText
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    // Parse dengan fungsi kebal error
    const parsedData = safelyParseJSON(cleanJson);

    if (!parsedData) {
      throw new Error("Gagal mengurai teks struk.");
    }

    return NextResponse.json(parsedData);
  } catch (err: any) {
    console.error("API Scan Error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal memproses struk." },
      { status: 500 }
    );
  }
}