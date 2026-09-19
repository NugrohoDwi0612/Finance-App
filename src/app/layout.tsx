import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f4" }, // Warna bg-stone-100 saat Light Mode
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" }, // Warna bg-stone-950 saat Dark Mode
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // Wajib "cover" agar mengisi layar iPhone penuh hingga ujung poni
};

export const metadata: Metadata = {
  title: "CatatUang - Manajemen Keuangan",
  description: "Kelola keuangan pribadi dengan mudah dan cerdas",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent", // Wajib agar tidak ada balok warna aneh di atas/bawah
    title: "CatatUang",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="dark" suppressHydrationWarning>
      {/* overscroll-none untuk mencegah efek membal karet khas iPhone di layar luar */}
      <body
        className={`${inter.className} bg-stone-200 dark:bg-stone-950 text-stone-900 dark:text-stone-100 antialiased overflow-hidden transition-colors duration-300 overscroll-none`}
        suppressHydrationWarning
      >
        {/* Frame Mobile Dinamis. Menggunakan 100vh fallback untuk HP lama dan 100dvh untuk HP modern */}
        <div className="mx-auto flex h-[100vh] h-[100dvh] max-w-md flex-col bg-stone-50 dark:bg-stone-900 shadow-2xl relative overflow-hidden transition-colors duration-300">
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
