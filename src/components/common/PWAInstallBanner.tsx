"use client";

import React, { useState } from "react";
import { Download, Share2, PlusSquare, X } from "lucide-react";
import { usePWAInstall } from "../../hooks/usePWAInstall";
import { Button } from "../ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";

export const PWAInstallBanner: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (isInstalled || dismissed) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-stone-900 to-stone-950 text-white px-4 py-2.5 flex items-center justify-between shadow-md text-xs border-b border-stone-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white shrink-0">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-stone-100">
              Pasang Aplikasi CatatUang
            </p>
            <p className="text-[11px] text-stone-400">
              Akses instan dari layar utama & offline
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {isInstallable && (
            <Button
              size="sm"
              onClick={install}
              className="bg-white text-stone-900 hover:bg-stone-200 font-bold h-7 px-3 text-xs"
            >
              Install
            </Button>
          )}

          {isIOS && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowIOSModal(true)}
              className="text-stone-900 bg-white hover:bg-stone-100 font-bold h-7 px-2.5 text-xs"
            >
              Petunjuk iOS
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDismissed(true)}
            className="w-7 h-7 text-stone-400 hover:text-white"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <Card className="w-full max-w-sm shadow-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-bold">
                Pasang di iPhone / iPad
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowIOSModal(false)}
                className="w-7 h-7"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <div className="flex items-start gap-3 bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl">
                <div className="w-6 h-6 rounded-md bg-stone-200 dark:bg-stone-700 flex items-center justify-center shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <p>
                  1. Ketuk tombol <strong>Bagikan (Share)</strong> di bar bawah
                  Safari browser.
                </p>
              </div>
              <div className="flex items-start gap-3 bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl">
                <div className="w-6 h-6 rounded-md bg-stone-200 dark:bg-stone-700 flex items-center justify-center shrink-0">
                  <PlusSquare className="w-4 h-4" />
                </div>
                <p>
                  2. Gulir ke bawah lalu pilih opsi{" "}
                  <strong>Tambah ke Layar Utama (Add to Home Screen)</strong>.
                </p>
              </div>
              <div className="flex items-start gap-3 bg-stone-50 dark:bg-stone-800/60 p-3 rounded-xl">
                <div className="w-6 h-6 rounded-md bg-stone-200 dark:bg-stone-700 flex items-center justify-center shrink-0">
                  <span className="font-bold text-xs">OK</span>
                </div>
                <p>
                  3. Ketuk <strong>Tambah (Add)</strong> di pojok kanan atas.
                  Aplikasi siap digunakan seperti aplikasi App Store!
                </p>
              </div>

              <Button
                onClick={() => setShowIOSModal(false)}
                className="w-full mt-2"
                size="sm"
              >
                Mengerti
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};
