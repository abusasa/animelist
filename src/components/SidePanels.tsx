"use client";

import { useEffect, useState } from "react";
import { Camera, Check, ExternalLink, Maximize2, Minus, Pencil, Plus } from "lucide-react";
import type { CategoryDef, GitCommitItem, MediaItem } from "@/lib/types";
import { formatCommentText } from "@/lib/text";
import { formatPluses } from "./CatalogCard";

interface StatsPanelProps {
  category: CategoryDef;
  items: MediaItem[];
  onCollapse: () => void;
  onSelectItem: (item: MediaItem) => void;
}

export function StatsPanel({
  category,
  items,
  onCollapse,
  onSelectItem,
}: StatsPanelProps) {
  const accent = category.accent;
  const totalCount = items.length;
  const topRated = items.filter((i) => i.rating >= 3).length;

  let rows: { label: string; value: string }[] = [];
  if (category.kind === "anime" || category.kind === "series") {
    const totalEps = items.reduce((s, i) => s + (i.episodes || 0), 0);
    const hours = Math.round((totalEps * (category.kind === "anime" ? 24 : 45)) / 60);
    const days = (hours / 24).toFixed(1);
    const rewatches = items.reduce((s, i) => s + Math.max(0, (i.rewatch || 1) - 1), 0);
    rows = [
      { label: "Всего тайтлов", value: String(totalCount) },
      { label: "Всего серий", value: totalEps.toLocaleString("ru-RU") },
      { label: "Часов жизни", value: `${hours.toLocaleString("ru-RU")} ч` },
      { label: "Дней жизни", value: `${days} д` },
      { label: "Пересмотров", value: `${rewatches}×` },
      { label: "Высших +++", value: String(topRated) },
    ];
  } else if (category.kind === "book") {
    const pagesRead = items.reduce((s, i) => s + (i.pagesRead || 0), 0);
    const finished = items.filter(
      (i) => i.pagesTotal && i.pagesTotal > 0 && (i.pagesRead || 0) >= i.pagesTotal
    ).length;
    rows = [
      { label: "Всего книг", value: String(totalCount) },
      { label: "Прочитано стр.", value: pagesRead.toLocaleString("ru-RU") },
      { label: "Завершено", value: String(finished) },
      { label: "Высших +++", value: String(topRated) },
    ];
  } else if (category.kind === "guitar") {
    const confident = items.filter((i) => i.skillStatus === "Уверенно").length;
    const learning = items.filter((i) => i.skillStatus === "Учу").length;
    rows = [
      { label: "Всего песен", value: String(totalCount) },
      { label: "Играю уверенно", value: String(confident) },
      { label: "В процессе", value: String(learning) },
      { label: "Любимых +++", value: String(topRated) },
    ];
  } else {
    const rewatches = items.reduce((s, i) => s + Math.max(0, (i.rewatch || 1) - 1), 0);
    rows = [
      { label: "Всего записей", value: String(totalCount) },
      { label: "Пересмотров", value: `${rewatches}×` },
      { label: "Высших +++", value: String(topRated) },
    ];
  }

  const rewatched = [...items]
    .filter((i) => (i.rewatch || 1) > 1 || i.rating >= 3)
    .sort((a, b) => (b.rewatch || 1) - (a.rewatch || 1) || b.rating - a.rating)
    .slice(0, 7);

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-[#2A2D36] bg-[#1B1D22] p-4">
      <div className="mb-3 flex shrink-0 items-center justify-between">
        <span
          style={{ color: accent }}
          className="font-mono-ui text-[11px] font-bold tracking-[0.08em]"
        >
          СТАТИСТИКА
        </span>
        <button
          type="button"
          onClick={onCollapse}
          title="Свернуть"
          aria-label="Свернуть статистику"
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-[#2A2D36] bg-[#24272E] text-[#ECEAE4] transition-colors hover:bg-[#2F333D]"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="custom-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {rows.map((r) => (
          <div
            key={r.label}
            className="flex items-center justify-between rounded-md border border-[#2A2D36] bg-[#15171B] px-3 py-2"
          >
            <span className="text-xs text-[#8B909C]">{r.label}</span>
            <span className="font-mono-ui text-[13px] font-bold text-[#ECEAE4]">
              {r.value}
            </span>
          </div>
        ))}

        {rewatched.length > 0 && (
          <>
            <div className="my-2 h-px w-full bg-[#2A2D36]" />
            <div className="font-mono-ui mb-1 text-[10px] font-bold tracking-[0.06em] text-[#8B909C]">
              {category.kind === "anime" || category.kind === "movie" || category.kind === "series"
                ? "САМЫЕ ПЕРЕСМАТРИВАЕМЫЕ"
                : "ИЗБРАННОЕ"}
            </div>
            <div className="flex flex-col gap-2.5">
              {rewatched.map((it) => {
                const pl = formatPluses(it.rating);
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => onSelectItem(it)}
                    className="group flex cursor-pointer items-center gap-2.5 rounded-md p-1 text-left transition-colors hover:bg-[#15171B]"
                  >
                    <div className="h-14 w-10 shrink-0 overflow-hidden rounded border border-[#2A2D36] bg-[#15171B]">
                      {it.poster ? (
                        <img
                          src={it.poster}
                          alt={it.title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-[#646975]">
                          #
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13px] font-semibold text-[#ECEAE4] group-hover:text-white">
                        {it.title}
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-2">
                        <span className="font-mono-ui text-[11px] text-[#8B909C]">
                          {it.episodes ? `${it.episodes} эп.` : it.duration || it.artist || ""}
                          {it.rewatch && it.rewatch > 1 ? ` · ${it.rewatch}×` : ""}
                        </span>
                        <span
                          style={{ color: accent }}
                          className="font-mono-ui text-xs font-bold tracking-wider"
                        >
                          {pl}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

interface DetailsPanelProps {
  category: CategoryDef;
  item: MediaItem | null;
  isAdmin: boolean;
  onCollapse: () => void;
  onExpandModal: () => void;
  onEditItem: (item: MediaItem) => void;
  onQuickUpdate?: (updated: MediaItem) => void;
  onChangePoster?: (item: MediaItem) => void;
}

export function DetailsPanel({
  category,
  item,
  isAdmin,
  onCollapse,
  onExpandModal,
  onEditItem,
  onQuickUpdate,
  onChangePoster,
}: DetailsPanelProps) {
  const accent = category.accent;
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState("");

  useEffect(() => {
    setEditingNote(false);
    setNoteDraft(item?.note || "");
  }, [item?.id, item?.note]);

  function saveInlineNote() {
    if (!item || !onQuickUpdate) return;
    onQuickUpdate({
      ...item,
      note: noteDraft.trim() ? formatCommentText(noteDraft.trim()) : undefined,
    });
    setEditingNote(false);
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-[#2A2D36] bg-[#1B1D22] p-4">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <span className="font-mono-ui text-[11px] font-bold tracking-[0.08em] text-[#8B909C]">
          СВЕДЕНИЯ
        </span>
        <div className="flex items-center gap-1.5">
          {item && isAdmin && (
            <button
              type="button"
              onClick={() => onEditItem(item)}
              title="Редактировать"
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-[#2A2D36] bg-[#24272E] text-[#ECEAE4] transition-colors hover:bg-[#2F333D]"
            >
              <Pencil className="h-3 w-3" />
            </button>
          )}
          {item && (
            <button
              type="button"
              onClick={onExpandModal}
              title="Открыть крупную карточку"
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-[#2A2D36] bg-[#24272E] text-[#ECEAE4] transition-colors hover:bg-[#2F333D]"
            >
              <Maximize2 className="h-3 w-3" />
            </button>
          )}
          <button
            type="button"
            onClick={onCollapse}
            title="Свернуть"
            aria-label="Свернуть сведения"
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-[#2A2D36] bg-[#24272E] text-[#ECEAE4] transition-colors hover:bg-[#2F333D]"
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!item ? (
        <div className="flex flex-1 items-center justify-center text-center text-xs text-[#646975]">
          Выбери элемент в списке
        </div>
      ) : (
        <div className="custom-scroll flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
          {/* Poster clickable to open big modal (+ Change Photo button in admin mode) */}
          <div className="group relative aspect-[3/4] w-full shrink-0 overflow-hidden rounded-lg border border-[#2A2D36] bg-[#15171B]">
            <button
              type="button"
              onClick={onExpandModal}
              title="Нажми, чтобы открыть подробную карточку"
              className="h-full w-full cursor-pointer text-left"
            >
              {item.poster ? (
                <img
                  src={item.poster}
                  alt={item.title}
                  className="h-full w-full object-cover transition-opacity group-hover:opacity-90"
                />
              ) : (
                <div className="flex h-full w-full flex-col justify-between p-4">
                  <span style={{ color: accent }} className="font-mono-ui text-xs font-bold">
                    {category.label}
                  </span>
                  <span className="text-xl font-bold text-[#ECEAE4]">{item.title}</span>
                  <span className="font-mono-ui text-xs text-[#646975]">
                    {item.origTitle || item.artist || item.author || ""}
                  </span>
                </div>
              )}
            </button>
            {isAdmin && onChangePoster && (
              <button
                type="button"
                onClick={() => onChangePoster(item)}
                style={{ borderColor: accent, color: accent }}
                className="font-mono-ui absolute top-2.5 left-2.5 flex cursor-pointer items-center gap-1.5 rounded-md border bg-[#131417]/90 px-2.5 py-1 text-[10px] font-bold transition-colors hover:bg-[#1B1D22]"
              >
                <Camera className="h-3 w-3" />
                Сменить фото
              </button>
            )}
          </div>

          {/* Title (adaptive size for long titles) */}
          <h2
            className={`mt-3 font-bold leading-snug text-[#ECEAE4] ${
              item.title.length > 36 ? "text-base" : "text-lg"
            }`}
          >
            {item.title}
          </h2>
          <p className="font-mono-ui mt-1 text-xs text-[#8B909C]">
            {[
              item.studio || item.author || item.artist,
              item.year,
              category.kind === "book" && item.pagesTotal
                ? `${item.pagesRead || 0}/${item.pagesTotal} стр.`
                : item.episodes
                ? `${item.episodes} серий`
                : item.duration || item.chords,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>

          {/* Inline Admin Quick Counters (Episodes / Pages / Rewatches) */}
          {isAdmin && onQuickUpdate && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(category.kind === "anime" || category.kind === "series" || category.kind === "custom") && (
                <div className="flex items-center justify-between rounded-md border border-[#2A2D36] bg-[#15171B] px-2 py-1.5">
                  <span className="font-mono-ui text-[10px] text-[#8B909C]">СЕРИИ</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onQuickUpdate({ ...item, episodes: Math.max(0, (item.episodes || 0) - 1) })}
                      className="flex h-5 w-5 cursor-pointer items-center justify-center rounded bg-[#24272E] text-[#ECEAE4] hover:bg-[#323642]"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="font-mono-ui min-w-[26px] text-center text-xs font-bold text-[#ECEAE4]">
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
                </div>
              )}
              {category.kind === "book" && (
                <div className="flex items-center justify-between rounded-md border border-[#2A2D36] bg-[#15171B] px-2 py-1.5">
                  <span className="font-mono-ui text-[10px] text-[#8B909C]">СТР.</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onQuickUpdate({ ...item, pagesRead: Math.max(0, (item.pagesRead || 0) - 10) })}
                      className="flex h-5 w-5 cursor-pointer items-center justify-center rounded bg-[#24272E] text-[#ECEAE4] hover:bg-[#323642]"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="font-mono-ui min-w-[30px] text-center text-xs font-bold text-[#ECEAE4]">
                      {item.pagesRead || 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => onQuickUpdate({ ...item, pagesRead: (item.pagesRead || 0) + 10 })}
                      style={{ color: accent }}
                      className="flex h-5 w-5 cursor-pointer items-center justify-center rounded bg-[#24272E] hover:bg-[#323642]"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              )}
              {(category.kind === "anime" || category.kind === "movie") && (
                <div className="flex items-center justify-between rounded-md border border-[#2A2D36] bg-[#15171B] px-2 py-1.5">
                  <span className="font-mono-ui text-[10px] text-[#8B909C]">ПОВТ.</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onQuickUpdate({ ...item, rewatch: Math.max(1, (item.rewatch || 1) - 1) })}
                      className="flex h-5 w-5 cursor-pointer items-center justify-center rounded bg-[#24272E] text-[#ECEAE4] hover:bg-[#323642]"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="font-mono-ui min-w-[24px] text-center text-xs font-bold text-[#ECEAE4]">
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
                </div>
              )}
              {category.kind === "series" && (
                <div className="flex items-center justify-between rounded-md border border-[#2A2D36] bg-[#15171B] px-2 py-1.5">
                  <span className="font-mono-ui text-[10px] text-[#8B909C]">СЕЗ.</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onQuickUpdate({ ...item, seasons: Math.max(1, (item.seasons || 1) - 1) })}
                      className="flex h-5 w-5 cursor-pointer items-center justify-center rounded bg-[#24272E] text-[#ECEAE4] hover:bg-[#323642]"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="font-mono-ui min-w-[24px] text-center text-xs font-bold text-[#ECEAE4]">
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
                </div>
              )}
            </div>
          )}

          {/* Full-width rating strip (clickable inline selector in admin mode!) */}
          <div
            style={{
              backgroundColor: `color-mix(in srgb, ${accent} 13%, #15171B)`,
              borderColor: `color-mix(in srgb, ${accent} 38%, #2A2D36)`,
            }}
            className="mt-3 flex items-center justify-between rounded-md border px-3 py-2"
          >
            <span style={{ color: accent }} className="font-mono-ui text-xs font-bold">
              Оценка:
            </span>
            {isAdmin && onQuickUpdate ? (
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => onQuickUpdate({ ...item, rating: v })}
                    style={
                      item.rating === v
                        ? { backgroundColor: accent, color: category.accentFg }
                        : undefined
                    }
                    className={`font-mono-ui cursor-pointer rounded px-1.5 py-0.5 text-[11px] font-bold transition-colors ${
                      item.rating === v ? "" : "text-[#8B909C] hover:text-white"
                    }`}
                  >
                    {v === 0 ? "0" : "+".repeat(v)}
                  </button>
                ))}
              </div>
            ) : (
              <span
                style={{ color: accent }}
                className="font-mono-ui text-sm font-bold tracking-[0.14em]"
              >
                {formatPluses(item.rating) || "—"}
              </span>
            )}
          </div>

          {/* Book / Guitar External Link Button */}
          {item.linkUrl && (
            <a
              href={item.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ backgroundColor: accent, color: category.accentFg }}
              className="mt-3 flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-bold transition-opacity hover:opacity-90"
            >
              <span>Открыть ссылку</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}

          {/* Guitar Lyrics & Chords Preview */}
          {category.kind === "guitar" && item.lyrics && (
            <div className="mt-3 flex flex-col rounded-lg border border-[#2A2D36] bg-[#15171B] p-3">
              <div className="flex items-center justify-between">
                <span
                  style={{ color: accent }}
                  className="font-mono-ui text-[10px] font-bold tracking-[0.08em]"
                >
                  ТЕКСТ И АККОРДЫ
                </span>
                <button
                  type="button"
                  onClick={onExpandModal}
                  className="font-mono-ui cursor-pointer text-[10px] text-[#8B909C] hover:text-white"
                >
                  на весь экран →
                </button>
              </div>
              <pre className="font-mono-ui custom-scroll mt-2 max-h-52 overflow-auto whitespace-pre-wrap text-[12px] leading-relaxed text-[#ECEAE4]">
                {item.lyrics}
              </pre>
            </div>
          )}

          {/* Personal Note (click to edit directly inline in admin mode!) */}
          <div className="mt-3 flex flex-col rounded-lg border border-[#2A2D36] bg-[#15171B] p-3">
            <div className="flex items-center justify-between">
              <span
                style={{ color: accent }}
                className="font-mono-ui text-[10px] font-bold tracking-[0.08em]"
              >
                ЛИЧНАЯ ЗАМЕТКА
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

            {editingNote ? (
              <div className="mt-2 flex flex-col gap-2">
                <textarea
                  rows={4}
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      saveInlineNote();
                    }
                  }}
                  placeholder="честное впечатление…"
                  className="w-full resize-none rounded-md border border-[#343844] bg-[#131417] p-2 text-xs leading-relaxed text-[#ECEAE4] outline-none focus:border-[#555B6E]"
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setEditingNote(false)}
                    className="cursor-pointer rounded px-2 py-1 text-[11px] text-[#8B909C] hover:text-white"
                  >
                    отмена
                  </button>
                  <button
                    type="button"
                    onClick={saveInlineNote}
                    style={{ backgroundColor: accent, color: category.accentFg }}
                    className="flex cursor-pointer items-center gap-1 rounded px-2.5 py-1 text-[11px] font-bold"
                  >
                    <Check className="h-3 w-3" />
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
                className={`mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-[#ECEAE4] ${
                  isAdmin ? "cursor-text hover:text-white" : ""
                }`}
              >
                {item.note ? `«${formatCommentText(item.note)}»` : "заметка пока не добавлена."}
              </p>
            )}
            <span className="font-mono-ui mt-3 text-right text-[10px] text-[#646975]">
              {item.commitHash ? `${item.commitHash} · ` : ""}
              {item.date}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

interface LogsPanelProps {
  accent: string;
  commits: GitCommitItem[];
  onCollapse: () => void;
}

export function LogsPanel({ accent, commits, onCollapse }: LogsPanelProps) {
  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-[#2A2D36] bg-[#1B1D22] p-4">
      <div className="mb-2.5 flex shrink-0 items-center justify-between">
        <span className="font-mono-ui text-[11px] font-bold tracking-[0.08em] text-[#8B909C]">
          ЛОГИ
        </span>
        <button
          type="button"
          onClick={onCollapse}
          title="Свернуть"
          aria-label="Свернуть логи"
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md border border-[#2A2D36] bg-[#24272E] text-[#ECEAE4] transition-colors hover:bg-[#2F333D]"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="custom-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {commits.length === 0 ? (
          <div className="font-mono-ui text-xs text-[#646975]">Нет записей</div>
        ) : (
          commits.map((c) => (
            <div
              key={c.hash + c.subject}
              className="flex items-baseline gap-2.5 text-[11px] leading-snug"
            >
              <span
                style={{ color: accent }}
                className="font-mono-ui shrink-0 font-bold"
              >
                {c.hash}
              </span>
              <span className="font-mono-ui truncate text-[#C8CBD4]" title={c.subject}>
                {c.subject}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
