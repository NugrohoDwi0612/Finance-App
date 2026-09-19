export type AccentColor =
  | "indigo"
  | "violet"
  | "emerald"
  | "teal"
  | "rose"
  | "amber"
  | "monochrome";

export interface ColorPreset {
  id: AccentColor;
  name: string;
  tagline: string;
  primaryHex: string;
  secondaryHex: string;
  bgGradient: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  accentText: string;
  activeNavBg: string;
  activeNavText: string;
  btnPrimary: string;
  ringColor: string;
  glowColor: string;
}

export const COLOR_PRESETS: ColorPreset[] = [
  {
    id: "indigo",
    name: "Electric Indigo",
    tagline: "Gaya Neobank Global (Revolut & Stripe)",
    primaryHex: "#4f46e5",
    secondaryHex: "#3b82f6",
    bgGradient: "from-indigo-600 to-blue-500",
    badgeBg: "bg-indigo-500/10 dark:bg-indigo-500/20",
    badgeText: "text-indigo-600 dark:text-indigo-400",
    badgeBorder: "border-indigo-500/20",
    accentText: "text-indigo-600 dark:text-indigo-400",
    activeNavBg: "bg-indigo-500/20",
    activeNavText: "text-indigo-400",
    btnPrimary:
      "bg-linear-to-r from-indigo-600 to-blue-500 hover:from-indigo-500 hover:to-blue-400 text-white shadow-indigo-600/30",
    ringColor: "ring-indigo-500/40",
    glowColor: "bg-indigo-500/15",
  },
  {
    id: "violet",
    name: "Obsidian Violet",
    tagline: "Futuristik & Mewah (Cash App & Web3)",
    primaryHex: "#7c3aed",
    secondaryHex: "#9333ea",
    bgGradient: "from-violet-600 to-purple-600",
    badgeBg: "bg-violet-500/10 dark:bg-violet-500/20",
    badgeText: "text-violet-600 dark:text-violet-400",
    badgeBorder: "border-violet-500/20",
    accentText: "text-violet-600 dark:text-violet-400",
    activeNavBg: "bg-violet-500/20",
    activeNavText: "text-violet-400",
    btnPrimary:
      "bg-linear-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-violet-600/30",
    ringColor: "ring-violet-500/40",
    glowColor: "bg-violet-500/15",
  },
  {
    id: "emerald",
    name: "Emerald Mint",
    tagline: "Segar & Bersih (Modern Fintech)",
    primaryHex: "#10b981",
    secondaryHex: "#059669",
    bgGradient: "from-emerald-500 to-teal-500",
    badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/20",
    badgeText: "text-emerald-600 dark:text-emerald-400",
    badgeBorder: "border-emerald-500/20",
    accentText: "text-emerald-600 dark:text-emerald-400",
    activeNavBg: "bg-emerald-500/20",
    activeNavText: "text-emerald-400",
    btnPrimary:
      "bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-stone-950 shadow-emerald-500/30",
    ringColor: "ring-emerald-500/40",
    glowColor: "bg-emerald-500/15",
  },
  {
    id: "teal",
    name: "Nordic Teal",
    tagline: "Tenang, Presisi & Terpercaya",
    primaryHex: "#0d9488",
    secondaryHex: "#0891b2",
    bgGradient: "from-teal-600 to-cyan-600",
    badgeBg: "bg-teal-500/10 dark:bg-teal-500/20",
    badgeText: "text-teal-600 dark:text-teal-400",
    badgeBorder: "border-teal-500/20",
    accentText: "text-teal-600 dark:text-teal-400",
    activeNavBg: "bg-teal-500/20",
    activeNavText: "text-teal-400",
    btnPrimary:
      "bg-linear-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white shadow-teal-600/30",
    ringColor: "ring-teal-500/40",
    glowColor: "bg-teal-500/15",
  },
  {
    id: "rose",
    name: "Sunset Coral",
    tagline: "Hangat & Enerjik (Monzo Style)",
    primaryHex: "#f43f5e",
    secondaryHex: "#fb7185",
    bgGradient: "from-rose-500 to-pink-500",
    badgeBg: "bg-rose-500/10 dark:bg-rose-500/20",
    badgeText: "text-rose-600 dark:text-rose-400",
    badgeBorder: "border-rose-500/20",
    accentText: "text-rose-600 dark:text-rose-400",
    activeNavBg: "bg-rose-500/20",
    activeNavText: "text-rose-400",
    btnPrimary:
      "bg-linear-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white shadow-rose-500/30",
    ringColor: "ring-rose-500/40",
    glowColor: "bg-rose-500/15",
  },
  {
    id: "amber",
    name: "Champagne Gold",
    tagline: "Eksklusif & Premium Private Wealth",
    primaryHex: "#d97706",
    secondaryHex: "#f59e0b",
    bgGradient: "from-amber-500 to-yellow-500",
    badgeBg: "bg-amber-500/10 dark:bg-amber-500/20",
    badgeText: "text-amber-700 dark:text-amber-400",
    badgeBorder: "border-amber-500/20",
    accentText: "text-amber-600 dark:text-amber-400",
    activeNavBg: "bg-amber-500/20",
    activeNavText: "text-amber-400",
    btnPrimary:
      "bg-linear-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-950 shadow-amber-500/30",
    ringColor: "ring-amber-500/40",
    glowColor: "bg-amber-500/15",
  },
  {
    id: "monochrome",
    name: "Titanium Slate",
    tagline: "Ultra Minimalis Monokrom (Apple Card)",
    primaryHex: "#3f3f46",
    secondaryHex: "#18181b",
    bgGradient: "from-stone-800 to-stone-950",
    badgeBg: "bg-stone-500/10 dark:bg-stone-400/15",
    badgeText: "text-stone-800 dark:text-stone-200",
    badgeBorder: "border-stone-400/25",
    accentText: "text-stone-900 dark:text-stone-100",
    activeNavBg: "bg-white/20",
    activeNavText: "text-white",
    btnPrimary:
      "bg-stone-900 dark:bg-white text-white dark:text-stone-950 hover:opacity-90 shadow-stone-900/30",
    ringColor: "ring-stone-400/40",
    glowColor: "bg-stone-500/15",
  },
];
