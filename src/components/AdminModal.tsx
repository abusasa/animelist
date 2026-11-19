"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, LogOut, Plus, Search, Trash2, Upload, X } from "lucide-react";
import type {
  CatalogData,
  CategoryDef,
  CategoryKind,
  MediaItem,
  MediaSearchResult,
} from "@/lib/types";
import { formatCommentText } from "@/lib/text";

interface FormDraft {
  title: string;
  origTitle: string;
  studio: string;
  author: string;
  artist: string;
  year: string;
  episodes: string;
  seasons: string;
  rewatch: string;
  duration: string;
  pagesRead: string;
  pagesTotal: string;
  chords: string;
  lyrics: string;
  tuning: string;
  skillStatus: string;
  linkUrl: string;
  rating: number;
  poster: string;
  posterSource: string;
  genresText: string;
  note: string;
  searchQuery: string;
  searchResults: MediaSearchResult[];
}

function emptyDraft(): FormDraft {
  return {
    title: "",
    origTitle: "",
    studio: "",
    author: "",
    artist: "",
    year: "",
    episodes: "12",
    seasons: "1",
    rewatch: "1",
    duration: "",
    pagesRead: "0",
    pagesTotal: "300",
    chords: "",
    lyrics: "",
    tuning: "Standard E",
    skillStatus: "Уверенно",
    linkUrl: "",
    rating: 1,
    poster: "",
    posterSource: "AniList API",
    genresText: "",
    note: "",
    searchQuery: "",
    searchResults: [],
  };
}

interface AdminModalProps {
  categories: CategoryDef[];
  activeCategory: CategoryDef;
  editItem: MediaItem | null;
  githubConnected: boolean;
  onSaved: (catalog: CatalogData, selectCategoryId?: string) => void;
  onLogout: () => void;
  onClose: () => void;
}

const PRESET_COLORS = [
  { hex: "#E07A9A", fg: "#131417" },
  { hex: "#9B7EDE", fg: "#131417" },
  { hex: "#D9535F", fg: "#131417" },
  { hex: "#00875F", fg: "#F3F4F6" },
  { hex: "#E7E5DF", fg: "#131417" },
  { hex: "#D99B26", fg: "#131417" },
  { hex: "#5C9CE6", fg: "#131417" },
];

