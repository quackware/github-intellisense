import { debug, Hono, logger } from "../deps.ts";
import { CompletionList, DocumentationResponse, Index, IndexContent } from "./types.ts";

const log = debug("@quackware:github-intellisense/api.ts");

export function traverseIndexContent(path: string, items: IndexContent[]) {
  let repoPaths = items.slice();
  let [currPath, ...pathParts] = path.split("/");
  while (pathParts.length > 0) {
    const foundDir = repoPaths.find((p) => p.type === "directory" && p.name.includes(currPath));
    if (foundDir) {
      repoPaths = foundDir.contents ?? [];
    }
    currPath = pathParts.splice(0, 1)[0];
  }
  return {
    repoPaths,
    currPath,
  };
}

export function createApi(index: Index) {
  const api = new Hono({ strict: false });

  const repos = Object.keys(index);

  api.use("*", logger());

  api.get("/.well-known/deno-import-intellisense.json", async (c) => {
    const json = await Deno.readTextFile(new URL("../public/deno-import-intellisense.json", import.meta.url));
    return c.body(json, { status: 200, headers: { "content-type": "application/json" } });
  });
  api.get("/favicon.ico", async (c) => {
    const icon = await Deno.readFile(new URL("../public/favicon.ico", import.meta.url));
    return c.body(icon);
  });

  api.get("/completions/:repository?", (c) => {
    const repoQuery = c.req.param("repository");
    log("Completing repo query", { repoQuery });
    if (!repoQuery) {
      return c.json<CompletionList>({
        items: repos,
        isIncomplete: false,
      });
    }
    const repoMatch = index[repoQuery];
    if (repoMatch) {
      return c.json<CompletionList>({
        items: repoMatch.items.map((i) => i.name),
        isIncomplete: false,
      });
    } else {
      const repoSearchResults = repos.filter((r) => r.includes(repoQuery));
      return c.json<CompletionList>({
        items: repoSearchResults,
        isIncomplete: false,
      });
    }
  });

  api.get("/completions/:repository/:path{.*}", (c) => {
    const { repository, path } = c.req.param();
    const repoData = index[repository];
    if (!repoData) {
      return c.json<CompletionList>({
        items: [],
      });
    } else {
      const { repoPaths, currPath } = traverseIndexContent(path, repoData.items);
      const contents = repoPaths.filter((p) => p.name.includes(currPath));
      const items = contents.map((p) => p.name);
      return c.json<CompletionList>({
        items,
        isIncomplete: contents.some((c) => c.type === "directory"),
      });
    }
  });

  api.get("/documentation/:repository", (c) => {
    const { repository } = c.req.param();
    const repoData = index[repository];
    console.log(`Doc ${repository}`, repoData);
    if (!repoData) {
      return c.json<DocumentationResponse>({
        kind: "markdown",
        value: `Repo ${repository} not found.`,
      });
    }
    return c.json<DocumentationResponse>({ kind: "markdown", value: repoData.documentation ?? "" });
  });

  api.get("/documentation/:repository/:path{.*}", (c) => {
    const { repository, path } = c.req.param();
    const repoData = index[repository];
    if (!repoData) {
      return c.json<DocumentationResponse>({
        kind: "markdown",
        value: `Repo ${repository} not found.`,
      });
    } else {
      const { repoPaths, currPath } = traverseIndexContent(path, repoData.items);
      const docFile = repoPaths.find((p) => p.name.endsWith(currPath));
      return c.json<DocumentationResponse>({
        kind: "markdown",
        value: `### ${docFile?.name}\n\nSize: ${docFile?.size}`,
      });
    }
  });

  api.showRoutes();

  return api;
}
