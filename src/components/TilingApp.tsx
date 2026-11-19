"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronUp, X } from "lucide-react";
import type { CatalogData, GitCommitItem, MediaItem } from "@/lib/types";
import { Waybar } from "./Waybar";
import { CatalogCard } from "./CatalogCard";
import { DetailsPanel, LogsPanel, StatsPanel } from "./SidePanels";
import { DetailModal } from "./DetailModal";
import { PasswordModal } from "./PasswordModal";
import { AdminModal } from "./AdminModal";
import { PosterPickerModal } from "./PosterPickerModal";

interface TilingAppProps {
  initialCatalog: CatalogData;
  initialCommits: GitCommitItem[];
  githubConnected: boolean;
}

type SortMode = "default" | "rating" | "episodes" | "rewatch" | "newest";
type FilterMode = "all" | "top" | "rewatched" | "noted";
type CardSize = "sm" | "md" | "lg";

export function TilingApp({
  initialCatalog,
  initialCommits,
  githubConnected,
}: TilingAppProps) {
  const [catalog, setCatalog] = useState<CatalogData>(initialCatalog);
  const [commits, setCommits] = useState<GitCommitItem[]>(initialCommits);
  const [activeCategoryId, setActiveCategoryId] = useState<string>(
    initialCatalog.categories[0]?.id || "anime"
  );

  // Search & Filter
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null);
  const [cardSize, setCardSize] = useState<CardSize>("md");
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  // Desktop Hyprland Tiling Panels — ALL collapsed by default!
  const [showStats, setShowStats] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  // Resizable panel dimensions on desktop
  const [leftWidth, setLeftWidth] = useState(280);
  const [rightWidth, setRightWidth] = useState(330);
  const [detailsRatio, setDetailsRatio] = useState(68); // % height for СВЕДЕНИЯ when ЛОГИ is also open
  const rightColRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<"left" | "right" | "rightSplit" | null>(null);

  // Mobile floating sheet ("stats" | "logs" | null) — details opens DetailModal directly on mobile
  const [mobileSheet, setMobileSheet] = useState<"stats" | "logs" | null>(null);

  // Selection & Modals
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [modalItem, setModalItem] = useState<MediaItem | null>(null);

  // Admin & Auth
  const [isAdmin, setIsAdmin] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MediaItem | null>(null);
  const [posterTarget, setPosterTarget] = useState<MediaItem | null>(null);
  const [saveBadge, setSaveBadge] = useState<string | null>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);

  // Close Filter dropdown on click outside
  useEffect(() => {
    if (!filterMenuOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (filterMenuRef.current && !filterMenuRef.current.contains(e.target as Node)) {
        setFilterMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [filterMenuOpen]);

  const activeCategory = useMemo(
    () =>
      catalog.categories.find((c) => c.id === activeCategoryId) ||
      catalog.categories[0],
    [catalog.categories, activeCategoryId]
  );

  const categoryItems = useMemo(
    () => catalog.items.filter((i) => i.category === activeCategory.id),
    [catalog.items, activeCategory.id]
  );

  // Check existing admin cookie session + live git commits
  useEffect(() => {
    fetch("/api/auth")
      .then((r) => r.json())
      .then((d) => {
        if (d.authenticated) setIsAdmin(true);
      })
      .catch(() => {});

    fetch("/api/gitlog")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.commits) && d.commits.length > 0) {
          setCommits(d.commits);
        }
      })
      .catch(() => {});
  }, []);

  // Update CSS accent variable when category switches
  useEffect(() => {
    document.documentElement.style.setProperty("--accent", activeCategory.accent);
    document.documentElement.style.setProperty("--accent-fg", activeCategory.accentFg);
  }, [activeCategory]);

  // Hide Logs panel if switching to a category without logs
  useEffect(() => {
    if (!activeCategory.hasLogs) {
      setShowLogs(false);
      if (mobileSheet === "logs") setMobileSheet(null);
    }
  }, [activeCategory.hasLogs, mobileSheet]);

  // Keyboard shortcuts: "/" for search, 1-5 for categories
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const inInput =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT";
      if (inInput) return;

      if (e.key === "/") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key >= "1" && e.key <= "9") {
        const idx = Number(e.key) - 1;
        if (catalog.categories[idx]) {
          handleSelectCategory(catalog.categories[idx].id);
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [catalog.categories]);

  // Restore preferred card size from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("abusamat_card_size");
      if (saved === "sm" || saved === "md" || saved === "lg") {
        setCardSize(saved);
      }
    } catch {}
  }, []);

  function updateCardSize(next: CardSize) {
    setCardSize(next);
    try {
      localStorage.setItem("abusamat_card_size", next);
    } catch {}
  }

  // Smooth mouse drag resizing for desktop tiling panels (horizontal + vertical between СВЕДЕНИЯ & ЛОГИ)
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      if (draggingRef.current === "left") {
        const w = Math.max(220, Math.min(420, e.clientX - 16));
        setLeftWidth(w);
      } else if (draggingRef.current === "right") {
        const w = Math.max(240, Math.min(520, window.innerWidth - e.clientX - 16));
        setRightWidth(w);
      } else if (draggingRef.current === "rightSplit" && rightColRef.current) {
        const rect = rightColRef.current.getBoundingClientRect();
        const relY = e.clientY - rect.top;
        const pct = Math.max(24, Math.min(82, (relY / rect.height) * 100));
        setDetailsRatio(pct);
      }
    };
    const onMouseUp = () => {
      if (draggingRef.current) {
        draggingRef.current = null;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  function startResize(side: "left" | "right" | "rightSplit") {
    draggingRef.current = side;
    document.body.style.cursor = side === "rightSplit" ? "row-resize" : "col-resize";
    document.body.style.userSelect = "none";
  }

  function handleSelectCategory(id: string) {
    setActiveCategoryId(id);
    setSearch("");
    setFilterMode("all");
    setSortMode("default");
    setSelectedGenre(null);
    setFilterMenuOpen(false);
    setSelectedItemId(null);
  }

  // Unique genres present in current category, ordered by frequency
  const availableGenres = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of categoryItems) {
      for (const g of item.genres || []) {
        const clean = g.trim();
        if (clean) counts.set(clean, (counts.get(clean) || 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([g]) => g);
  }, [categoryItems]);

  // Filtered & sorted items
  const visibleItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = categoryItems.filter((item) => {
      if (filterMode === "top" && item.rating < 3) return false;
      if (filterMode === "rewatched" && (item.rewatch || 1) < 2) return false;
      if (filterMode === "noted" && !item.note?.trim()) return false;
      if (selectedGenre && !(item.genres || []).includes(selectedGenre)) return false;
      if (!q) return true;
      const haystack = [
        item.title,
        item.origTitle,
        item.studio,
        item.author,
        item.artist,
        item.chords,
        item.note,
        ...(item.genres || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });

    if (sortMode === "rating") {
      list = [...list].sort((a, b) => b.rating - a.rating || (b.rewatch || 1) - (a.rewatch || 1));
    } else if (sortMode === "episodes") {
      list = [...list].sort(
        (a, b) =>
          (b.episodes || b.pagesRead || 0) - (a.episodes || a.pagesRead || 0)
      );
    } else if (sortMode === "rewatch") {
      list = [...list].sort((a, b) => (b.rewatch || 1) - (a.rewatch || 1));
    } else if (sortMode === "newest") {
      list = [...list].sort((a, b) => b.number - a.number);
    }

    return list;
  }, [categoryItems, search, filterMode, sortMode, selectedGenre]);

  const selectedItem = useMemo(() => {
    if (selectedItemId) {
      const found = categoryItems.find((i) => i.id === selectedItemId);
      if (found) return found;
    }
    return visibleItems[0] || categoryItems[0] || null;
  }, [selectedItemId, categoryItems, visibleItems]);

  function handleCardClick(item: MediaItem) {
    setSelectedItemId(item.id);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      // Mobile: open floating detail card on top
      setModalItem(item);
    } else {
      // Desktop: slide out right СВЕДЕНИЯ tile
      setShowDetails(true);
    }
  }

  function handleOpenAuthOrAdmin() {
    if (isAdmin) {
      setEditingItem(null);
      setShowAdminModal(true);
    } else {
      setShowPasswordModal(true);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth", { method: "DELETE" });
    setIsAdmin(false);
    setShowAdminModal(false);
    setPosterTarget(null);
  }

  // Instant inline edit directly on the page (optimistic UI + rollback on error)
  async function handleQuickUpdate(updated: MediaItem) {
    const prevCatalog = catalog;
    const prevModal = modalItem;
    setCatalog((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === updated.id ? updated : it)),
    }));
    if (modalItem?.id === updated.id) {
      setModalItem(updated);
    }
    setSaveBadge("сохраняю…");
    try {
      const res = await fetch("/api/admin/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upsert-item", item: updated }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.catalog) setCatalog(data.catalog);
        setSaveBadge("сохранено ✓");
      } else {
        setCatalog(prevCatalog);
        setModalItem(prevModal);
        setSaveBadge("ошибка сохранения");
      }
    } catch {
      setCatalog(prevCatalog);
      setModalItem(prevModal);
      setSaveBadge("ошибка сети");
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => setSaveBadge(null), 2200);
  }

  const accent = activeCategory.accent;
  const hasRightCol = showDetails || (showLogs && activeCategory.hasLogs);
  const showDesktopBottomDock =
    !showStats || !showDetails || (activeCategory.hasLogs && !showLogs);

  // Fluid auto-fill grid: cards smoothly grow/shrink with window width,
  // auto-add columns so they never blow up AND never leave empty space on the right
  const gridColsClass =
    activeCategory.kind === "guitar"
      ? cardSize === "sm"
        ? "grid-cols-1 sm:[grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]"
        : cardSize === "lg"
        ? "grid-cols-1 md:[grid-template-columns:repeat(auto-fill,minmax(400px,1fr))]"
        : "grid-cols-1 md:[grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]"
      : cardSize === "sm"
      ? "grid-cols-3 sm:[grid-template-columns:repeat(auto-fill,minmax(140px,1fr))]"
      : cardSize === "lg"
      ? "grid-cols-1 sm:[grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]"
      : "grid-cols-2 sm:[grid-template-columns:repeat(auto-fill,minmax(185px,1fr))]";

  const isFiltered =
    filterMode !== "all" ||
    sortMode !== "default" ||
    selectedGenre !== null ||
    search.trim() !== "";

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-[#131417] text-[#ECEAE4]">
      {/* Top Waybar */}
      <Waybar
        categories={catalog.categories}
        activeCategory={activeCategory}
        itemCount={categoryItems.length}
        isAdmin={isAdmin}
        saveBadge={saveBadge}
        onSelectCategory={handleSelectCategory}
        onOpenAuthOrAdmin={handleOpenAuthOrAdmin}
        onOpenAddModal={() => {
          setEditingItem(null);
          setShowAdminModal(true);
        }}
        onLogout={handleLogout}
      />

      {/* Main Tiling Manager Workspace */}
      <main className="flex min-h-0 flex-1 gap-0 overflow-hidden p-2.5 sm:p-4 sm:pt-3">
        {/* LEFT TILE (Desktop only): СТАТИСТИКА */}
        {showStats && (
          <div
            style={{ width: `${leftWidth}px` }}
            className="anim-tile-left hidden h-full shrink-0 lg:flex"
          >
            <div className="h-full min-w-0 flex-1">
              <StatsPanel
                category={activeCategory}
                items={categoryItems}
                onCollapse={() => setShowStats(false)}
                onSelectItem={(it) => {
                  setSelectedItemId(it.id);
                  setShowDetails(true);
                }}
              />
            </div>
            {/* Left Resize Handle */}
            <div
              role="separator"
              aria-orientation="vertical"
              title="Потяни, чтобы изменить ширину"
              onMouseDown={() => startResize("left")}
              className="group flex w-3 shrink-0 cursor-col-resize items-center justify-center"
            >
              <div className="h-12 w-[3px] rounded-full bg-[#2A2D36] transition-colors group-hover:bg-[#646975]" />
            </div>
          </div>
        )}

        {/* CENTER MAIN TILE: СПИСОК (Always visible, contains compact bottom dock INSIDE tiling window!) */}
        <section
          style={{ borderColor: accent }}
          className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-[#1B1D22] transition-all duration-200"
        >
          {/* Window Title + Search + Filter Controls */}
          <div className="shrink-0 px-3.5 pt-3 pb-2.5 sm:px-5 sm:pt-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span
                style={{ color: accent }}
                className="font-mono-ui text-[11px] font-bold tracking-[0.08em]"
              >
                СПИСОК
              </span>
              <span className="font-mono-ui text-[10px] text-[#646975]">
                {visibleItems.length === categoryItems.length
                  ? `${categoryItems.length} записей`
                  : `найдено ${visibleItems.length} из ${categoryItems.length}`}
              </span>
            </div>

            <div className="relative flex items-center gap-2">
              <div className="flex h-9 min-w-0 flex-1 items-center rounded-lg border border-[#2A2D36] bg-[#15171B] px-3 focus-within:border-[#494E5E]">
                <span className="font-mono-ui mr-2 text-xs text-[#646975]">/</span>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="названия..."
                  className="font-mono-ui w-full bg-transparent text-xs text-[#ECEAE4] placeholder-[#5B606E] outline-none sm:text-[13px]"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    aria-label="Очистить поиск"
                    className="cursor-pointer text-[#646975] hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setFilterMode("all");
                  setSortMode("default");
                  setSelectedGenre(null);
                  setFilterMenuOpen(false);
                }}
                style={
                  !isFiltered
                    ? { backgroundColor: accent, color: activeCategory.accentFg }
                    : undefined
                }
                className={`h-9 shrink-0 cursor-pointer rounded-lg px-3.5 text-xs font-bold transition-colors ${
                  !isFiltered
                    ? ""
                    : "border border-[#2A2D36] bg-[#24272E] text-[#9DA2AE] hover:text-white"
                }`}
              >
                Все
              </button>

              <div ref={filterMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setFilterMenuOpen((v) => !v)}
                  style={
                    isFiltered || filterMenuOpen
                      ? {
                          borderColor: accent,
                          color: accent,
                        }
                      : undefined
                  }
                  className="flex h-9 shrink-0 cursor-pointer items-center gap-1 rounded-lg border border-[#2A2D36] bg-[#24272E] px-3 text-xs font-medium text-[#ECEAE4] transition-colors hover:bg-[#2C303A]"
                >
                  <span>Фильтр</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>

                {filterMenuOpen && (
                  <div className="anim-modal custom-scroll absolute right-0 z-30 mt-1.5 max-h-[75vh] w-64 overflow-y-auto rounded-xl border border-[#343844] bg-[#15171B] p-2.5 shadow-xl">
                    <div className="font-mono-ui mb-1.5 px-1 text-[10px] font-bold text-[#646975]">
                      ПОКАЗАТЬ
                    </div>
                    <div className="flex flex-col gap-1">
                      {(
                        [
                          ["all", "Все записи"],
                          ["top", "Высший балл (+++)"],
                          ["rewatched", "Пересмотренные (2×+)"],
                          ["noted", "С личными заметками"],
                        ] as [FilterMode, string][]
                      ).map(([m, lbl]) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => {
                            setFilterMode(m);
                            setFilterMenuOpen(false);
                          }}
                          style={
                            filterMode === m
                              ? { backgroundColor: accent, color: activeCategory.accentFg }
                              : undefined
                          }
                          className={`cursor-pointer rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                            filterMode === m
                              ? "font-bold"
                              : "text-[#C8CBD4] hover:bg-[#24272E]"
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>

                    <div className="my-2 h-px bg-[#2A2D36]" />
                    <div className="font-mono-ui mb-1.5 px-1 text-[10px] font-bold text-[#646975]">
                      СОРТИРОВКА
                    </div>
                    <div className="flex flex-col gap-1">
                      {(
                        [
                          ["default", "По порядку списка"],
                          ["newest", "Сначала новые"],
                          ["rating", "По оценке (++++)"],
                          ["episodes", activeCategory.kind === "book" ? "По страницам" : "По сериям"],
                          ["rewatch", "По пересмотрам"],
                        ] as [SortMode, string][]
                      ).map(([s, lbl]) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            setSortMode(s);
                            setFilterMenuOpen(false);
                          }}
                          style={
                            sortMode === s
                              ? { backgroundColor: accent, color: activeCategory.accentFg }
                              : undefined
                          }
                          className={`cursor-pointer rounded-md px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                            sortMode === s
                              ? "font-bold"
                              : "text-[#C8CBD4] hover:bg-[#24272E]"
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                    {availableGenres.length > 0 && (
                      <>
                        <div className="my-2 h-px bg-[#2A2D36]" />
                        <div className="mb-1.5 flex items-center justify-between px-1">
                          <span className="font-mono-ui text-[10px] font-bold text-[#646975]">
                            ЖАНРЫ
                          </span>
                          {selectedGenre && (
                            <button
                              type="button"
                              onClick={() => setSelectedGenre(null)}
                              className="font-mono-ui cursor-pointer text-[10px] text-[#8B909C] hover:text-white"
                            >
                              сброс
                            </button>
                          )}
                        </div>
                        <div className="custom-scroll flex max-h-36 flex-wrap gap-1 overflow-y-auto pr-0.5">
                          {availableGenres.map((g) => {
                            const active = selectedGenre === g;
                            return (
                              <button
                                key={g}
                                type="button"
                                onClick={() => setSelectedGenre(active ? null : g)}
                                style={
                                  active
                                    ? { backgroundColor: accent, color: activeCategory.accentFg }
                                    : undefined
                                }
                                className={`cursor-pointer rounded-md px-2 py-1 text-[11px] font-medium transition-colors ${
                                  active
                                    ? "font-bold"
                                    : "bg-[#24272E] text-[#C8CBD4] hover:text-white"
                                }`}
                              >
                                {g}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}

                    <div className="my-2 h-px bg-[#2A2D36]" />
                    <div className="font-mono-ui mb-1.5 px-1 text-[10px] font-bold text-[#646975]">
                      РАЗМЕР КАРТОЧЕК
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {(
                        [
                          ["sm", "Меньше"],
                          ["md", "Средний"],
                          ["lg", "Огромный"],
                        ] as [CardSize, string][]
                      ).map(([sz, lbl]) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => updateCardSize(sz)}
                          style={
                            cardSize === sz
                              ? { backgroundColor: accent, color: activeCategory.accentFg }
                              : undefined
                          }
                          className={`cursor-pointer rounded-md px-1.5 py-1.5 text-center text-[11px] font-medium transition-colors ${
                            cardSize === sz
                              ? "font-bold"
                              : "bg-[#24272E] text-[#C8CBD4] hover:text-white"
                          }`}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable Large Posters Catalog */}
          <div className="custom-scroll min-h-0 flex-1 overflow-y-auto px-3.5 pt-1.5 pb-4 sm:px-5 sm:pb-5">
            {visibleItems.length === 0 ? (
              <div className="flex h-full min-h-[280px] flex-col items-center justify-center gap-3 text-center">
                <p className="font-mono-ui text-xs text-[#8B909C]">
                  {isFiltered
                    ? "Ничего не найдено по текущему фильтру"
                    : `В разделе ${activeCategory.label} пока нет записей`}
                </p>
                {isFiltered ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      setFilterMode("all");
                      setSortMode("default");
                      setSelectedGenre(null);
                    }}
                    style={{ backgroundColor: accent, color: activeCategory.accentFg }}
                    className="cursor-pointer rounded-lg px-3.5 py-2 text-xs font-bold"
                  >
                    Сбросить фильтры
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleOpenAuthOrAdmin}
                    style={{ backgroundColor: accent, color: activeCategory.accentFg }}
                    className="cursor-pointer rounded-lg px-4 py-2 text-xs font-bold transition-opacity hover:opacity-90"
                  >
                    + Добавить первую запись
                  </button>
                )}
              </div>
            ) : (
              <div className={`grid gap-x-4 gap-y-5 sm:gap-x-5 sm:gap-y-6 ${gridColsClass}`}>
                {visibleItems.map((item) => (
                  <CatalogCard
                    key={item.id}
                    item={item}
                    category={activeCategory}
                    isSelected={selectedItem?.id === item.id && showDetails}
                    isAdmin={isAdmin}
                    onSelect={() => handleCardClick(item)}
                    onOpenModal={() => {
                      setSelectedItemId(item.id);
                      setModalItem(item);
                    }}
                    onQuickUpdate={handleQuickUpdate}
                    onChangePoster={(it) => setPosterTarget(it)}
                    onEditItem={(it) => {
                      setEditingItem(it);
                      setShowAdminModal(true);
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* INSIDE TILING WINDOW: Non-overlapping Compact Bottom Dock (Desktop) */}
          {showDesktopBottomDock && (
            <div className="hidden shrink-0 items-center justify-between border-t border-[#24272E] bg-[#16181D] px-3.5 py-2 lg:flex">
              {/* Left: СТАТИСТИКА (disappears when open!) */}
              <div className="flex w-1/3 justify-start">
                {!showStats && (
                  <button
                    type="button"
                    onClick={() => setShowStats(true)}
                    className="font-mono-ui flex h-7 cursor-pointer items-center gap-1.5 rounded-lg border border-[#343844] bg-[#1B1D22] px-3 text-[10px] font-bold tracking-wider text-[#D4D2CC] transition-colors hover:border-[#555B6E] hover:text-white"
                  >
                    <ChevronUp className="h-3 w-3" style={{ color: accent }} />
                    СТАТИСТИКА
                  </button>
                )}
              </div>

              {/* Center: СВЕДЕНИЯ (disappears when open!) */}
              <div className="flex w-1/3 justify-center">
                {!showDetails && (
                  <button
                    type="button"
                    onClick={() => setShowDetails(true)}
                    className="font-mono-ui flex h-7 cursor-pointer items-center gap-1.5 rounded-lg border border-[#343844] bg-[#1B1D22] px-3 text-[10px] font-bold tracking-wider text-[#D4D2CC] transition-colors hover:border-[#555B6E] hover:text-white"
                  >
                    <ChevronUp className="h-3 w-3" style={{ color: accent }} />
                    СВЕДЕНИЯ
                  </button>
                )}
              </div>

              {/* Right: ЛОГИ (only for АНИМЭ, disappears when open!) */}
              <div className="flex w-1/3 justify-end">
                {activeCategory.hasLogs && !showLogs && (
                  <button
                    type="button"
                    onClick={() => setShowLogs(true)}
                    className="font-mono-ui flex h-7 cursor-pointer items-center gap-1.5 rounded-lg border border-[#343844] bg-[#1B1D22] px-3 text-[10px] font-bold tracking-wider text-[#D4D2CC] transition-colors hover:border-[#555B6E] hover:text-white"
                  >
                    <ChevronUp className="h-3 w-3" style={{ color: accent }} />
                    ЛОГИ
                  </button>
                )}
              </div>
            </div>
          )}

          {/* INSIDE TILING WINDOW: Non-overlapping Compact Mobile Bottom Dock (< lg) */}
          <div className="flex shrink-0 items-center justify-between gap-2 border-t border-[#24272E] bg-[#16181D] px-2.5 py-2 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileSheet("stats")}
              className="font-mono-ui flex h-8 flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-[#343844] bg-[#1B1D22] text-[10px] font-bold text-[#ECEAE4]"
            >
              <ChevronUp className="h-3 w-3" style={{ color: accent }} />
              СТАТИСТИКА
            </button>
            <button
              type="button"
              onClick={() => {
                if (selectedItem) setModalItem(selectedItem);
              }}
              className="font-mono-ui flex h-8 flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-[#343844] bg-[#1B1D22] text-[10px] font-bold text-[#ECEAE4]"
            >
              <ChevronUp className="h-3 w-3" style={{ color: accent }} />
              СВЕДЕНИЯ
            </button>
            {activeCategory.hasLogs && (
              <button
                type="button"
                onClick={() => setMobileSheet("logs")}
                className="font-mono-ui flex h-8 flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg border border-[#343844] bg-[#1B1D22] text-[10px] font-bold text-[#ECEAE4]"
              >
                <ChevronUp className="h-3 w-3" style={{ color: accent }} />
                ЛОГИ
              </button>
            )}
          </div>
        </section>

        {/* RIGHT COLUMN (Desktop only): СВЕДЕНИЯ and/or ЛОГИ with resizable split */}
        {hasRightCol && (
          <div
            style={{ width: `${rightWidth}px` }}
            className="anim-tile-right hidden h-full shrink-0 lg:flex"
          >
            {/* Right Resize Handle */}
            <div
              role="separator"
              aria-orientation="vertical"
              title="Потяни, чтобы сделать СВЕДЕНИЯ уже или шире"
              onMouseDown={() => startResize("right")}
              className="group flex w-3 shrink-0 cursor-col-resize items-center justify-center"
            >
              <div className="h-12 w-[3px] rounded-full bg-[#2A2D36] transition-colors group-hover:bg-[#646975]" />
            </div>

            <div ref={rightColRef} className="flex h-full min-w-0 flex-1 flex-col">
              {showDetails && (
                <div
                  style={
                    showLogs && activeCategory.hasLogs
                      ? { height: `${detailsRatio}%` }
                      : undefined
                  }
                  className={`min-h-0 ${showLogs && activeCategory.hasLogs ? "shrink-0" : "flex-1"}`}
                >
                  <DetailsPanel
                    category={activeCategory}
                    item={selectedItem}
                    isAdmin={isAdmin}
                    onCollapse={() => setShowDetails(false)}
                    onExpandModal={() => {
                      if (selectedItem) setModalItem(selectedItem);
                    }}
                    onEditItem={(it) => {
                      setEditingItem(it);
                      setShowAdminModal(true);
                    }}
                    onQuickUpdate={handleQuickUpdate}
                    onChangePoster={(it) => setPosterTarget(it)}
                  />
                </div>
              )}

              {/* Vertical Resize Handle between СВЕДЕНИЯ and ЛОГИ */}
              {showDetails && showLogs && activeCategory.hasLogs && (
                <div
                  role="separator"
                  aria-orientation="horizontal"
                  title="Потяни, чтобы изменить размер между СВЕДЕНИЯ и ЛОГИ"
                  onMouseDown={() => startResize("rightSplit")}
                  className="group flex h-3 shrink-0 cursor-row-resize items-center justify-center"
                >
                  <div className="h-[3px] w-12 rounded-full bg-[#2A2D36] transition-colors group-hover:bg-[#646975]" />
                </div>
              )}

              {showLogs && activeCategory.hasLogs && (
                <div className="anim-tile-bottom min-h-0 flex-1">
                  <LogsPanel
                    accent={accent}
                    commits={commits}
                    onCollapse={() => setShowLogs(false)}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* MOBILE FLOATING SHEETS (Stats / Logs) */}
      {mobileSheet && (
        <div
          className="fixed inset-0 z-50 flex items-end bg-black/75 p-2 lg:hidden"
          onClick={() => setMobileSheet(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="anim-tile-bottom h-[76dvh] w-full"
          >
            {mobileSheet === "stats" ? (
              <StatsPanel
                category={activeCategory}
                items={categoryItems}
                onCollapse={() => setMobileSheet(null)}
                onSelectItem={(it) => {
                  setMobileSheet(null);
                  setSelectedItemId(it.id);
                  setModalItem(it);
                }}
              />
            ) : (
              <LogsPanel
                accent={accent}
                commits={commits}
                onCollapse={() => setMobileSheet(null)}
              />
            )}
          </div>
        </div>
      )}

      {/* LARGE DETAIL MODAL (Screenshot #2 + Mobile Detail Card) */}
      {modalItem && (
        <DetailModal
          item={modalItem}
          category={activeCategory}
          isAdmin={isAdmin}
          onClose={() => setModalItem(null)}
          onEdit={(it) => {
            setModalItem(null);
            setEditingItem(it);
            setShowAdminModal(true);
          }}
          onQuickUpdate={handleQuickUpdate}
          onChangePoster={(it) => setPosterTarget(it)}
        />
      )}

      {/* QUICK POSTER PICKER (Upload from PC / URL / Internet search) */}
      {posterTarget && isAdmin && (
        <PosterPickerModal
          item={posterTarget}
          category={activeCategory}
          onApply={async (url, source) => {
            await handleQuickUpdate({
              ...posterTarget,
              poster: url,
              posterSource: source,
            });
          }}
          onClose={() => setPosterTarget(null)}
        />
      )}

      {/* ULTRA-MINIMAL PASSWORD MODAL — logs in directly into inline edit mode! */}
      {showPasswordModal && (
        <PasswordModal
          accent={accent}
          accentFg={activeCategory.accentFg}
          onSuccess={() => {
            setIsAdmin(true);
            setShowPasswordModal(false);
            setSaveBadge("режим редактирования");
            if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
            saveTimerRef.current = setTimeout(() => setSaveBadge(null), 2400);
          }}
          onClose={() => setShowPasswordModal(false)}
        />
      )}

      {/* MINIMALIST ADMIN PANEL */}
      {showAdminModal && isAdmin && (
        <AdminModal
          categories={catalog.categories}
          activeCategory={activeCategory}
          editItem={editingItem}
          githubConnected={githubConnected}
          onSaved={(updated, switchCatId) => {
            setCatalog(updated);
            if (switchCatId) setActiveCategoryId(switchCatId);
          }}
          onLogout={handleLogout}
          onClose={() => {
            setShowAdminModal(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
}
