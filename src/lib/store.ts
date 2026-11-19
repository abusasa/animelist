import fs from "fs/promises";
import path from "path";
import type { CatalogData, GitCommitItem } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const CATALOG_PATH = path.join(DATA_DIR, "catalog.json");
const GITLOG_PATH = path.join(DATA_DIR, "gitlog.json");

const DEFAULT_CATALOG: CatalogData = {
  categories: [
    { id: "anime", label: "АНИМЭ", slug: "anime", unit: "anime", accent: "#E07A9A", accentFg: "#131417", hasLogs: true, kind: "anime" },
    { id: "filma", label: "ФИЛЬМА", slug: "filma", unit: "filma", accent: "#9B7EDE", accentFg: "#131417", hasLogs: false, kind: "movie" },
    { id: "serialka", label: "СЕРИАЛКА", slug: "serialka", unit: "serialka", accent: "#D9535F", accentFg: "#131417", hasLogs: false, kind: "series" },
    { id: "chitalka", label: "ЧИТАЛКА", slug: "chitalka", unit: "books", accent: "#00875F", accentFg: "#F3F4F6", hasLogs: false, kind: "book" },
    { id: "gitarka", label: "ГИТАРКА", slug: "gitarka", unit: "songs", accent: "#E7E5DF", accentFg: "#131417", hasLogs: false, kind: "guitar" },
  ],
  items: [],
};

export function hasGitHubConfig(): boolean {
  return Boolean(process.env.GITHUB_TOKEN && process.env.GITHUB_REPO);
}

export async function readCatalog(): Promise<CatalogData> {
  // If GitHub API is configured in production, read live version directly from repo
  if (hasGitHubConfig() && process.env.NODE_ENV === "production") {
    try {
      const repo = process.env.GITHUB_REPO!;
      const branch = process.env.GITHUB_BRANCH || "main";
      const res = await fetch(
        `https://api.github.com/repos/${repo}/contents/data/catalog.json?ref=${branch}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
            Accept: "application/vnd.github+json",
          },
          cache: "no-store",
        }
      );
      if (res.ok) {
        const json = await res.json();
        const decoded = Buffer.from(json.content, "base64").toString("utf-8");
        return JSON.parse(decoded) as CatalogData;
      }
    } catch {
      // fallback to local bundled file
    }
  }

  try {
    const raw = await fs.readFile(CATALOG_PATH, "utf-8");
    return JSON.parse(raw) as CatalogData;
  } catch {
    return DEFAULT_CATALOG;
  }
}

export async function writeCatalog(
  catalog: CatalogData,
  commitMessage = "Update catalog via admin"
): Promise<{ mode: "github" | "local"; commitSha?: string }> {
  const contentStr = JSON.stringify(catalog, null, 2);

  if (hasGitHubConfig()) {
    const repo = process.env.GITHUB_REPO!;
    const branch = process.env.GITHUB_BRANCH || "main";
    const token = process.env.GITHUB_TOKEN!;
    const apiUrl = `https://api.github.com/repos/${repo}/contents/data/catalog.json`;

    let sha: string | undefined;
    const getRes = await fetch(`${apiUrl}?ref=${branch}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    });
    if (getRes.ok) {
      const getJson = await getRes.json();
      sha = getJson.sha;
    }

    const putRes = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: commitMessage,
        content: Buffer.from(contentStr, "utf-8").toString("base64"),
        branch,
        ...(sha ? { sha } : {}),
      }),
    });

    if (!putRes.ok) {
      const errText = await putRes.text();
      throw new Error(`GitHub API error (${putRes.status}): ${errText}`);
    }
    const putJson = await putRes.json();

    // Also update local file if writable (dev convenience)
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.writeFile(CATALOG_PATH, contentStr, "utf-8");
    } catch {
      // read-only fs on Vercel is expected
    }
    return { mode: "github", commitSha: putJson?.commit?.sha?.slice(0, 7) };
  }

  // Local file fallback (works out of the box locally)
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(CATALOG_PATH, contentStr, "utf-8");
  return { mode: "local" };
}

export async function readGitLog(): Promise<GitCommitItem[]> {
  try {
    const raw = await fs.readFile(GITLOG_PATH, "utf-8");
    return JSON.parse(raw) as GitCommitItem[];
  } catch {
    return [];
  }
}
