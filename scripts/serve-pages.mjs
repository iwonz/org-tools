#!/usr/bin/env node

import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

import { pagesOutput } from "./pages.mjs";

const host = "127.0.0.1";
const port = Number(process.env.ORG_TOOLS_PAGES_PORT ?? "4174");
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${host}:${port}`);
  if (url.pathname === "/") {
    response.writeHead(302, { Location: "/org-tools/" });
    response.end();
    return;
  }
  if (!url.pathname.startsWith("/org-tools/")) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }
  const relative = normalize(url.pathname.slice("/org-tools/".length)).replace(
    /^\.\.(?:\/|$)/u,
    "",
  );
  let path = join(pagesOutput, relative || "index.html");
  const entry = await stat(path).catch(() => null);
  if (entry?.isDirectory()) path = join(path, "index.html");
  const file = await stat(path).catch(() => null);
  const resolvedPath = resolve(path);
  if (!file?.isFile() || !resolvedPath.startsWith(`${resolve(pagesOutput)}${sep}`)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }
  response.writeHead(200, {
    "Cache-Control": "no-store",
    "Content-Type": mimeTypes.get(extname(path)) ?? "application/octet-stream",
  });
  createReadStream(path).pipe(response);
});

server.listen(port, host, () => {
  console.log(`Org Tools Pages preview listening on http://${host}:${port}/org-tools/`);
});
