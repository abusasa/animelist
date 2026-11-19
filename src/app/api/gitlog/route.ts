import { NextResponse } from "next/server";
import { readGitLog } from "@/lib/store";
import type { GitCommitItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const repo = process.env.GITHUB_REPO || "abusasa/animelist";
  try {
    const headers: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "AbusamatArchive/2.0",
    };
    if (process.env.GITHUB_TOKEN) {
      headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    }
    const res = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=20`, {
      headers,
      next: { revalidate: 300 },
    });
    if (res.ok) {
      const raw = await res.json();
      const commits: GitCommitItem[] = (raw || [])
        .map((c: { sha: string; commit: { message: string; author: { date: string } } }) => {
          const msg = c.commit?.message || "";
          const [subject, ...rest] = msg.split("\n");
          return {
            hash: c.sha.slice(0, 7),
            date: (c.commit?.author?.date || "").slice(0, 10),
            subject: subject.trim(),
            body: rest.join("\n").trim(),
          };
        })
        .filter((c: GitCommitItem) => c.subject && !c.subject.startsWith("Update myanimelist") && !c.subject.includes("╨"));
      if (commits.length > 0) {
        return NextResponse.json({ commits });
      }
    }
  } catch {
    // fallback to local gitlog.json
  }

  const fallback = await readGitLog();
  return NextResponse.json({ commits: fallback });
}
