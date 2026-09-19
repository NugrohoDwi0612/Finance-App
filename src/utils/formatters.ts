export const formatRupiah = (
  amount: number,
  hideAmount: boolean = false,
  currency: string = "IDR",
): string => {
  if (hideAmount) {
    return "Rp •••••••";
  }

  if (currency === "USD") {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 2,
    }).format(amount);
  }

  if (currency === "SGD") {
    return new Intl.NumberFormat("en-SG", {
      style: "currency",
      currency: "SGD",
      maximumFractionDigits: 2,
    }).format(amount);
  }

  if (currency === "EUR") {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 2,
    }).format(amount);
  }

  if (currency === "JPY") {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const parseSmartMoneyInput = (value: string | number): number => {
  if (!value) return 0;
  const str = String(value);
  const cleanValue = str.replace(/\D/g, "");
  return cleanValue ? parseInt(cleanValue, 10) : 0;
};

export const formatMoneyInput = (value: string | number): string => {
  if (value === null || value === undefined) return "";
  const str =
    typeof value === "number" ? Math.round(value).toString() : String(value);
  const cleanValue = str.replace(/\D/g, "");
  if (!cleanValue) return "";
  return new Intl.NumberFormat("id-ID").format(parseInt(cleanValue, 10));
};

export const formatDateID = (
  dateStr: string,
  options?: { includeTime?: boolean; short?: boolean },
): string => {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    if (options?.short) {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }).format(date);
    }

    if (options?.includeTime) {
      return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    }

    return new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return dateStr;
  }
};

export const isSameDay = (d1: Date, d2: Date): boolean => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export const getDaysRemaining = (targetDateStr: string): number => {
  const target = new Date(targetDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diffTime = target.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const generateWhatsAppSplitBillText = (
  billTitle: string,
  personName: string,
  items: { name: string; price: number }[],
  taxAmount: number,
  serviceAmount: number,
  total: number,
  bankInfo: string,
): string => {
  let text = `Halo *${personName}*! 👋\n`;
  text += `Ini rincian patungan untuk *${billTitle}*:\n\n`;

  if (items.length > 0) {
    text += `📋 *Pesanan Kamu:*\n`;
    items.forEach((item) => {
      text += `• ${item.name}: ${formatRupiah(item.price)}\n`;
    });
  }

  if (taxAmount > 0 || serviceAmount > 0) {
    text += `\n*Biaya Tambahan (Proporsional):*\n`;
    if (taxAmount > 0) text += `• Pajak (PB1): ${formatRupiah(taxAmount)}\n`;
    if (serviceAmount > 0)
      text += `• Service: ${formatRupiah(serviceAmount)}\n`;
  }

  text += `\n💰 *Total yang harus ditransfer:* *${formatRupiah(total)}*\n\n`;

  if (bankInfo) {
    text += `💳 *Pembayaran via:*\n${bankInfo}\n\n`;
  }

  text += `Terima kasih banyak! 🙏✨`;
  return encodeURIComponent(text);
};
