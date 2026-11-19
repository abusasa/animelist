"use client";

import { useEffect, useState } from "react";
import { Camera, Check, Copy, ExternalLink, Minus, Pencil, Plus, X } from "lucide-react";
import type { CategoryDef, MediaItem } from "@/lib/types";
import { formatCommentText } from "@/lib/text";
import { formatPluses } from "./CatalogCard";

interface DetailModalProps {
  item: MediaItem;
  category: CategoryDef;
  isAdmin: boolean;
  onClose: () => void;
  onEdit: (item: MediaItem) => void;
  onQuickUpdate?: (updated: MediaItem) => void;
  onChangePoster?: (item: MediaItem) => void;
}

export function DetailModal({
  item,
  category,
  isAdmin,
  onClose,
  onEdit,
  onQuickUpdate,
  onChangePoster,
}: DetailModalProps) {
  const accent = category.accent;
  const [copied, setCopied] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(item.note || "");

  useEffect(() => {
    setNoteDraft(item.note || "");
    setEditingNote(false);
  }, [item.id, item.note]);

  function saveInlineNote() {
    if (!onQuickUpdate) return;
    onQuickUpdate({
      ...item,
      note: noteDraft.trim() ? formatCommentText(noteDraft.trim()) : undefined,
    });
    setEditingNote(false);
  }

  function copyLyrics() {
    if (!item.lyrics) return;
    navigator.clipboard?.writeText(item.lyrics).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Adaptive title size per screenshot #2: shrinks for very long titles while staying bold & prominent
  const titleSizeClass =
    item.title.length > 52
      ? "text-lg sm:text-xl"
      : item.title.length > 26
      ? "text-xl sm:text-2xl"
      : "text-2xl sm:text-[28px]";

  // 4 stat tiles adapted to category
  let stats: { label: string; value: string; accent?: boolean }[] = [];
  if (category.kind === "book") {
    stats = [
      { label: "СТРАНИЦ", value: item.pagesTotal ? `${item.pagesRead || 0}/${item.pagesTotal}` : `${item.pagesRead || 0}` },
      { label: "АВТОР", value: item.author ? item.author.split(" ").pop() || item.author : "—" },
      { label: "ОЦЕНКА", value: formatPluses(item.rating) || "—", accent: true },
      { label: "ДАТА", value: item.date || "—" },
    ];
  } else if (category.kind === "guitar") {
    stats = [
      { label: "СТАТУС", value: item.skillStatus || "—" },
      { label: "СТРОЙ", value: item.tuning || "Std E" },
      { label: "ОЦЕНКА", value: formatPluses(item.rating) || "—", accent: true },
      { label: "ДАТА", value: item.date || "—" },
    ];
  } else if (category.kind === "movie") {
    stats = [
      { label: "ДЛИТ.", value: item.duration || "—" },
      { label: "ПЕРЕСМОТРЫ", value: `${item.rewatch || 1}×` },
      { label: "ОЦЕНКА", value: formatPluses(item.rating) || "—", accent: true },
      { label: "ДАТА", value: item.date || "—" },
    ];
  } else if (category.kind === "series") {
    stats = [
      { label: "СЕРИИ", value: `${item.episodes || 1} эп.` },
      { label: "СЕЗОНЫ", value: `${item.seasons || 1} сез.` },
      { label: "ОЦЕНКА", value: formatPluses(item.rating) || "—", accent: true },
      { label: "ДАТА", value: item.date || "—" },
    ];
  } else {
    stats = [
      { label: "СЕРИИ", value: `${item.episodes || 1} эп.` },
      { label: "ПЕРЕСМОТРЫ", value: `${item.rewatch || 1}×` },
      { label: "ОЦЕНКА", value: formatPluses(item.rating) || "—", accent: true },
      { label: "ДАТА", value: item.date || "—" },
    ];
  }

  const subtitle = [
    item.origTitle,
    item.studio ? `Studio ${item.studio}` : item.author || item.artist,
    item.chords,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="anim-modal relative flex max-h-[92vh] w-full max-w-[820px] flex-col overflow-hidden rounded-t-2xl border border-[#343844] bg-[#16181C] sm:flex-row sm:rounded-2xl"
      >
        {/* Left: Full-height Poster (+ Change Photo button in admin mode) */}
        <div className="relative h-64 w-full shrink-0 bg-[#111215] sm:h-auto sm:w-[300px] sm:p-5">
          <div className="relative h-full w-full overflow-hidden sm:rounded-xl sm:border sm:border-[#2A2D36]">
            {item.poster ? (
              <img
                src={item.poster}
                alt={item.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col justify-between bg-[#15171B] p-5">
                <span style={{ color: accent }} className="font-mono-ui text-xs font-bold">
                  {category.label}
                </span>
                <span className="text-xl font-bold text-[#ECEAE4]">{item.title}</span>
                <span className="font-mono-ui text-xs text-[#646975]">
                  {item.origTitle || ""}
                </span>
              </div>
            )}
            {isAdmin && onChangePoster && (
              <button
                type="button"
                onClick={() => onChangePoster(item)}
                style={{ borderColor: accent, color: accent }}
                className="font-mono-ui absolute top-3 left-3 flex cursor-pointer items-center gap-1.5 rounded-md border bg-[#131417]/90 px-2.5 py-1.5 text-[10px] font-bold transition-colors hover:bg-[#1B1D22]"
              >
                <Camera className="h-3.5 w-3.5" />
                Сменить фото
              </button>
            )}
          </div>
        </div>

        {/* Right: Structured Content */}
        <div className="custom-scroll flex min-w-0 flex-1 flex-col overflow-y-auto p-5 sm:py-5 sm:pr-5 sm:pl-1">
          {/* Top line: meta + close */}
          <div className="flex items-center justify-between gap-2">
            <span
              style={{ color: accent }}
              className="font-mono-ui text-[11px] font-bold tracking-[0.06em]"
            >
              {category.label} · №{item.number}
              {item.year ? ` · ${item.year}` : ""}
            </span>
            <div className="flex items-center gap-1.5">
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onEdit(item)}
                  className="font-mono-ui flex cursor-pointer items-center gap-1 rounded-md border border-[#2A2D36] bg-[#24272E] px-2 py-1 text-[10px] font-bold text-[#ECEAE4] transition-colors hover:bg-[#2F333D]"
                >
                  <Pencil className="h-3 w-3" />
                  РЕД.
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Закрыть"
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-[#8B909C] transition-colors hover:bg-[#24272E] hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Adaptive Title */}
          <h2 className={`mt-2 font-bold leading-tight text-[#ECEAE4] ${titleSizeClass}`}>
            {item.title}
          </h2>

          {subtitle && (
            <p className="mt-1.5 text-[13px] text-[#8B909C]">{subtitle}</p>
          )}

          {/* 4 Aligned Stat Cells (with inline -/+ & rating click in admin mode!) */}
          <div className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-4">
            {stats.map((s) => {
              const isEps = s.label === "СЕРИИ";
              const isSez = s.label === "СЕЗОНЫ";
              const isRew = s.label === "ПЕРЕСМОТРЫ";
              const isRate = s.label === "ОЦЕНКА";
              return (
                <div
                  key={s.label}
                  className="rounded-lg border border-[#2A2D36] bg-[#111215] px-3 py-2.5"
                >
                  <div className="font-mono-ui text-[9px] font-bold tracking-[0.08em] text-[#8B909C]">
                    {s.label}
                  </div>
                  {isAdmin && onQuickUpdate && isEps ? (
                    <div className="mt-1 flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => onQuickUpdate({ ...item, episodes: Math.max(0, (item.episodes || 0) - 1) })}
                        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded bg-[#24272E] text-[#ECEAE4] hover:bg-[#323642]"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-mono-ui text-[13px] font-bold text-[#ECEAE4]">
                        {item.episodes || 0}
                      </span>
                      <button
                        type="button"
                        onClick={() => onQuickUpdate({ ...item, episodes: (item.episodes || 0) + 1 })}
                        style={{ color: accent }}
                        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded bg-[#24272E] hover:bg-[#323642]"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  ) : isAdmin && onQuickUpdate && isSez ? (
                    <div className="mt-1 flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => onQuickUpdate({ ...item, seasons: Math.max(1, (item.seasons || 1) - 1) })}
                        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded bg-[#24272E] text-[#ECEAE4] hover:bg-[#323642]"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-mono-ui text-[13px] font-bold text-[#ECEAE4]">
                        {item.seasons || 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => onQuickUpdate({ ...item, seasons: (item.seasons || 1) + 1 })}
                        style={{ color: accent }}
                        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded bg-[#24272E] hover:bg-[#323642]"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  ) : isAdmin && onQuickUpdate && isRew ? (
                    <div className="mt-1 flex items-center justify-between gap-1">
                      <button
                        type="button"
                        onClick={() => onQuickUpdate({ ...item, rewatch: Math.max(1, (item.rewatch || 1) - 1) })}
                        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded bg-[#24272E] text-[#ECEAE4] hover:bg-[#323642]"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-mono-ui text-[13px] font-bold text-[#ECEAE4]">
                        {item.rewatch || 1}×
                      </span>
                      <button
                        type="button"
                        onClick={() => onQuickUpdate({ ...item, rewatch: (item.rewatch || 1) + 1 })}
                        style={{ color: accent }}
                        className="flex h-5 w-5 cursor-pointer items-center justify-center rounded bg-[#24272E] hover:bg-[#323642]"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  ) : isAdmin && onQuickUpdate && isRate ? (
                    <button
                      type="button"
                      onClick={() => onQuickUpdate({ ...item, rating: ((item.rating || 0) + 1) % 5 })}
                      style={{ color: accent }}
                      title="Клик — изменить оценку"
                      className="font-mono-ui mt-1 cursor-pointer truncate text-[13px] font-bold hover:brightness-125"
                    >
                      {s.value}
                    </button>
                  ) : (
                    <div
                      style={s.accent ? { color: accent } : undefined}
                      className="font-mono-ui mt-1 truncate text-[13px] font-bold text-[#ECEAE4]"
                    >
                      {s.value}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* External Book / Resource Link */}
          {item.linkUrl && (
            <div className="mt-4">
              <a
                href={item.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ backgroundColor: accent, color: category.accentFg }}
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition-opacity hover:opacity-90"
              >
                <span>Открыть ссылку</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* Guitar Lyrics & Chords Block */}
          {category.kind === "guitar" && item.lyrics && (
            <div className="mt-4">
              <div className="flex items-center justify-between gap-2">
                <span
                  style={{ color: accent }}
                  className="font-mono-ui text-[11px] font-bold"
                >
                  текст и аккорды
                </span>
                <button
                  type="button"
                  onClick={copyLyrics}
                  className="font-mono-ui flex cursor-pointer items-center gap-1 rounded-md border border-[#2A2D36] bg-[#24272E] px-2 py-0.5 text-[10px] text-[#C8CBD4] hover:text-white"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? "Скопировано" : "Копировать"}
                </button>
              </div>
              <pre className="font-mono-ui custom-scroll mt-2 max-h-[260px] overflow-auto rounded-xl border border-[#2A2D36] bg-[#111215] p-4 whitespace-pre-wrap text-[13px] leading-relaxed text-[#ECEAE4]">
                {item.lyrics}
              </pre>
            </div>
          )}

          {/* Comment Header + Git Commit */}
          <div className="mt-5 flex items-baseline justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                style={{ color: accent }}
                className="font-mono-ui text-[11px] font-bold"
              >
                комент
              </span>
              {isAdmin && onQuickUpdate && !editingNote && (
                <button
                  type="button"
                  onClick={() => {
                    setNoteDraft(item.note || "");
                    setEditingNote(true);
                  }}
                  className="font-mono-ui cursor-pointer text-[10px] text-[#8B909C] hover:text-white"
                >
                  изменить
                </button>
              )}
            </div>
            <span className="font-mono-ui truncate text-[10px] text-[#646975]">
              {item.commitHash
                ? `Из коммита GitHub: ${item.commitHash} · ${item.date}`
                : item.date}
            </span>
          </div>

          {/* Comment Area (inline editable in admin mode!) */}
          <div className="mt-2 min-h-[120px] flex-1 rounded-xl border border-[#2A2D36] bg-[#111215] p-4">
            {editingNote ? (
              <div className="flex flex-col gap-2">
                <textarea
                  rows={4}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) saveInlineNote();
                  }}
                  placeholder="честное впечатление…"
                  className="w-full resize-none rounded-lg border border-[#343844] bg-[#16181C] p-2.5 text-sm leading-relaxed text-[#ECEAE4] outline-none focus:border-[#555B6E]"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingNote(false)}
                    className="cursor-pointer rounded px-2.5 py-1 text-xs text-[#8B909C] hover:text-white"
                  >
                    отмена
                  </button>
                  <button
                    type="button"
                    onClick={saveInlineNote}
                    style={{ backgroundColor: accent, color: category.accentFg }}
                    className="flex cursor-pointer items-center gap-1 rounded-md px-3 py-1 text-xs font-bold"
                  >
                    <Check className="h-3.5 w-3.5" />
                    сохранить
                  </button>
                </div>
              </div>
            ) : (
              <p
                onClick={() => {
                  if (isAdmin && onQuickUpdate) {
                    setNoteDraft(item.note || "");
                    setEditingNote(true);
                  }
                }}
                className={`whitespace-pre-wrap text-[14px] leading-relaxed text-[#ECEAE4] ${
                  isAdmin ? "cursor-text hover:text-white" : ""
                }`}
              >
                {item.note ? `«${formatCommentText(item.note)}»` : "комментарий пока не оставлен."}
              </p>
            )}
          </div>

          {/* Bottom Row: Genres + Poster Source */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {(item.genres || []).map((g) => (
                <span
                  key={g}
                  className="rounded-md bg-[#24272E] px-2.5 py-1 text-[11px] font-medium text-[#D8D6D0]"
                >
                  {g}
                </span>
              ))}
            </div>
            <span className="font-mono-ui text-[10px] text-[#646975]">
              источник постера: {item.posterSource || "AniList API"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