export function AdminModal({
  categories,
  activeCategory,
  editItem,
  githubConnected,
  onSaved,
  onLogout,
  onClose,
}: AdminModalProps) {
  const [catId, setCatId] = useState(editItem?.category || activeCategory.id);
  const [addingCat, setAddingCat] = useState(false);

  // Item fields
  const [title, setTitle] = useState(editItem?.title || "");
  const [origTitle, setOrigTitle] = useState(editItem?.origTitle || "");
  const [studio, setStudio] = useState(editItem?.studio || "");
  const [author, setAuthor] = useState(editItem?.author || "");
  const [artist, setArtist] = useState(editItem?.artist || "");
  const [year, setYear] = useState(editItem?.year ? String(editItem.year) : "");
  const [episodes, setEpisodes] = useState(editItem?.episodes ? String(editItem.episodes) : "12");
  const [seasons, setSeasons] = useState(editItem?.seasons ? String(editItem.seasons) : "1");
  const [rewatch, setRewatch] = useState(editItem?.rewatch ? String(editItem.rewatch) : "1");
  const [duration, setDuration] = useState(editItem?.duration || "");
  const [pagesRead, setPagesRead] = useState(editItem?.pagesRead ? String(editItem.pagesRead) : "0");
  const [pagesTotal, setPagesTotal] = useState(editItem?.pagesTotal ? String(editItem.pagesTotal) : "300");
  const [chords, setChords] = useState(editItem?.chords || "");
  const [lyrics, setLyrics] = useState(editItem?.lyrics || "");
  const [tuning, setTuning] = useState(editItem?.tuning || "Standard E");
  const [skillStatus, setSkillStatus] = useState(editItem?.skillStatus || "Уверенно");
  const [linkUrl, setLinkUrl] = useState(editItem?.linkUrl || "");
  const [rating, setRating] = useState<number>(editItem?.rating ?? 1);
  const [poster, setPoster] = useState(editItem?.poster || "");
  const [posterSource, setPosterSource] = useState(editItem?.posterSource || "AniList API");
  const [genresText, setGenresText] = useState((editItem?.genres || []).join(", "));
  const [note, setNote] = useState(editItem?.note || "");

  // Live API auto-search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MediaSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Per-category draft preservation (switching АНИМЭ -> ФИЛЬМА clears form for ФИЛЬМА,
  // switching back to АНИМЭ restores everything you typed!)
  const draftsRef = useRef<Record<string, FormDraft>>({});

  function snapshotCurrentDraft(): FormDraft {
    return {
      title,
      origTitle,
      studio,
      author,
      artist,
      year,
      episodes,
      seasons,
      rewatch,
      duration,
      pagesRead,
      pagesTotal,
      chords,
      lyrics,
      tuning,
      skillStatus,
      linkUrl,
      rating,
      poster,
      posterSource,
      genresText,
      note,
      searchQuery,
      searchResults,
    };
  }

  function loadDraft(d: FormDraft) {
    setTitle(d.title);
    setOrigTitle(d.origTitle);
    setStudio(d.studio);
    setAuthor(d.author);
    setArtist(d.artist);
    setYear(d.year);
    setEpisodes(d.episodes);
    setSeasons(d.seasons);
    setRewatch(d.rewatch);
    setDuration(d.duration);
    setPagesRead(d.pagesRead);
    setPagesTotal(d.pagesTotal);
    setChords(d.chords);
    setLyrics(d.lyrics);
    setTuning(d.tuning);
    setSkillStatus(d.skillStatus);
    setLinkUrl(d.linkUrl);
    setRating(d.rating);
    setPoster(d.poster);
    setPosterSource(d.posterSource);
    setGenresText(d.genresText);
    setNote(d.note);
    setSearchQuery(d.searchQuery);
    setSearchResults(d.searchResults);
  }

  function handleSwitchCategory(nextId: string) {
    setAddingCat(false);
    if (nextId === catId) return;
    // Save current category's draft before switching
    draftsRef.current[catId] = snapshotCurrentDraft();
    // Restore target category's saved draft or load clean empty draft
    const targetDraft = draftsRef.current[nextId] || emptyDraft();
    loadDraft(targetDraft);
    setStatusMsg(null);
    setCatId(nextId);
  }

  // New Category form state
  const [newCatLabel, setNewCatLabel] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [newCatKind, setNewCatKind] = useState<CategoryKind>("custom");
  const [newCatColor, setNewCatColor] = useState(PRESET_COLORS[5]);

  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [uploadingPoster, setUploadingPoster] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleUploadPosterFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPoster(true);
    setStatusMsg(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("slug", editItem?.id || catId);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg(data.error || "ошибка загрузки");
        return;
      }
      setPoster(data.url);
      setPosterSource(data.source || "Загружено");
    } catch {
      setStatusMsg("ошибка загрузки файла");
    } finally {
      setUploadingPoster(false);
    }
  }

  const currentCat = categories.find((c) => c.id === catId) || activeCategory;
  const accent = currentCat.accent;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function runAutoSearch() {
    const q = (searchQuery || title).trim();
    if (q.length < 2) return;
    setSearching(true);
    setStatusMsg(null);
    try {
      const res = await fetch(
        `/api/search-media?q=${encodeURIComponent(q)}&kind=${currentCat.kind}`
      );
      const data = await res.json();
      setSearchResults(data.results || []);
      if (!data.results?.length) {
        setStatusMsg("Ничего не найдено — можно вставить свою ссылку на постер");
      }
    } catch {
      setStatusMsg("Ошибка поиска");
    } finally {
      setSearching(false);
    }
  }

  function applyResult(r: MediaSearchResult) {
    setTitle(r.title);
    if (r.origTitle) setOrigTitle(r.origTitle);
    if (r.studio) setStudio(r.studio);
    if (r.author) setAuthor(r.author);
    if (r.artist) setArtist(r.artist);
    if (r.year) setYear(String(r.year));
    if (r.episodes) setEpisodes(String(r.episodes));
    if (r.pagesTotal) setPagesTotal(String(r.pagesTotal));
    if (r.duration) setDuration(r.duration);
    if (r.genres?.length) setGenresText(r.genres.join(", "));
    if (r.poster) {
      setPoster(r.poster);
      setPosterSource(r.source);
    }
    setSearchResults([]);
  }

  async function handleSaveItem(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    setStatusMsg(null);

    const payload: MediaItem = {
      id: editItem?.id || "",
      number: editItem?.number || 0,
      category: catId,
      title: title.trim(),
      origTitle: origTitle.trim() || undefined,
      studio: studio.trim() || undefined,
      author: author.trim() || undefined,
      artist: artist.trim() || undefined,
      year: year ? Number(year) || null : null,
      episodes:
        currentCat.kind === "anime" || currentCat.kind === "series" || currentCat.kind === "custom"
          ? Number(episodes) || 1
          : undefined,
      seasons: currentCat.kind === "series" ? Math.max(1, Number(seasons) || 1) : undefined,
      rewatch:
        currentCat.kind === "anime" || currentCat.kind === "movie" || currentCat.kind === "series"
          ? Math.max(1, Number(rewatch) || 1)
          : undefined,
      duration: currentCat.kind === "movie" ? duration.trim() || undefined : undefined,
      pagesRead: currentCat.kind === "book" ? Number(pagesRead) || 0 : undefined,
      pagesTotal: currentCat.kind === "book" ? Number(pagesTotal) || 0 : undefined,
      chords: currentCat.kind === "guitar" ? chords.trim() || undefined : undefined,
      lyrics: currentCat.kind === "guitar" ? lyrics.trim() || undefined : undefined,
      tuning: currentCat.kind === "guitar" ? tuning.trim() || undefined : undefined,
      skillStatus: currentCat.kind === "guitar" ? skillStatus : undefined,
      linkUrl: linkUrl.trim() || undefined,
      rating,
      date: editItem?.date || new Date().toISOString().slice(0, 10),
      commitHash: editItem?.commitHash,
      note: note.trim() ? formatCommentText(note.trim()) : undefined,
      genres: genresText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      poster: poster.trim(),
      posterSource: poster.trim() ? posterSource : "Manual",
    };

    try {
      const res = await fetch("/api/admin/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upsert-item", item: payload }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg(data.error || "Ошибка сохранения");
        return;
      }
      onSaved(data.catalog, catId);
      onClose();
    } catch {
      setStatusMsg("Ошибка сети");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteItem() {
    if (!editItem || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete-item", id: editItem.id }),
      });
      const data = await res.json();
      if (res.ok) {
        onSaved(data.catalog);
        onClose();
      } else {
        setStatusMsg(data.error || "Ошибка удаления");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCatLabel.trim() || saving) return;
    setSaving(true);
    setStatusMsg(null);
    const slug =
      newCatSlug.trim() ||
      newCatLabel
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "") ||
      `cat${Date.now().toString(36).slice(-4)}`;

    try {
      const res = await fetch("/api/admin/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add-category",
          category: {
            label: newCatLabel.trim().toUpperCase(),
            slug,
            unit: slug,
            accent: newCatColor.hex,
            accentFg: newCatColor.fg,
            kind: newCatKind,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg(data.error || "Ошибка");
        return;
      }
      onSaved(data.catalog, data.category.id);
      setCatId(data.category.id);
      setAddingCat(false);
      setNewCatLabel("");
      setNewCatSlug("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ borderColor: accent }}
        className="anim-modal flex max-h-[92vh] w-full max-w-[1080px] flex-col overflow-hidden rounded-2xl border bg-[#1B1D22]"
      >
        {/* Top bar (no bottom divider line between header and category pills) */}
        <div className="flex shrink-0 items-center justify-between gap-2 px-5 pt-4 pb-2">
          <span
            style={{ color: accent }}
            className="font-mono-ui text-[11px] font-bold tracking-[0.08em]"
          >
            АДМИН · {editItem ? "РЕДАКТИРОВАТЬ" : "ДОБАВИТЬ"}
          </span>

          <div className="flex items-center gap-2">
            <span
              className={`font-mono-ui hidden rounded-md border px-2.5 py-1 text-[10px] font-bold sm:inline-block ${
                githubConnected
                  ? "border-[#0D523E] bg-[#122922] text-[#34D399]"
                  : "border-[#2A2D36] bg-[#15171B] text-[#8B909C]"
              }`}
            >
              {githubConnected ? "● GitHub API OK" : "● Локальный JSON"}
            </span>
            <button
              type="button"
              onClick={onLogout}
              title="Выйти из админки"
              className="flex h-7 cursor-pointer items-center gap-1 rounded-md border border-[#2A2D36] bg-[#24272E] px-2 text-[11px] text-[#9DA2AE] hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Закрыть"
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#2A2D36] bg-[#24272E] text-[#ECEAE4] hover:bg-[#2F333D]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="custom-scroll flex-1 overflow-y-auto px-5 pt-2 pb-5">
          {/* Category selector + Add Category toggle */}
          <div className="mb-5 flex flex-wrap items-center gap-2">
            {categories.map((c) => {
              const act = !addingCat && c.id === catId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSwitchCategory(c.id)}
                  style={act ? { backgroundColor: c.accent, color: c.accentFg } : undefined}
                  className={`font-mono-ui cursor-pointer rounded-md px-3 py-1.5 text-[11px] font-bold transition-colors ${
                    act ? "" : "bg-[#24272E] text-[#9DA2AE] hover:text-white"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setAddingCat((v) => !v)}
              className={`font-mono-ui flex cursor-pointer items-center gap-1 rounded-md border px-3 py-1.5 text-[11px] font-bold transition-colors ${
                addingCat
                  ? "border-[#ECEAE4] bg-[#ECEAE4] text-[#131417]"
                  : "border-[#343844] text-[#8B909C] hover:text-white"
              }`}
            >
              <Plus className="h-3.5 w-3.5" />
              НОВАЯ КАТЕГОРИЯ
            </button>
          </div>

          {addingCat ? (
            /* Add New Category Form */
            <form
              onSubmit={handleCreateCategory}
              className="grid max-w-xl gap-4 rounded-xl border border-[#2A2D36] bg-[#15171B] p-5"
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="font-mono-ui mb-1.5 block text-[10px] font-bold text-[#8B909C]">
                    НАЗВАНИЕ (КАК В WAYBAR)
                  </label>
                  <input
                    value={newCatLabel}
                    onChange={(e) => setNewCatLabel(e.target.value)}
                    placeholder="ИГРЫ"
                    required
                    className="w-full rounded-lg border border-[#2A2D36] bg-[#1B1D22] px-3 py-2 text-sm text-[#ECEAE4] outline-none focus:border-[#555B6E]"
                  />
                </div>
                <div>
                  <label className="font-mono-ui mb-1.5 block text-[10px] font-bold text-[#8B909C]">
                    ЛАТИНСКИЙ SLUG
                  </label>
                  <input
                    value={newCatSlug}
                    onChange={(e) => setNewCatSlug(e.target.value)}
                    placeholder="games"
                    className="font-mono-ui w-full rounded-lg border border-[#2A2D36] bg-[#1B1D22] px-3 py-2 text-sm text-[#ECEAE4] outline-none focus:border-[#555B6E]"
                  />
                </div>
              </div>

              <div>
                <label className="font-mono-ui mb-1.5 block text-[10px] font-bold text-[#8B909C]">
                  ТИП ПОЛЕЙ
                </label>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      ["anime", "Серии + Пересмотры"],
                      ["movie", "Длительность + Год"],
                      ["book", "Страницы (прочитано/всего)"],
                      ["guitar", "Исполнитель + Аккорды"],
                    ] as [CategoryKind, string][]
                  ).map(([k, lbl]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setNewCatKind(k)}
                      className={`cursor-pointer rounded-md border px-3 py-1.5 text-xs ${
                        newCatKind === k
                          ? "border-[#ECEAE4] bg-[#24272E] text-white"
                          : "border-[#2A2D36] text-[#8B909C]"
                      }`}
                    >
                      {lbl}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-mono-ui mb-1.5 block text-[10px] font-bold text-[#8B909C]">
                  АКЦЕНТНЫЙ ЦВЕТ
                </label>
                <div className="flex items-center gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setNewCatColor(c)}
                      style={{ backgroundColor: c.hex }}
                      className={`h-7 w-7 cursor-pointer rounded-md border-2 ${
                        newCatColor.hex === c.hex ? "border-white" : "border-transparent"
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="submit"
                  disabled={saving}
                  style={{ backgroundColor: newCatColor.hex, color: newCatColor.fg }}
                  className="cursor-pointer rounded-lg px-4 py-2 text-xs font-bold"
                >
                  {saving ? "Сохраняю…" : "Создать категорию →"}
                </button>
              </div>
            </form>
          ) : (
            /* Add / Edit Item Form */
            <form onSubmit={handleSaveItem} className="grid grid-cols-1 gap-5 md:grid-cols-[220px_1fr]">
              {/* Left: Live Poster Preview */}
              <div className="flex flex-col gap-2.5">
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-[#2A2D36] bg-[#15171B]">
                  {poster ? (
                    <img
                      src={poster}
                      alt={title || "Постер"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center p-4 text-center">
                      <span className="font-mono-ui text-[11px] text-[#646975]">
                        Постер подтянется через поиск или ссылку
                      </span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleUploadPosterFile}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={uploadingPoster}
                  onClick={() => fileInputRef.current?.click()}
                  className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[#343844] bg-[#24272E] px-3 py-2 text-[11px] font-bold text-[#ECEAE4] transition-colors hover:bg-[#2F333D] disabled:opacity-50"
                >
                  {uploadingPoster ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  Загрузить фото с ПК
                </button>
                <input
                  value={poster}
                  onChange={(e) => {
                    setPoster(e.target.value);
                    setPosterSource("Своя ссылка");
                  }}
                  placeholder="https://... (своя ссылка)"
                  className="font-mono-ui w-full rounded-lg border border-[#2A2D36] bg-[#15171B] px-2.5 py-2 text-[11px] text-[#ECEAE4] placeholder-[#5B606E] outline-none focus:border-[#555B6E]"
                />
              </div>

              {/* Right: Auto-search + Concrete Fields */}
              <div className="flex flex-col gap-3.5">
                {/* Auto Search Bar */}
                <div>
                  <label className="font-mono-ui mb-1 block text-[10px] font-bold text-[#8B909C]">
                    АВТОПОИСК
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          runAutoSearch();
                        }
                      }}
                      placeholder="Введи название и нажми Найти…"
                      className="w-full rounded-lg border border-[#2A2D36] bg-[#15171B] px-3 py-2 text-sm text-[#ECEAE4] placeholder-[#5B606E] outline-none focus:border-[#555B6E]"
                    />
                    <button
                      type="button"
                      onClick={runAutoSearch}
                      disabled={searching}
                      style={{ backgroundColor: accent, color: currentCat.accentFg }}
                      className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold transition-opacity hover:opacity-90"
                    >
                      {searching ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Search className="h-3.5 w-3.5" />
                      )}
                      Найти
                    </button>
                  </div>

                  {/* Live Search Results Picker */}
                  {searchResults.length > 0 && (
                    <div className="custom-scroll mt-2 grid max-h-44 grid-cols-1 gap-1.5 overflow-y-auto rounded-lg border border-[#2A2D36] bg-[#131417] p-2 sm:grid-cols-2">
                      {searchResults.map((r, idx) => (
                        <button
                          key={`${r.title}-${idx}`}
                          type="button"
                          onClick={() => applyResult(r)}
                          className="flex cursor-pointer items-center gap-2.5 rounded-md border border-transparent bg-[#1B1D22] p-1.5 text-left transition-colors hover:border-[#494E5E]"
                        >
                          <div className="h-12 w-9 shrink-0 overflow-hidden rounded bg-[#131417]">
                            {r.poster && (
                              <img src={r.poster} alt={r.title} className="h-full w-full object-cover" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-semibold text-[#ECEAE4]">
                              {r.title}
                            </div>
                            <div className="font-mono-ui truncate text-[10px] text-[#8B909C]">
                              {[r.year, r.studio || r.author || r.artist, r.episodes ? `${r.episodes} эп.` : ""]
                                .filter(Boolean)
                                .join(" · ")}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Title + Original/Subtitle */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="font-mono-ui mb-1 block text-[10px] font-bold text-[#8B909C]">
                      НАЗВАНИЕ *
                    </label>
                    <input
                      required
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Дандадан"
                      className="w-full rounded-lg border border-[#2A2D36] bg-[#15171B] px-3 py-2 text-sm text-[#ECEAE4] outline-none focus:border-[#555B6E]"
                    />
                  </div>
                  <div>
                    <label className="font-mono-ui mb-1 block text-[10px] font-bold text-[#8B909C]">
                      {currentCat.kind === "book"
                        ? "АВТОР"
                        : currentCat.kind === "guitar"
                        ? "ИСПОЛНИТЕЛЬ"
                        : "СТУДИЯ / РЕЖИССЁР"}
                    </label>
                    <input
                      value={
                        currentCat.kind === "book"
                          ? author
                          : currentCat.kind === "guitar"
                          ? artist
                          : studio
                      }
                      onChange={(e) => {
                        if (currentCat.kind === "book") setAuthor(e.target.value);
                        else if (currentCat.kind === "guitar") setArtist(e.target.value);
                        else setStudio(e.target.value);
                      }}
                      className="w-full rounded-lg border border-[#2A2D36] bg-[#15171B] px-3 py-2 text-sm text-[#ECEAE4] outline-none focus:border-[#555B6E]"
                    />
                  </div>
                </div>

                {/* Category-Specific Concrete Metrics */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {currentCat.kind === "book" ? (
                    <>
                      <div>
                        <label className="font-mono-ui mb-1 block text-[10px] font-bold text-[#8B909C]">
                          ПРОЧИТАНО СТР.
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={pagesRead}
                          onChange={(e) => setPagesRead(e.target.value)}
                          className="font-mono-ui w-full rounded-lg border border-[#2A2D36] bg-[#15171B] px-3 py-2 text-sm font-bold text-[#ECEAE4] outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-mono-ui mb-1 block text-[10px] font-bold text-[#8B909C]">
                          ВСЕГО СТР.
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={pagesTotal}
                          onChange={(e) => setPagesTotal(e.target.value)}
                          className="font-mono-ui w-full rounded-lg border border-[#2A2D36] bg-[#15171B] px-3 py-2 text-sm font-bold text-[#ECEAE4] outline-none"
                        />
                      </div>
                    </>
                  ) : currentCat.kind === "guitar" ? (
                    <>
                      <div>
                        <label className="font-mono-ui mb-1 block text-[10px] font-bold text-[#8B909C]">
                          АККОРДЫ / РИФФ
                        </label>
                        <input
                          value={chords}
                          onChange={(e) => setChords(e.target.value)}
                          placeholder="Am · Em · Dm · G"
                          className="font-mono-ui w-full rounded-lg border border-[#2A2D36] bg-[#15171B] px-3 py-2 text-xs text-[#ECEAE4] outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-mono-ui mb-1 block text-[10px] font-bold text-[#8B909C]">
                          СТАТУС
                        </label>
                        <select
                          value={skillStatus}
                          onChange={(e) => setSkillStatus(e.target.value)}
                          className="w-full rounded-lg border border-[#2A2D36] bg-[#15171B] px-2.5 py-2 text-sm text-[#ECEAE4] outline-none"
                        >
                          <option value="Уверенно">Уверенно</option>
                          <option value="Учу">Учу</option>
                          <option value="В планах">В планах</option>
                        </select>
                      </div>
                    </>
                  ) : currentCat.kind === "movie" ? (
                    <>
                      <div>
                        <label className="font-mono-ui mb-1 block text-[10px] font-bold text-[#8B909C]">
                          ДЛИТЕЛЬНОСТЬ
                        </label>
                        <input
                          value={duration}
                          onChange={(e) => setDuration(e.target.value)}
                          placeholder="2ч 15м"
                          className="font-mono-ui w-full rounded-lg border border-[#2A2D36] bg-[#15171B] px-3 py-2 text-sm text-[#ECEAE4] outline-none"
                        />
                      </div>
                      <div>
                        <label className="font-mono-ui mb-1 block text-[10px] font-bold text-[#8B909C]">
                          ПЕРЕСМОТРЫ
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={rewatch}
                          onChange={(e) => setRewatch(e.target.value)}
                          className="font-mono-ui w-full rounded-lg border border-[#2A2D36] bg-[#15171B] px-3 py-2 text-sm font-bold text-[#ECEAE4] outline-none"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="font-mono-ui mb-1 block text-[10px] font-bold text-[#8B909C]">
                          СЕРИИ
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={episodes}
                          onChange={(e) => setEpisodes(e.target.value)}
                          className="font-mono-ui w-full rounded-lg border border-[#2A2D36] bg-[#15171B] px-3 py-2 text-sm font-bold text-[#ECEAE4] outline-none"
                        />
                      </div>
                      {currentCat.kind === "series" ? (
                        <div>
                          <label className="font-mono-ui mb-1 block text-[10px] font-bold text-[#8B909C]">
                            СЕЗОНЫ
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={seasons}
                            onChange={(e) => setSeasons(e.target.value)}
                            className="font-mono-ui w-full rounded-lg border border-[#2A2D36] bg-[#15171B] px-3 py-2 text-sm font-bold text-[#ECEAE4] outline-none"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="font-mono-ui mb-1 block text-[10px] font-bold text-[#8B909C]">
                            ПЕРЕСМОТРЫ
                          </label>
                          <input
                            type="number"
                            min={1}
                            value={rewatch}
                            onChange={(e) => setRewatch(e.target.value)}
                            className="font-mono-ui w-full rounded-lg border border-[#2A2D36] bg-[#15171B] px-3 py-2 text-sm font-bold text-[#ECEAE4] outline-none"
                          />
                        </div>
                      )}
                    </>
                  )}

                  {/* Year / Tuning */}
                  <div>
                    <label className="font-mono-ui mb-1 block text-[10px] font-bold text-[#8B909C]">
                      {currentCat.kind === "guitar" ? "СТРОЙ" : "ГОД"}
                    </label>
                    <input
                      value={currentCat.kind === "guitar" ? tuning : year}
                      onChange={(e) =>
                        currentCat.kind === "guitar"
                          ? setTuning(e.target.value)
                          : setYear(e.target.value)
                      }
                      placeholder={currentCat.kind === "guitar" ? "Standard E" : "2024"}
                      className="font-mono-ui w-full rounded-lg border border-[#2A2D36] bg-[#15171B] px-3 py-2 text-sm text-[#ECEAE4] outline-none"
                    />
                  </div>

                  {/* Rating Pluses Selector */}
                  <div>
                    <label className="font-mono-ui mb-1 block text-[10px] font-bold text-[#8B909C]">
                      ОЦЕНКА (+)
                    </label>
                    <div className="flex h-[38px] items-center gap-1 rounded-lg border border-[#2A2D36] bg-[#15171B] p-1">
                      {[0, 1, 2, 3, 4].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setRating(v)}
                          style={
                            rating === v
                              ? { backgroundColor: accent, color: currentCat.accentFg }
                              : undefined
                          }
                          className={`font-mono-ui flex-1 cursor-pointer rounded py-1 text-[11px] font-bold transition-colors ${
                            rating === v ? "" : "text-[#8B909C] hover:text-white"
                          }`}
                        >
                          {v === 0 ? "0" : "+".repeat(v)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Link URL field for Books, Guitar (tabs/chords/video) & Custom */}
                {(currentCat.kind === "book" || currentCat.kind === "guitar" || currentCat.kind === "custom") && (
                  <div>
                    <label className="font-mono-ui mb-1 block text-[10px] font-bold text-[#8B909C]">
                      {currentCat.kind === "guitar"
                        ? "ССЫЛКА НА ТАБЫ / РАЗБОР (URL)"
                        : "ССЫЛКА НА КНИГУ / ИСТОЧНИК (URL)"}
                    </label>
                    <input
                      type="url"
                      value={linkUrl}
                      onChange={(e) => setLinkUrl(e.target.value)}
                      placeholder="https://..."
                      className="font-mono-ui w-full rounded-lg border border-[#2A2D36] bg-[#15171B] px-3 py-2 text-xs text-[#ECEAE4] placeholder-[#5B606E] outline-none focus:border-[#555B6E]"
                    />
                  </div>
                )}

                {/* Guitar Lyrics & Chords Editor */}
                {currentCat.kind === "guitar" && (
                  <div>
                    <label className="font-mono-ui mb-1 block text-[10px] font-bold text-[#8B909C]">
                      ТЕКСТ ПЕСНИ И АККОРДЫ (МОНОШИРИННЫЙ ФОРМАТ)
                    </label>
                    <textarea
                      rows={6}
                      value={lyrics}
                      onChange={(e) => setLyrics(e.target.value)}
                      placeholder={"Am               Em\nТёплое место, но улицы ждут\nDm               G\nОтпечатков наших ног..."}
                      className="font-mono-ui custom-scroll w-full resize-y rounded-lg border border-[#2A2D36] bg-[#15171B] px-3 py-2.5 text-xs leading-relaxed text-[#ECEAE4] placeholder-[#5B606E] outline-none focus:border-[#555B6E]"
                    />
                  </div>
                )}

                {/* Comment */}
                <div>
                  <label className="font-mono-ui mb-1 block text-[10px] font-bold text-[#8B909C]">
                    КОМЕНТ
                  </label>
                  <textarea
                    rows={3}
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="честное впечатление…"
                    className="w-full resize-none rounded-lg border border-[#2A2D36] bg-[#15171B] px-3 py-2.5 text-sm text-[#ECEAE4] placeholder-[#5B606E] outline-none focus:border-[#555B6E]"
                  />
                </div>

                {statusMsg && (
                  <div className="font-mono-ui text-xs text-[#D9535F]">{statusMsg}</div>
                )}

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      style={{ backgroundColor: accent, color: currentCat.accentFg }}
                      className="cursor-pointer rounded-lg px-5 py-2.5 text-xs font-bold transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      {saving
                        ? "Сохраняю…"
                        : githubConnected
                        ? "Сохранить в GitHub →"
                        : "Сохранить →"}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="cursor-pointer rounded-lg border border-[#2A2D36] bg-[#24272E] px-4 py-2.5 text-xs font-medium text-[#9DA2AE] hover:text-white"
                    >
                      Отмена
                    </button>
                  </div>

                  {editItem && (
                    <button
                      type="button"
                      onClick={() => {
                        if (!confirmDelete) {
                          setConfirmDelete(true);
                          return;
                        }
                        handleDeleteItem();
                      }}
                      disabled={saving}
                      className={`flex cursor-pointer items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
                        confirmDelete
                          ? "border-[#D9535F] bg-[#D9535F] text-[#131417]"
                          : "border-[#5E2B31] bg-[#2C1C1F] text-[#D9535F] hover:brightness-110"
                      }`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {confirmDelete ? "Точно удалить?" : "Удалить"}
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
