import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
export const pagesOutput = join(repositoryRoot, "pages-out");

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

export async function validatePagesOutput() {
  const violations = [];
  const indexPath = join(pagesOutput, "index.html");
  const index = await readFile(indexPath, "utf8").catch(() => "");
  const noJekyll = await stat(join(pagesOutput, ".nojekyll")).catch(() => null);
  const nextStatic = await stat(join(pagesOutput, "_next", "static")).catch(() => null);

  if (!index.startsWith("<!DOCTYPE html>")) violations.push("index.html is missing or invalid");
  if (!noJekyll?.isFile()) violations.push(".nojekyll is missing");
  if (!nextStatic?.isDirectory()) violations.push("Next.js static assets are missing");
  if (!index.includes("/org-tools/_next/static/")) {
    violations.push("index.html does not use the /org-tools base path");
  }
  if (!/<script\b[^>]*src=/iu.test(index) || !/<link\b[^>]*stylesheet/iu.test(index)) {
    violations.push("index.html must load the working JavaScript and CSS application");
  }

  const files = await walk(pagesOutput);
  const sourceFiles = files.filter((path) =>
    [".css", ".html", ".js", ".json"].includes(extname(path)),
  );
  const combined = (
    await Promise.all(sourceFiles.map((path) => readFile(path, "utf8").catch(() => "")))
  ).join("\n");
  const css = (
    await Promise.all(
      files
        .filter((path) => extname(path) === ".css")
        .map((path) => readFile(path, "utf8").catch(() => "")),
    )
  ).join("\n");
  if (![".bg-sidebar", ".flex{", ".h-dvh"].every((token) => css.includes(token))) {
    violations.push("Pages CSS is missing shared application utility styles");
  }
  const blocked = [
    ["@modelcontextprotocol/server", "MCP server SDK must not appear in the Pages output"],
    ["/api/mcp", "MCP control routes must not appear in the Pages output"],
    ["/mcp", "MCP endpoint must not appear in the Pages output"],
    ["ot_mcp_", "MCP token material must not appear in the Pages output"],
    ["node:sqlite", "node:sqlite must not appear in the Pages output"],
    ["/api/state", "state API routes must not appear in the Pages output"],
    ["ORG_TOOLS_DB_PATH", "database configuration must not appear in the Pages output"],
    ["organization_json", "SQLite storage fields must not appear in the Pages output"],
  ];
  for (const [needle, message] of blocked) {
    if (combined.includes(needle)) violations.push(message);
  }
  if (/https?:\/\/(?!www\.w3\.org\/2000\/svg)/u.test(index)) {
    violations.push("index.html must not load external resources");
  }
  if (files.some((path) => path.includes("/.next/server/") || path.includes("/server/app/"))) {
    violations.push("server chunks must not be present in the static output");
  }

  return violations;
}
