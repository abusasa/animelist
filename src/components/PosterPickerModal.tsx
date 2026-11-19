"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search, Upload, X } from "lucide-react";
import type { CategoryDef, MediaItem, MediaSearchResult } from "@/lib/types";

interface PosterPickerModalProps {
  item: MediaItem;
  category: CategoryDef;
  onApply: (posterUrl: string, source: string) => Promise<void> | void;
  onClose: () => void;
}

export function PosterPickerModal({
  item,
  category,
  onApply,
  onClose,
}: PosterPickerModalProps) {
  const [urlInput, setUrlInput] = useState(item.poster || "");
  const [query, setQuery] = useState(item.title || "");
  const [results, setResults] = useState<MediaSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const accent = category.accent;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSearch() {
    if (query.trim().length < 2) return;
    setSearching(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/search-media?q=${encodeURIComponent(query.trim())}&kind=${category.kind}`
      );
      const data = await res.json();
      setResults((data.results || []).filter((r: MediaSearchResult) => Boolean(r.poster)));
    } catch {
      setError("ошибка поиска");
    } finally {
      setSearching(false);
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("slug", item.id || "poster");
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "ошибка загрузки");
        return;
      }
      setUrlInput(data.url);
      await onApply(data.url, data.source || "Загружено");
      onClose();
    } catch {
      setError("ошибка загрузки файла");
    } finally {
      setUploading(false);
    }
  }

  async function handleApplyUrl(e: React.FormEvent) {
    e.preventDefault();
    if (!urlInput.trim() || saving) return;
    setSaving(true);
    try {
      await onApply(urlInput.trim(), "Своя ссылка");
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/75 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ borderColor: accent }}
        className="anim-modal flex max-h-[88vh] w-full max-w-[640px] flex-col overflow-hidden rounded-2xl border bg-[#1B1D22] p-5"
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <span
            style={{ color: accent }}
            className="font-mono-ui truncate text-[11px] font-bold tracking-[0.06em]"
          >
            СМЕНИТЬ ПОСТЕР · {item.title}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#2A2D36] bg-[#24272E] text-[#ECEAE4] hover:bg-[#2F333D]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 1. Upload from device OR paste direct URL */}
        <div className="flex flex-col gap-2.5 sm:flex-row">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            style={{ backgroundColor: accent, color: category.accentFg }}
            className="flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-4 text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {uploading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            Загрузить с ПК
          </button>

          <form onSubmit={handleApplyUrl} className="flex flex-1 gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="или вставь ссылку https://..."
              className="font-mono-ui h-10 min-w-0 flex-1 rounded-lg border border-[#2A2D36] bg-[#15171B] px-3 text-xs text-[#ECEAE4] placeholder-[#5B606E] outline-none focus:border-[#555B6E]"
            />
            <button
              type="submit"
              disabled={saving || !urlInput.trim()}
              className="h-10 shrink-0 cursor-pointer rounded-lg border border-[#343844] bg-[#24272E] px-3.5 text-xs font-bold text-[#ECEAE4] hover:bg-[#2F333D] disabled:opacity-40"
            >
              OK
            </button>
          </form>
        </div>

        {/* 2. Quick Internet Search */}
        <div className="mt-4 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSearch();
              }
            }}
            placeholder="найти постер по названию..."
            className="h-9 min-w-0 flex-1 rounded-lg border border-[#2A2D36] bg-[#15171B] px-3 text-xs text-[#ECEAE4] placeholder-[#5B606E] outline-none focus:border-[#555B6E]"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-[#343844] bg-[#24272E] px-3 text-xs font-bold text-[#ECEAE4] hover:bg-[#2F333D]"
          >
            {searching ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Search className="h-3.5 w-3.5" />
            )}
            Найти
          </button>
        </div>

        {error && <div className="font-mono-ui mt-2 text-xs text-[#D9535F]">{error}</div>}

        {/* Search results grid */}
        {results.length > 0 && (
          <div className="custom-scroll mt-3 grid max-h-[340px] grid-cols-3 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-4">
            {results.map((r, i) => (
              <button
                key={`${r.poster}-${i}`}
                type="button"
                onClick={async () => {
                  await onApply(r.poster, r.source);
                  onClose();
                }}
                className="group flex cursor-pointer flex-col text-left"
              >
                <div className="aspect-[2/3] w-full overflow-hidden rounded-lg border border-[#2A2D36] bg-[#15171B] transition-colors group-hover:border-white">
                  <img
                    src={r.poster}
                    alt={r.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <span className="mt-1 truncate text-[11px] text-[#C8CBD4] group-hover:text-white">
                  {r.title}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
