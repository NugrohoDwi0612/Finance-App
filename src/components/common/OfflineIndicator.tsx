"use client";

import React from "react";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { Badge } from "../ui/badge";

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-2 left-1/2 -translate-x-1/2 z-40">
      <Badge
        variant="destructive"
        className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-semibold px-3 py-1 shadow-lg gap-1.5 animate-pulse cursor-default"
      >
        <WifiOff className="w-3.5 h-3.5" />
        <span>Mode Offline — Data tersimpan lokal di perangkat</span>
      </Badge>
    </div>
  );
};
