"use client";

import { Camera, ExternalLink, Minus, Pencil, Plus } from "lucide-react";
import type { CategoryDef, MediaItem } from "@/lib/types";

interface CatalogCardProps {
  item: MediaItem;
  category: CategoryDef;
  isSelected: boolean;
  isAdmin: boolean;
  onSelect: () => void;
  onOpenModal: () => void;
  onQuickUpdate?: (updated: MediaItem) => void;
  onChangePoster?: (item: MediaItem) => void;
  onEditItem?: (item: MediaItem) => void;
}

export function formatPluses(rating: number): string {
  if (!rating || rating <= 0) return "";
  return "+".repeat(Math.min(rating, 5));
}

export function CatalogCard({
  item,
  category,
  isSelected,
  isAdmin,
  onSelect,
  onOpenModal,
  onQuickUpdate,
  onChangePoster,
  onEditItem,
}: CatalogCardProps) {
  const accent = category.accent;
  const pluses = formatPluses(item.rating);

  function bumpMetric(delta: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (!onQuickUpdate) return;
    if (category.kind === "book") {
      const nextRead = Math.max(0, (item.pagesRead || 0) + delta * 10);
      const capped = item.pagesTotal ? Math.min(item.pagesTotal, nextRead) : nextRead;
      onQuickUpdate({ ...item, pagesRead: capped });
    } else {
      const nextEps = Math.max(0, (item.episodes || 0) + delta);
      onQuickUpdate({ ...item, episodes: nextEps });
    }
  }

  function cycleRating(e: React.MouseEvent) {
    e.stopPropagation();
    if (!isAdmin || !onQuickUpdate) return;
    const next = ((item.rating || 0) + 1) % 5;
    onQuickUpdate({ ...item, rating: next });
  }

  // Guitar category uses crisp wide minimal cards (chords + skill status + vinyl emblem)
  if (category.kind === "guitar") {
    const isConfident = item.skillStatus === "Уверенно";
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onSelect}
        onDoubleClick={onOpenModal}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
        style={{
          borderColor: isSelected ? accent : "#2A2D36",
        }}
        className="group relative flex w-full cursor-pointer items-center gap-3.5 rounded-xl border bg-[#15171B] p-3 text-left transition-colors hover:border-[#404554] hover:bg-[#191B21]"
      >
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
          {isAdmin && onChangePoster && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChangePoster(item);
              }}
              title="Сменить обложку"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#343844] bg-[#131417]/90 text-[#ECEAE4] hover:bg-[#24272E]"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          )}
          {isAdmin && onEditItem && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEditItem(item);
              }}
              title="Редактировать"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#343844] bg-[#131417]/90 text-[#ECEAE4] hover:bg-[#24272E]"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          {item.linkUrl && (
            <a
              href={item.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              title="Открыть ссылку"
              style={{ color: accent }}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-[#343844] bg-[#131417]/90 transition-colors hover:bg-[#24272E]"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>

        {/* Cover or minimalist vinyl disc */}
        <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#2A2D36] bg-[#1F2127]">
          {item.poster ? (
            <img
              src={item.poster}
              alt={item.title}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#4B505E] bg-[#131417]">
              <div
                style={{ backgroundColor: isConfident ? accent : "#646975" }}
                className="h-3 w-3 rounded-full"
              />
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="font-mono-ui truncate pr-16 text-[10px] font-bold tracking-wider text-[#8B909C] uppercase">
            {item.artist || "Исполнитель"}
          </div>
          <div
            style={isSelected ? { color: accent } : undefined}
            className="truncate text-[15px] font-semibold text-[#ECEAE4] transition-colors"
          >
            {item.title}
          </div>
          {item.chords && (
            <div className="font-mono-ui w-fit max-w-full truncate rounded border border-[#2A2D36] bg-[#1B1D22] px-2 py-0.5 text-[11px] text-[#D4D2CC]">
              {item.chords}
            </div>
          )}
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={(e) => {
                if (!isAdmin || !onQuickUpdate) return;
                e.stopPropagation();
                const order = ["Уверенно", "Учу", "В планах"];
                const next = order[(order.indexOf(item.skillStatus || "Уверенно") + 1) % order.length];
                onQuickUpdate({ ...item, skillStatus: next });
              }}
              style={
                isConfident
                  ? { backgroundColor: accent, color: category.accentFg }
                  : undefined
              }
              title={isAdmin ? "Нажми, чтобы сменить статус" : undefined}
              className={`font-mono-ui rounded px-2 py-0.5 text-[10px] font-bold ${
                isAdmin ? "cursor-pointer hover:opacity-90" : ""
              } ${isConfident ? "" : "bg-[#24272E] text-[#9DA2AE]"}`}
            >
              {item.skillStatus || "В списке"}
            </button>
            <button
              type="button"
              onClick={cycleRating}
              disabled={!isAdmin}
              style={{ color: pluses ? accent : "#4E5360" }}
              title={isAdmin ? "Клик — изменить оценку" : undefined}
              className={`font-mono-ui text-right text-[15px] font-bold tracking-widest ${
                isAdmin ? "cursor-pointer hover:brightness-125" : "cursor-default"
              }`}
            >
              {pluses || "—"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Primary visual metric badge on the left under title
  let leftMetric = "";
  const canStepMetric =
    category.kind === "anime" ||
    category.kind === "series" ||
    category.kind === "book" ||
    category.kind === "custom";

  if (category.kind === "book") {
    const r = item.pagesRead ?? 0;
    const t = item.pagesTotal ?? 0;
    leftMetric = t > 0 ? `${r}/${t} стр.` : `${r} стр.`;
  } else if (category.kind === "movie") {
    leftMetric = item.duration || (item.year ? String(item.year) : "Фильм");
  } else if (category.kind === "series") {
    const s = item.seasons ? `${item.seasons}с · ` : "";
    leftMetric = `${s}${item.episodes || 1} эп.`;
  } else {
    leftMetric = item.episodes ? `${item.episodes} эп.` : "1 эп.";
  }

  const bookProgress =
    category.kind === "book" && item.pagesTotal && item.pagesTotal > 0
      ? Math.min(100, Math.round(((item.pagesRead || 0) / item.pagesTotal) * 100))
      : null;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onDoubleClick={onOpenModal}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className="group flex w-full cursor-pointer flex-col text-left focus-visible:outline-none"
    >
      {/* Large 2:3 Poster Frame */}
      <div
        style={{
          borderColor: isSelected ? accent : "#2A2D36",
          borderWidth: isSelected ? "2px" : "1px",
        }}
        className="relative aspect-[2/3] w-full overflow-hidden rounded-lg bg-[#15171B] transition-colors group-hover:border-[#494E5E]"
      >
        {item.poster ? (
          <img
            src={item.poster}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition-opacity duration-200 group-hover:opacity-92"
          />
        ) : (
          <div className="relative flex h-full w-full flex-col justify-between bg-[#16191F] p-3.5">
            {category.kind === "book" && (
              <div
                style={{ backgroundColor: accent }}
                className="absolute top-0 bottom-0 left-0 w-2 opacity-85"
              />
            )}
            <div
              style={{ color: accent }}
              className="font-mono-ui pl-1.5 text-[10px] font-bold tracking-wider uppercase"
            >
              {item.author || item.studio || item.year || category.label}
            </div>
            <div className="line-clamp-4 pl-1.5 text-base font-bold leading-snug text-[#ECEAE4]">
              {item.title}
            </div>
            <div className="font-mono-ui pl-1.5 text-[10px] text-[#646975]">
              {item.origTitle || "без обложки"}
            </div>
          </div>
        )}

        {/* Inline Admin Overlay Controls on Poster (Change Photo + Edit) */}
        {isAdmin && (
          <div className="absolute top-2 left-2 flex items-center gap-1 opacity-90 transition-opacity group-hover:opacity-100">
            {onChangePoster && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChangePoster(item);
                }}
                title="Сменить постер"
                style={{ borderColor: accent, color: accent }}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border bg-[#131417]/90 transition-colors hover:bg-[#1B1D22]"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            )}
            {onEditItem && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditItem(item);
                }}
                title="Редактировать"
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#343844] bg-[#131417]/90 text-[#ECEAE4] transition-colors hover:bg-[#1B1D22]"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
          </div>
        )}

        {/* Book external link quick button */}
        {item.linkUrl && (
          <a
            href={item.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            title="Открыть ссылку"
            style={{ color: accent }}
            className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-md border border-[#343844] bg-[#131417]/90 transition-colors hover:bg-[#1B1D22]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}

        {/* Rewatch corner badge (only if > 1 and no linkUrl occupying top-right) */}
        {!item.linkUrl && item.rewatch && item.rewatch > 1 && (
          <div className="font-mono-ui absolute top-2 right-2 rounded-[5px] border border-[#343844] bg-[#131417]/90 px-1.5 py-0.5 text-[11px] font-bold text-[#ECEAE4]">
            {item.rewatch}×
          </div>
        )}

        {/* Book reading progress bar at bottom of cover */}
        {bookProgress !== null && (
          <div className="absolute right-2.5 bottom-2.5 left-2.5 h-1.5 overflow-hidden rounded-full bg-[#0E1013]/85">
            <div
              style={{ width: `${bookProgress}%`, backgroundColor: accent }}
              className="h-full rounded-full"
            />
          </div>
        )}
      </div>

      {/* Title */}
      <div
        style={isSelected ? { color: accent } : undefined}
        title={item.title}
        className="mt-2 truncate text-[14px] font-semibold leading-tight text-[#ECEAE4] transition-colors group-hover:text-white"
      >
        {item.title}
      </div>

      {/* Prominent Left Episodes (with inline -/+ in admin mode!) + Prominent Right Pluses */}
      <div className="mt-1.5 flex items-center justify-between gap-1.5">
        <div className="flex shrink-0 items-center overflow-hidden rounded-[5px] border border-[#2A2D36] bg-[#15171B]">
          {isAdmin && canStepMetric && (
            <button
              type="button"
              onClick={(e) => bumpMetric(-1, e)}
              title={category.kind === "book" ? "-10 стр." : "-1 серия"}
              className="flex h-6 w-5 cursor-pointer items-center justify-center text-[#8B909C] transition-colors hover:bg-[#24272E] hover:text-white"
            >
              <Minus className="h-3 w-3" />
            </button>
          )}
          <span className="font-mono-ui px-2 py-0.5 text-[12px] font-bold text-[#ECEAE4]">
            {leftMetric}
          </span>
          {isAdmin && canStepMetric && (
            <button
              type="button"
              onClick={(e) => bumpMetric(1, e)}
              title={category.kind === "book" ? "+10 стр." : "+1 серия"}
              style={{ color: accent }}
              className="flex h-6 w-5 cursor-pointer items-center justify-center transition-colors hover:bg-[#24272E]"
            >
              <Plus className="h-3 w-3" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={cycleRating}
          disabled={!isAdmin}
          style={{ color: pluses ? accent : "#454A56" }}
          className={`font-mono-ui truncate text-right text-[15px] font-bold leading-none tracking-[0.12em] ${
            isAdmin ? "cursor-pointer hover:brightness-125" : "cursor-default"
          }`}
          title={
            isAdmin
              ? "Клик — переключить оценку (+)"
              : pluses
              ? `Оценка: ${pluses}`
              : "Без оценки"
          }
        >
          {pluses || "—"}
        </button>
      </div>
    </div>
  );
}
