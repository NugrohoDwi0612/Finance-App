import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "CatatUang - Manajemen Keuangan",
  description: "Kelola keuangan pribadi dengan mudah dan cerdas",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default", // Wajib "default" agar teks jam otomatis jadi HITAM saat layar putih!
    title: "CatatUang",
  },
  formatDetection: {
    telephone: false,
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
        className={`${inter.className} bg-stone-100 dark:bg-stone-950 text-stone-900 dark:text-stone-100 antialiased overflow-hidden overscroll-none`}
        suppressHydrationWarning
      >
        <div className="mx-auto fixed inset-0 max-w-md flex flex-col bg-stone-50 dark:bg-stone-950 shadow-2xl overflow-hidden transition-colors duration-300">
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
