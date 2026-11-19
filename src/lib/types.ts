export type CategoryKind = "anime" | "movie" | "series" | "book" | "guitar" | "custom";

export interface CategoryDef {
  id: string;
  label: string;
  slug: string;
  unit: string;
  accent: string;
  accentFg: string;
  hasLogs?: boolean;
  kind: CategoryKind;
}

export interface MediaItem {
  id: string;
  number: number;
  category: string;
  title: string;
  origTitle?: string;
  studio?: string;
  author?: string;
  artist?: string;
  year?: number | null;
  episodes?: number;
  seasons?: number;
  duration?: string;
  pagesRead?: number;
  pagesTotal?: number;
  tuning?: string;
  chords?: string;
  lyrics?: string;
  skillStatus?: string;
  linkUrl?: string;
  rewatch?: number;
  rating: number; // 0..5 -> "+", "++", "+++", "++++"
  date: string;
  commitHash?: string;
  note?: string;
  genres?: string[];
  poster?: string;
  posterSource?: string;
}

export interface CatalogData {
  categories: CategoryDef[];
  items: MediaItem[];
}

export interface GitCommitItem {
  hash: string;
  date: string;
  subject: string;
  body?: string;
}

export interface MediaSearchResult {
  title: string;
  origTitle?: string;
  studio?: string;
  author?: string;
  artist?: string;
  year?: number | null;
  episodes?: number;
  pagesTotal?: number;
  duration?: string;
  genres?: string[];
  poster: string;
  source: string;
}
