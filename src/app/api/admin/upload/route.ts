import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { isAdminAuthenticated } from "@/lib/auth";
import { hasGitHubConfig } from "@/lib/store";

export const dynamic = "force-dynamic";

const ALLOWED_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(req: Request) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "требуется авторизация" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const slugRaw = String(formData.get("slug") || "poster").replace(/[^a-zA-Z0-9_-]/g, "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "файл не выбран" }, { status: 400 });
    }

    const ext = ALLOWED_EXT[file.type] || "jpg";
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.length > 6 * 1024 * 1024) {
      return NextResponse.json({ error: "файл больше 6 МБ" }, { status: 400 });
    }

    const filename = `${slugRaw || "poster"}-${Date.now().toString(36)}.${ext}`;
    const relPath = `public/posters/${filename}`;
    const publicUrl = `/posters/${filename}`;

    if (hasGitHubConfig()) {
      const repo = process.env.GITHUB_REPO!;
      const branch = process.env.GITHUB_BRANCH || "main";
      const token = process.env.GITHUB_TOKEN!;
      const apiUrl = `https://api.github.com/repos/${repo}/contents/${relPath}`;

      const putRes = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Upload poster: ${filename}`,
          content: buffer.toString("base64"),
          branch,
        }),
      });
      if (!putRes.ok) {
        const t = await putRes.text();
        throw new Error(`GitHub upload error (${putRes.status}): ${t}`);
      }
      // Raw GitHub URL works immediately even before Vercel redeploys
      const rawUrl = `https://raw.githubusercontent.com/${repo}/${branch}/${relPath}`;
      try {
        const dir = path.join(process.cwd(), "public", "posters");
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(path.join(dir, filename), buffer);
      } catch {}
      return NextResponse.json({ ok: true, url: rawUrl, source: "Загружено" });
    }

    // Local filesystem storage
    const dir = path.join(process.cwd(), "public", "posters");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), buffer);
    return NextResponse.json({ ok: true, url: publicUrl, source: "Загружено" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "ошибка загрузки";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
