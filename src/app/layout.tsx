import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#0c0a09",
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
    statusBarStyle: "black-translucent",
    title: "CatatUang",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning mencegah error dari ekstensi Chrome
    <html lang="id" className="dark" suppressHydrationWarning>
      <body
        // 2. Body dinamis: Abu-abu di mode terang, Hitam di mode gelap
        className={`${inter.className} bg-stone-200 dark:bg-stone-950 text-stone-900 dark:text-stone-100 antialiased overflow-hidden transition-colors duration-200`}
        suppressHydrationWarning
      >
        {/* 3. Frame Mobile: Putih di mode terang, Gelap di mode gelap */}
        <div className="mx-auto flex h-[100dvh] max-w-md flex-col bg-stone-50 dark:bg-stone-900 border-x border-stone-200/80 dark:border-stone-800/80 shadow-2xl relative overflow-hidden transition-colors duration-200">
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
