"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Home, Search, Plus, BarChart2, User } from "lucide-react";
import { TabType } from "@/types"; // <-- Dirapikan path aliasnya
import { useApp } from "@/context/AppContext";

export type { TabType };

interface BottomNavProps {
  currentTab?: TabType | string;
  onSelectTab?: (tab: TabType) => void;
  onOpenAddTransaction?: () => void;
  onOpenAddModal?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab = "dashboard",
  onSelectTab = (_tab: TabType) => {},
  onOpenAddTransaction,
  onOpenAddModal,
}) => {
  const { colorPreset, user, theme, navSettings } = useApp();
  const handleOpenAdd = onOpenAddTransaction || onOpenAddModal || (() => {});

  // Determine active slot index (0: Home, 1: Search/Tx, 2: Add, 3: Analytics, 4: More/Profile)
  const getSlotIndexFromTab = (tab?: string): number => {
    if (tab === "dashboard") return 0;
    if (tab === "transactions") return 1;
    if (tab === "analytics") return 3;
    return 4; // 'more', 'profile', 'wallets', 'categories', 'debts', 'recurring', 'smart', 'budgets'
  };

  const activeSlotIndex = getSlotIndexFromTab(currentTab);

  const isDocked = navSettings?.styleVariant === "docked";
  const showLabels = Boolean(navSettings?.showLabels);
  const showAvatar = navSettings?.showProfileAvatar !== false;

  // Refs and dynamic measurement for mathematical alignment
  const navContainerRef = useRef<HTMLElement | null>(null);
  const navInnerRef = useRef<HTMLDivElement | null>(null);
  const slotRefs = useRef<(HTMLButtonElement | HTMLDivElement | null)[]>([]);
  const [slotPositions, setSlotPositions] = useState<number[]>([0, 0, 0, 0, 0]);
  const [glassWidth, setGlassWidth] = useState<number>(60);

  // Dragging states
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragCenterX, setDragCenterX] = useState<number | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);

  const pointerStartRef = useRef<{
    x: number;
    y: number;
    originCenter: number;
    active: boolean;
  }>({
    x: 0,
    y: 0,
    originCenter: 0,
    active: false,
  });

  const dragDistanceRef = useRef<number>(0);

  // Measure positions of all 5 slots
  const measureSlots = useCallback(() => {
    const container = navInnerRef.current || navContainerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const positions: number[] = [];
    let computedGlassWidth = 56;

    slotRefs.current.forEach((el, index) => {
      if (el) {
        const rect = el.getBoundingClientRect();
        const center = rect.left - containerRect.left + rect.width / 2;
        positions.push(center);
        if (index === 0 && rect.width > 0) {
          computedGlassWidth = isDocked
            ? Math.min(Math.max(rect.width * 0.78, 48), 62)
            : Math.min(Math.max(rect.width * 0.94, 52), 68);
        }
      } else {
        const step = containerRect.width / 5;
        positions.push((index + 0.5) * step);
      }
    });

    if (positions.length === 5) {
      setSlotPositions(positions);
      setGlassWidth(computedGlassWidth);
    }
  }, [isDocked]);

  useEffect(() => {
    measureSlots();
    window.addEventListener("resize", measureSlots);
    const observer = new ResizeObserver(() => measureSlots());
    if (navContainerRef.current) observer.observe(navContainerRef.current);
    if (navInnerRef.current) observer.observe(navInnerRef.current);
    return () => {
      window.removeEventListener("resize", measureSlots);
      observer.disconnect();
    };
  }, [measureSlots]);

  // Re-measure dynamically when docked variant or tabs change
  useEffect(() => {
    const timer = setTimeout(() => {
      measureSlots();
    }, 40);
    return () => clearTimeout(timer);
  }, [isDocked, showLabels, showAvatar, currentTab, measureSlots]);

  // Execute tab/slot selection
  const selectSlot = useCallback(
    (index: number) => {
      if (index === 0) onSelectTab("dashboard");
      else if (index === 1) onSelectTab("transactions");
      else if (index === 2) handleOpenAdd();
      else if (index === 3) onSelectTab("analytics");
      else if (index === 4) onSelectTab("more");
    },
    [onSelectTab, handleOpenAdd],
  );

  // Pointer gesture handlers for dragging the oval glass across menus
  const handlePointerDown = (e: React.PointerEvent) => {
    const container = navInnerRef.current || navContainerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const currentCenter =
      slotPositions[activeSlotIndex] || containerRect.width / 2;

    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      originCenter: currentCenter,
      active: true,
    };
    dragDistanceRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const container = navInnerRef.current || navContainerRef.current;
    if (!pointerStartRef.current.active || !container) return;
    const containerRect = container.getBoundingClientRect();
    const deltaX = e.clientX - pointerStartRef.current.x;
    const deltaY = e.clientY - pointerStartRef.current.y;
    dragDistanceRef.current = Math.hypot(deltaX, deltaY);

    if (dragDistanceRef.current > 8) {
      if (!isDragging) {
        setIsDragging(true);
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {}
      }

      const halfGlass = glassWidth / 2;
      const minCenter = halfGlass + 4;
      const maxCenter = containerRect.width - halfGlass - 4;

      const newCenterX = Math.max(
        minCenter,
        Math.min(maxCenter, pointerStartRef.current.originCenter + deltaX),
      );
      setDragCenterX(newCenterX);

      let nearestIndex = activeSlotIndex;
      let minDistance = Infinity;
      slotPositions.forEach((pos, idx) => {
        const dist = Math.abs(pos - newCenterX);
        if (dist < minDistance) {
          minDistance = dist;
          nearestIndex = idx;
        }
      });

      setHoveredSlot(nearestIndex);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!pointerStartRef.current.active) return;
    pointerStartRef.current.active = false;

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    const container = navInnerRef.current || navContainerRef.current;

    if (isDragging && hoveredSlot !== null) {
      selectSlot(hoveredSlot);
    } else if (!isDragging && dragDistanceRef.current <= 8 && container) {
      const containerRect = container.getBoundingClientRect();
      const relativeX = e.clientX - containerRect.left;

      let closestSlot = activeSlotIndex;
      let closestDist = Infinity;
      slotPositions.forEach((pos, idx) => {
        const dist = Math.abs(pos - relativeX);
        if (dist < closestDist) {
          closestDist = dist;
          closestSlot = idx;
        }
      });

      if (closestDist < 70) {
        selectSlot(closestSlot);
      }
    }

    setIsDragging(false);
    setDragCenterX(null);
    setHoveredSlot(null);
  };

  const handlePointerCancel = () => {
    pointerStartRef.current.active = false;
    setIsDragging(false);
    setDragCenterX(null);
    setHoveredSlot(null);
  };

  const handleSlotClick = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    if (dragDistanceRef.current > 8) return;
    selectSlot(index);
  };

  const transparencyVal = navSettings?.transparency ?? 25;
  const alpha = Math.min(1, Math.max(0, transparencyVal / 100));

  const blurClasses = {
    none: "backdrop-blur-none",
    light: "backdrop-blur-md",
    medium: "backdrop-blur-xl",
    ultra:
      "backdrop-blur-3xl [-webkit-backdrop-filter:blur(30px)_saturate(190%)_contrast(102%)]",
  }[navSettings?.blurIntensity || "ultra"];

  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);
  const glassBg = isDark
    ? `rgba(18, 18, 18, ${alpha})`
    : `rgba(255, 255, 255, ${alpha})`;

  const borderTopColor = isDark
    ? `rgba(255, 255, 255, ${Math.max(0.12, (1 - alpha * 0.5) * 0.25)})`
    : `rgba(255, 255, 255, ${Math.max(0.35, (1 - alpha * 0.3) * 0.85)})`;

  const borderAllColor = isDark
    ? `rgba(255, 255, 255, ${Math.max(0.08, alpha * 0.15)})`
    : `rgba(255, 255, 255, ${Math.max(0.2, alpha * 0.45)})`;

  const currentCenterX =
    isDragging && dragCenterX !== null
      ? dragCenterX
      : slotPositions[activeSlotIndex] ||
        (navInnerRef.current || navContainerRef.current
          ? (navInnerRef.current ||
              navContainerRef.current)!.getBoundingClientRect().width / 2
          : 50);

  const glassTargetLeft = currentCenterX - glassWidth / 2;
  const effectiveHighlightSlot = isDragging ? hoveredSlot : activeSlotIndex;

  return (
    <aside
      aria-label="Navigasi Bawah iPhone Liquid Glass"
      // KUNCI PERBAIKAN: Menambahkan env(safe-area-inset-bottom) langsung pada posisi bottom
      className={`fixed left-0 right-0 z-40 pointer-events-none flex justify-center transition-all duration-300 ${
        isDocked
          ? "bottom-0 px-0"
          : "bottom-safe-nav px-3.5 sm:px-4"
      }`}
    >
      <nav
        ref={(el) => {
          navContainerRef.current = el;
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        aria-label="Navigasi Utama Liquid Glass iPhone"
        style={{
          backgroundColor: glassBg,
          borderColor: borderAllColor,
          borderTopColor: borderTopColor,
        }}
        className={`pointer-events-auto relative transition-all duration-300 isolate flex flex-col justify-center shadow-2xl touch-none select-none ${blurClasses} ${
          isDocked
            ? "w-full max-w-md border-t border-b-0 border-x-0 sm:border-x border-stone-200/50 dark:border-stone-800/60 px-3 pt-1.5 pb-[max(0.65rem,env(safe-area-inset-bottom))] bg-opacity-90"
            : "w-full max-w-[390px] rounded-[32px] border px-2.5 py-1.5 shadow-[0_16px_40px_-8px_rgba(0,0,0,0.18),0_24px_50px_-12px_rgba(0,0,0,0.14),inset_0_1px_1.5px_0_rgba(255,255,255,0.75),inset_0_-1px_2px_0_rgba(0,0,0,0.06)] dark:shadow-[0_20px_48px_-8px_rgba(0,0,0,0.7),0_10px_24px_rgba(0,0,0,0.5),inset_0_1px_1.5px_0_rgba(255,255,255,0.22),inset_0_-1px_1.5px_0_rgba(0,0,0,0.4)]"
        }`}
      >
        {/* Specular Liquid Glare Reflection Sheen on Main Dock */}
        {!isDocked && (
          <div
            className="absolute inset-0 rounded-[32px] pointer-events-none overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 45%, rgba(255,255,255,0) 100%)",
            }}
          />
        )}

        <div
          ref={navInnerRef}
          className="relative w-full flex items-center justify-between"
        >
          {/* DRAGGABLE OVAL LIQUID GLASS ACTIVE LENS */}
          <div
            className="absolute top-1/2 -translate-y-1/2 pointer-events-none rounded-[22px] isolate z-10 overflow-hidden"
            style={{
              width: glassWidth,
              height: isDocked ? 40 : 46,
              left: 0,
              transform: `translate3d(${glassTargetLeft}px, 0, 0) scale(${isDragging ? 1.15 : 1})`,
              transition: isDragging
                ? "transform 0.04s linear, box-shadow 0.15s ease"
                : "transform 0.42s cubic-bezier(0.18, 0.9, 0.25, 1.22), box-shadow 0.3s ease",
              backgroundColor: isDark
                ? "rgba(255, 255, 255, 0.11)"
                : "rgba(255, 255, 255, 0.32)",
              border: isDark
                ? "1px solid rgba(255, 255, 255, 0.18)"
                : "1px solid rgba(255, 255, 255, 0.55)",
              boxShadow: isDragging
                ? isDark
                  ? "0 10px 24px -4px rgba(0,0,0,0.6), inset 0 1px 1.5px rgba(255,255,255,0.22)"
                  : "0 8px 20px -4px rgba(0,0,0,0.14), inset 0 1.5px 2px rgba(255,255,255,0.7)"
                : isDark
                  ? "0 4px 14px -2px rgba(0,0,0,0.4), inset 0 1px 1.5px rgba(255,255,255,0.16)"
                  : "0 4px 14px -2px rgba(0,0,0,0.08), inset 0 1px 1.5px rgba(255,255,255,0.65), inset 0 -1px 1px rgba(0,0,0,0.03)",
              backdropFilter: "blur(20px) saturate(170%)",
              WebkitBackdropFilter: "blur(20px) saturate(170%)",
              willChange: "transform",
            }}
          >
            <div
              className="absolute inset-0 rounded-[22px] pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.06) 60%, transparent 85%)",
              }}
            />
            <div className="absolute top-0 inset-x-2 h-[1px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
          </div>

          {/* 1. Home / Beranda */}
          <button
            ref={(el) => {
              slotRefs.current[0] = el;
            }}
            type="button"
            onClick={(e) => handleSlotClick(e, 0)}
            className={`relative z-20 flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl cursor-pointer transition-all duration-200 active:scale-90 ${
              effectiveHighlightSlot === 0
                ? "text-stone-950 dark:text-white font-bold scale-105"
                : "text-stone-500/80 dark:text-stone-400/80 hover:text-stone-950 dark:hover:text-white"
            }`}
            title="Beranda"
          >
            <Home
              className="w-5 h-5 transition-transform duration-200"
              strokeWidth={effectiveHighlightSlot === 0 ? 2.5 : 1.9}
              fill={effectiveHighlightSlot === 0 ? "currentColor" : "none"}
            />
            {showLabels && (
              <span className="text-[10px] font-semibold tracking-tight mt-0.5 leading-tight">
                Home
              </span>
            )}
          </button>

          {/* 2. Cari & Transaksi */}
          <button
            ref={(el) => {
              slotRefs.current[1] = el;
            }}
            type="button"
            onClick={(e) => handleSlotClick(e, 1)}
            className={`relative z-20 flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl cursor-pointer transition-all duration-200 active:scale-90 ${
              effectiveHighlightSlot === 1
                ? "text-stone-950 dark:text-white font-bold scale-105"
                : "text-stone-500/80 dark:text-stone-400/80 hover:text-stone-950 dark:hover:text-white"
            }`}
            title="Transaksi"
          >
            <Search
              className="w-5 h-5 transition-transform duration-200"
              strokeWidth={effectiveHighlightSlot === 1 ? 2.8 : 2}
            />
            {showLabels && (
              <span className="text-[10px] font-semibold tracking-tight mt-0.5 leading-tight">
                Transaksi
              </span>
            )}
          </button>

          {/* 3. Central Action Button (+ Catat) */}
          <div
            ref={(el) => {
              slotRefs.current[2] = el;
            }}
            className="relative z-20 px-1 flex items-center justify-center"
          >
            <button
              type="button"
              onClick={(e) => handleSlotClick(e, 2)}
              style={{
                background: `linear-gradient(135deg, ${colorPreset.primaryHex}, ${colorPreset.secondaryHex})`,
                boxShadow: `0 8px 20px -4px ${colorPreset.primaryHex}70, inset 0 1.5px 2px 0 rgba(255,255,255,0.65), inset 0 -2px 3px 0 rgba(0,0,0,0.25)`,
              }}
              className={`group relative w-10.5 h-10.5 sm:w-11 sm:h-11 rounded-[16px] text-white font-black flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105 active:scale-85 ring-1 ring-white/60 dark:ring-white/30 ${
                effectiveHighlightSlot === 2
                  ? "scale-110 ring-2 ring-white"
                  : ""
              }`}
              title="Catat Transaksi"
            >
              <div
                className="absolute inset-0 rounded-[16px] pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 20%, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.12) 50%, transparent 80%)",
                }}
              />
              <Plus className="relative z-10 w-5 h-5 stroke-[2.8] transition-transform duration-300 group-hover:rotate-90" />
            </button>
          </div>

          {/* 4. Laporan & Analitik */}
          <button
            ref={(el) => {
              slotRefs.current[3] = el;
            }}
            type="button"
            onClick={(e) => handleSlotClick(e, 3)}
            className={`relative z-20 flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl cursor-pointer transition-all duration-200 active:scale-90 ${
              effectiveHighlightSlot === 3
                ? "text-stone-950 dark:text-white font-bold scale-105"
                : "text-stone-500/80 dark:text-stone-400/80 hover:text-stone-950 dark:hover:text-white"
            }`}
            title="Laporan"
          >
            <BarChart2
              className="w-5 h-5 transition-transform duration-200"
              strokeWidth={effectiveHighlightSlot === 3 ? 2.6 : 2}
            />
            {showLabels && (
              <span className="text-[10px] font-semibold tracking-tight mt-0.5 leading-tight">
                Laporan
              </span>
            )}
          </button>

          {/* 5. Menu & Profil */}
          <button
            ref={(el) => {
              slotRefs.current[4] = el;
            }}
            type="button"
            onClick={(e) => handleSlotClick(e, 4)}
            className={`relative z-20 flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-2xl cursor-pointer transition-all duration-200 active:scale-90 ${
              effectiveHighlightSlot === 4
                ? "text-stone-950 dark:text-white font-bold scale-105"
                : "text-stone-500/80 dark:text-stone-400/80 hover:text-stone-950 dark:hover:text-white"
            }`}
            title="Profil"
          >
            {showAvatar && user?.avatarUrl ? (
              <div
                className={`w-6 h-6 rounded-full overflow-hidden transition-all duration-200 ${
                  effectiveHighlightSlot === 4
                    ? "ring-2 ring-offset-1 ring-stone-950 dark:ring-white ring-offset-transparent shadow-xs scale-105"
                    : "ring-1 ring-stone-300 dark:ring-stone-700 opacity-85 hover:opacity-100"
                }`}
              >
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <User
                className="w-5 h-5 transition-transform duration-200"
                strokeWidth={effectiveHighlightSlot === 4 ? 2.6 : 2}
              />
            )}

            {showLabels && (
              <span className="text-[10px] font-semibold tracking-tight mt-0.5 leading-tight">
                Profil
              </span>
            )}
          </button>
        </div>
      </nav>
    </aside>
  );
};
