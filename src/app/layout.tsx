import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

// Penyesuaian Viewport untuk PWA (Support Notch iPhone & Android)
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f4" },
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // Wajib cover agar mengisi layar penuh
};

export const metadata: Metadata = {
  title: "CatatUang - Manajemen Keuangan",
  description: "Kelola keuangan pribadi dengan mudah dan cerdas",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default", // Ubah ke default agar tidak menabrak status bar hitam di iOS
    title: "CatatUang",
  },
  formatDetection: {
    telephone: false, // Mencegah angka di struk berubah jadi link telepon biru di Safari
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.className} bg-stone-200 dark:bg-stone-950 text-stone-900 dark:text-stone-100 antialiased overflow-hidden overscroll-none`}
        suppressHydrationWarning
      >
        {/* Kontainer utama menggunakan fixed inset-0 agar 100% terkunci di layar */}
        <div className="mx-auto fixed inset-0 max-w-md flex flex-col bg-stone-50 dark:bg-stone-900 shadow-2xl overflow-hidden">
          <Toaster
            position="top-center"
            richColors
            theme="system"
            closeButton
          />
          {children}
        </div>
      </body>
    </html>
  );
}
