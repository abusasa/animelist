"use client";

import { KeyRound, LogOut, Plus } from "lucide-react";
import type { CategoryDef } from "@/lib/types";

interface WaybarProps {
  categories: CategoryDef[];
  activeCategory: CategoryDef;
  itemCount: number;
  isAdmin: boolean;
  saveBadge?: string | null;
  onSelectCategory: (id: string) => void;
  onOpenAuthOrAdmin: () => void;
  onOpenAddModal: () => void;
  onLogout: () => void;
}

export function Waybar({
  categories,
  activeCategory,
  itemCount,
  isAdmin,
  saveBadge,
  onSelectCategory,
  onOpenAuthOrAdmin,
  onOpenAddModal,
  onLogout,
}: WaybarProps) {
  return (
    <header className="w-full shrink-0 px-2.5 pt-2.5 sm:px-4 sm:pt-3">
      <div className="flex h-11 items-center justify-between gap-2 rounded-lg border border-[#2A2D36] bg-[#1B1D22] px-2 sm:px-2.5">
        {/* Left: Category Workspaces + "abusamat's <slug>" right next to the last tab */}
        <nav
          aria-label="Категории"
          className="custom-scroll flex min-w-0 items-center gap-1.5 overflow-x-auto py-1"
        >
          {categories.map((cat) => {
            const active = cat.id === activeCategory.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                style={
                  active
                    ? { backgroundColor: cat.accent, color: cat.accentFg }
                    : undefined
                }
                className={`font-mono-ui shrink-0 cursor-pointer rounded-[5px] px-2.5 py-1 text-[11px] font-bold tracking-wide transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 ${
                  active
                    ? ""
                    : "bg-[#24272E] text-[#9DA2AE] hover:bg-[#2C303A] hover:text-[#ECEAE4]"
                }`}
              >
                {cat.label}
              </button>
            );
          })}

          {/* Placed right after ГИТАРКА with the same tight gap (~4-6px), hides cleanly on narrow screens */}
          <span className="font-mono-ui hidden shrink-0 select-none pl-0.5 text-xs font-bold tracking-wide text-[#ECEAE4] md:inline-block">
            abusamat&apos;s {activeCategory.slug}
          </span>
        </nav>

        {/* Right: Save feedback + Count + Add (admin) + Lock/Logout */}
        <div className="flex shrink-0 items-center gap-1.5">
          {saveBadge && (
            <span
              style={{ color: activeCategory.accent }}
              className="font-mono-ui hidden text-[10px] font-bold sm:inline-block"
            >
              {saveBadge}
            </span>
          )}

          <div className="font-mono-ui hidden rounded-[5px] border border-[#2A2D36] bg-[#24272E] px-2.5 py-1 text-[11px] font-bold text-[#ECEAE4] sm:block">
            {itemCount} {activeCategory.unit}
          </div>

          {isAdmin ? (
            <>
              <button
                type="button"
                onClick={onOpenAddModal}
                title="Добавить запись или категорию"
                style={{
                  backgroundColor: activeCategory.accent,
                  color: activeCategory.accentFg,
                }}
                className="flex h-7 cursor-pointer items-center gap-1 rounded-[5px] px-2.5 text-[11px] font-bold transition-opacity hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                <span className="font-mono-ui hidden sm:inline">ДОБАВИТЬ</span>
              </button>
              <button
                type="button"
                onClick={onLogout}
                title="Выйти из режима редактирования"
                aria-label="Выйти из админки"
                className="flex h-7 w-8 cursor-pointer items-center justify-center rounded-[5px] border border-[#343844] bg-[#24272E] text-[#9DA2AE] transition-colors hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthOrAdmin}
              title="Вход по паролю"
              aria-label="Вход по паролю"
              style={{
                backgroundColor: `color-mix(in srgb, ${activeCategory.accent} 14%, #15171B)`,
                borderColor: `color-mix(in srgb, ${activeCategory.accent} 40%, #2A2D36)`,
                color: activeCategory.accent,
              }}
              className="flex h-7 w-8 cursor-pointer items-center justify-center rounded-[5px] border transition-colors hover:brightness-110"
            >
              <KeyRound className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
