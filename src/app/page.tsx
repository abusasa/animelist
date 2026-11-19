import { hasGitHubConfig, readCatalog, readGitLog } from "@/lib/store";
import { TilingApp } from "@/components/TilingApp";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [catalog, commits] = await Promise.all([readCatalog(), readGitLog()]);
  return (
    <TilingApp
      initialCatalog={catalog}
      initialCommits={commits}
      githubConnected={hasGitHubConfig()}
    />
  );
}
