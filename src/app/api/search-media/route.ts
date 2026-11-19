import { NextResponse } from "next/server";
import type { MediaSearchResult } from "@/lib/types";

export const dynamic = "force-dynamic";

async function searchAnime(q: string): Promise<MediaSearchResult[]> {
  const results: MediaSearchResult[] = [];
  const hasCyrillic = /[а-яё]/i.test(q);

  // 1. Shikimori excels at Russian anime titles
  try {
    const sRes = await fetch(
      `https://shikimori.one/api/animes?limit=6&search=${encodeURIComponent(q)}`,
      {
        headers: { "User-Agent": "AbusamatArchive/2.0", Accept: "application/json" },
        cache: "no-store",
      }
    );
    if (sRes.ok) {
      const arr = await sRes.json();
      for (const a of arr) {
        const img = a?.image?.original || a?.image?.preview || "";
        const poster = img.startsWith("/") ? `https://shikimori.one${img}` : img;
        const year = a?.aired_on ? Number(String(a.aired_on).slice(0, 4)) || null : null;
        results.push({
          title: a.russian || a.name,
          origTitle: a.name || "",
          year,
          episodes: a.episodes || a.episodes_aired || 0,
          poster,
          source: "Shikimori API",
          genres: [],
        });
      }
    }
  } catch {
    // ignore and try AniList
  }

  // 2. AniList GraphQL (high-res covers, studio & genres)
  const aniQuery = !hasCyrillic ? q : results[0]?.origTitle || q;
  try {
    const gql = `
      query ($search: String) {
        Page(page: 1, perPage: 6) {
          media(search: $search, type: ANIME) {
            title { romaji english }
            seasonYear
            episodes
            genres
            studios(isMain: true) { nodes { name } }
            coverImage { extraLarge large }
          }
        }
      }
    `;
    const aRes = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query: gql, variables: { search: aniQuery } }),
      cache: "no-store",
    });
    if (aRes.ok) {
      const data = await aRes.json();
      const list = data?.data?.Page?.media || [];
      for (const m of list) {
        const romaji = m.title?.romaji || m.title?.english || "";
        const studio = m.studios?.nodes?.[0]?.name || "";
        const poster = m.coverImage?.extraLarge || m.coverImage?.large || "";
        // Enrich matching Shikimori item or append
        const match = results.find(
          (r) => r.origTitle && r.origTitle.toLowerCase() === romaji.toLowerCase()
        );
        if (match) {
          if (poster) {
            match.poster = poster;
            match.source = "AniList API";
          }
          if (studio) match.studio = studio;
          if (m.genres?.length) match.genres = m.genres.slice(0, 3);
        } else {
          results.push({
            title: m.title?.english || romaji,
            origTitle: romaji,
            studio,
            year: m.seasonYear || null,
            episodes: m.episodes || 0,
            genres: (m.genres || []).slice(0, 3),
            poster,
            source: "AniList API",
          });
        }
      }
    }
  } catch {
    // ignore
  }

  return results.slice(0, 8);
}

async function searchMovies(q: string): Promise<MediaSearchResult[]> {
  const results: MediaSearchResult[] = [];

  // 1. IMDb Suggestion API — fast, no API key, understands Russian & English queries, HD posters
  try {
    const res = await fetch(
      `https://v3.sg.media-imdb.com/suggestion/x/${encodeURIComponent(q)}.json`,
      {
        headers: { "User-Agent": "AbusamatArchive/2.0", Accept: "application/json" },
        cache: "no-store",
      }
    );
    if (res.ok) {
      const data = await res.json();
      for (const item of data.d || []) {
        const qid = String(item.qid || "").toLowerCase();
        if (qid && qid !== "movie" && qid !== "tvmovie" && qid !== "video") continue;
        const rawUrl = item.i?.imageUrl ? String(item.i.imageUrl) : "";
        // Request crisp 600px vertical poster from IMDb CDN
        const poster = rawUrl
          ? rawUrl.replace(/\._V1_.*\./, "._V1_UX600.")
          : "";
        results.push({
          title: String(item.l || ""),
          origTitle: String(item.l || ""),
          studio: String(item.s || ""),
          year: typeof item.y === "number" ? item.y : null,
          genres: [],
          poster,
          source: "IMDb",
        });
      }
    }
  } catch {
    // fallback below
  }

  // 2. iTunes fallback (useful for duration & genre metadata on English/global titles)
  if (results.length < 4) {
    try {
      const res = await fetch(
        `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=movie&limit=6`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        for (const m of data.results || []) {
          const title = String(m.trackName || "");
          if (results.some((r) => r.title.toLowerCase() === title.toLowerCase())) continue;
          const art = String(m.artworkUrl100 || "").replace("100x100bb", "600x900bb");
          const ms = Number(m.trackTimeMillis || 0);
          const mins = Math.round(ms / 60000);
          const dur = mins > 0 ? `${Math.floor(mins / 60)}ч ${mins % 60}м` : "";
          const yr = m.releaseDate ? Number(String(m.releaseDate).slice(0, 4)) || null : null;
          results.push({
            title,
            origTitle: String(m.trackCensoredName || ""),
            studio: String(m.artistName || ""),
            year: yr,
            duration: dur,
            genres: m.primaryGenreName ? [String(m.primaryGenreName)] : [],
            poster: art,
            source: "iTunes",
          });
        }
      }
    } catch {
      // ignore
    }
  }

  return results.slice(0, 8);
}

