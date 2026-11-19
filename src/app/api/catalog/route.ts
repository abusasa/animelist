import { NextResponse } from "next/server";
import { hasGitHubConfig, readCatalog } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const catalog = await readCatalog();
  return NextResponse.json({
    catalog,
    githubConnected: hasGitHubConfig(),
  });
}
