import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

// Penyesuaian Viewport untuk PWA (Support Notch iPhone & Android)
export const viewport: Viewport = {
  // KUNCI PERBAIKAN: Gunakan #09090b yang sama persis dengan warna bg-stone-950 Tailwind
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" }, // stone-50
    { media: "(prefers-color-scheme: dark)", color: "#09090b" }, // stone-950
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Finance App - Manajemen Keuangan",
  description: "Kelola keuangan pribadi dengan mudah dan cerdas",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    // KUNCI PERBAIKAN: "black-translucent" memaksa konten tembus pandang ke ujung poni
    statusBarStyle: "black-translucent",
    title: "Finance App",
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
        className={`${inter.className} bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 antialiased overscroll-none`}
        style={{
          paddingTop: "env(safe-area-inset-top)",
          paddingBottom: "env(safe-area-inset-bottom)",
          paddingLeft: "env(safe-area-inset-left)",
          paddingRight: "env(safe-area-inset-right)",
        }}
        suppressHydrationWarning
      >
        <div className="mx-auto fixed max-w-md flex flex-col bg-stone-50 dark:bg-stone-950 shadow-2xl overflow-hidden transition-colors duration-300"
          style={{
            top: "env(safe-area-inset-top)",
            bottom: "env(safe-area-inset-bottom)",
            left: "env(safe-area-inset-left)",
            right: "env(safe-area-inset-right)",
          }}
        >
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
