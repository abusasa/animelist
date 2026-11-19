import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import { readCatalog, writeCatalog } from "@/lib/store";
import type { CategoryDef, MediaItem } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const authed = await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: "Требуется авторизация" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const action = body?.action as string;
    const catalog = await readCatalog();

    if (action === "upsert-item") {
      const incoming = body.item as MediaItem;
      if (!incoming?.title?.trim() || !incoming?.category) {
        return NextResponse.json({ error: "Укажите название и категорию" }, { status: 400 });
      }

      const existingIdx = catalog.items.findIndex((i) => i.id === incoming.id);
      let commitMsg = "";
      if (existingIdx >= 0) {
        catalog.items[existingIdx] = {
          ...catalog.items[existingIdx],
          ...incoming,
        };
        commitMsg = `Update: ${incoming.title}${incoming.note ? ` (${incoming.note.slice(0, 80)})` : ""}`;
      } else {
        const catItems = catalog.items.filter((i) => i.category === incoming.category);
        const nextNum = catItems.reduce((m, i) => Math.max(m, i.number || 0), 0) + 1;
        const newItem: MediaItem = {
          ...incoming,
          id: incoming.id || `${incoming.category}-${Date.now().toString(36)}`,
          number: nextNum,
          date: incoming.date || new Date().toISOString().slice(0, 10),
        };
        catalog.items.push(newItem);
        const pluses = newItem.rating > 0 ? " " + "+".repeat(newItem.rating) : "";
        const epPart = newItem.episodes ? ` ${newItem.episodes}` : "";
        commitMsg = `${newItem.title}${epPart}${pluses}${newItem.note ? `\n\n${newItem.note}` : ""}`;
      }

      const result = await writeCatalog(catalog, commitMsg);
      return NextResponse.json({ ok: true, catalog, ...result });
    }

    if (action === "delete-item") {
      const id = body.id as string;
      const target = catalog.items.find((i) => i.id === id);
      catalog.items = catalog.items.filter((i) => i.id !== id);
      const result = await writeCatalog(catalog, `Remove: ${target?.title || id}`);
      return NextResponse.json({ ok: true, catalog, ...result });
    }

    if (action === "add-category") {
      const cat = body.category as CategoryDef;
      if (!cat?.label?.trim() || !cat?.slug?.trim()) {
        return NextResponse.json({ error: "Укажите название категории" }, { status: 400 });
      }
      const slug = cat.slug.toLowerCase().replace(/[^a-z0-9_-]/g, "");
      if (!slug || catalog.categories.some((c) => c.id === slug)) {
        return NextResponse.json({ error: "Такая категория уже существует" }, { status: 400 });
      }
      const newCat: CategoryDef = {
        id: slug,
        slug,
        label: cat.label.trim().toUpperCase(),
        unit: cat.unit?.trim() || slug,
        accent: cat.accent || "#E07A9A",
        accentFg: cat.accentFg || "#131417",
        hasLogs: false,
        kind: cat.kind || "custom",
      };
      catalog.categories.push(newCat);
      const result = await writeCatalog(catalog, `Add category: ${newCat.label}`);
      return NextResponse.json({ ok: true, catalog, category: newCat, ...result });
    }

    return NextResponse.json({ error: "Неизвестное действие" }, { status: 400 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Ошибка сохранения";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