async function searchSeries(q: string): Promise<MediaSearchResult[]> {
  const results: MediaSearchResult[] = [];

  // 1. IMDb Suggestion API (supports Russian & English series names)
  try {
    const res = await fetch(
      `https://v3.sg.media-imdb.com/suggestion/x/${encodeURIComponent(q)}.json`,
      {
        headers: { "User-Agent": "AbusamatArchive/2.0", Accept: "application/json" },
        cache: "no-store",
      }
    );
    if (res.ok) {
      const data = await res.json();
      for (const item of data.d || []) {
        const qid = String(item.qid || "").toLowerCase();
        if (qid !== "tvseries" && qid !== "tvminiseries") continue;
        const rawUrl = item.i?.imageUrl ? String(item.i.imageUrl) : "";
        const poster = rawUrl ? rawUrl.replace(/\._V1_.*\./, "._V1_UX600.") : "";
        results.push({
          title: String(item.l || ""),
          origTitle: String(item.l || ""),
          studio: String(item.s || ""),
          year: typeof item.y === "number" ? item.y : null,
          genres: [],
          poster,
          source: "IMDb",
        });
      }
    }
  } catch {
    // ignore
  }

  // 2. TVMaze for genres & network
  try {
    const res = await fetch(
      `https://api.tvmaze.com/search/shows?q=${encodeURIComponent(q)}`,
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      for (const entry of (data || []).slice(0, 6)) {
        const s = (entry?.show || {}) as Record<string, unknown>;
        const title = String(s.name || "");
        if (results.some((r) => r.title.toLowerCase() === title.toLowerCase())) continue;
        const img = (s.image as Record<string, string> | undefined) || {};
        const net = (s.network as Record<string, string> | undefined) || (s.webChannel as Record<string, string> | undefined) || {};
        const yr = s.premiered ? Number(String(s.premiered).slice(0, 4)) || null : null;
        results.push({
          title,
          origTitle: title,
          studio: String(net.name || ""),
          year: yr,
          genres: Array.isArray(s.genres) ? (s.genres as string[]).slice(0, 3) : [],
          poster: img.original || img.medium || "",
          source: "TVMaze API",
        });
      }
    }
  } catch {
    // ignore
  }

  return results.slice(0, 8);
}

async function searchBooks(q: string): Promise<MediaSearchResult[]> {
  try {
    const res = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=8`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.docs || []).slice(0, 8).map((b: Record<string, unknown>) => {
      const coverId = b.cover_i;
      const poster = coverId ? `https://covers.openlibrary.org/b/id/${coverId}-L.jpg` : "";
      const authors = Array.isArray(b.author_name) ? (b.author_name as string[]) : [];
      return {
        title: String(b.title || ""),
        author: authors[0] || "",
        year: typeof b.first_publish_year === "number" ? b.first_publish_year : null,
        pagesTotal: typeof b.number_of_pages_median === "number" ? b.number_of_pages_median : 0,
        genres: Array.isArray(b.subject) ? (b.subject as string[]).slice(0, 2) : [],
        poster,
        source: "OpenLibrary API",
      };
    });
  } catch {
    return [];
  }
}

async function searchGuitar(q: string): Promise<MediaSearchResult[]> {
  try {
    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=8`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((t: Record<string, unknown>) => ({
      title: String(t.trackName || ""),
      artist: String(t.artistName || ""),
      year: t.releaseDate ? Number(String(t.releaseDate).slice(0, 4)) || null : null,
      genres: t.primaryGenreName ? [String(t.primaryGenreName)] : [],
      poster: String(t.artworkUrl100 || "").replace("100x100bb", "600x600bb"),
      source: "iTunes Music API",
    }));
  } catch {
    return [];
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") || "").trim();
  const kind = searchParams.get("kind") || "anime";

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  let results: MediaSearchResult[] = [];
  if (kind === "anime") results = await searchAnime(q);
  else if (kind === "movie") results = await searchMovies(q);
  else if (kind === "series") results = await searchSeries(q);
  else if (kind === "book") results = await searchBooks(q);
  else if (kind === "guitar") results = await searchGuitar(q);
  else results = await searchAnime(q);

  return NextResponse.json({ results });
}
