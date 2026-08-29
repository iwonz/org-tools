#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import { extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const productionOutput = join(repositoryRoot, "apps", "ui", "out");
const scannerPath = "scripts/check-public-safety.mjs";
const screenshotManifestPath = join(repositoryRoot, "docs", "screenshot-demo.json");
const screenshotsDirectory = join(repositoryRoot, "docs", "screenshots");
const requiredScreenshotIds = [
  "import",
  "export",
  "theme",
  "language",
  "teams",
  "employees",
  "editor",
  "analytics",
  "calendar",
  "download",
];

const blockedPathSegments = new Set([
  ".cache",
  ".next",
  ".playwright-cli",
  ".pnpm-store",
  ".turbo",
  "coverage",
  "dist",
  "node_modules",
  "playwright-report",
  "test-results",
]);
const blockedMediaExtensions = new Set([
  ".avi",
  ".aac",
  ".flac",
  ".m4a",
  ".mkv",
  ".mov",
  ".mp3",
  ".mp4",
  ".mpeg",
  ".mpg",
  ".ogg",
  ".wav",
  ".webm",
  ".wmv",
]);
const binaryExtensions = new Set([
  ".avif",
  ".eot",
  ".gif",
  ".ico",
  ".jpeg",
  ".jpg",
  ".otf",
  ".png",
  ".ttf",
  ".woff",
  ".woff2",
  ".webp",
]);

const joined = (...parts) => parts.join("");
const contentRules = [
  {
    name: "absolute user home path",
    pattern: new RegExp(joined("(?:/", "Users|/home)/[^/\\s]+/|", "[A-Z]:\\\\Users\\\\"), "u"),
  },
  {
    allowedPaths: new Set(["apps/ui/messages/ru.json"]),
    name: "Cyrillic text",
    pattern: /[\u0400-\u052f]/u,
    skipProductionScripts: true,
  },
  {
    name: "legacy remote photo field",
    pattern: new RegExp(joined("\\b", "photo", "Url", "\\b"), "u"),
  },
  {
    name: "remote avatar value",
    pattern: new RegExp(joined('"avatarBase64Url"\\s*:\\s*"', "https?://"), "iu"),
  },
  {
    name: "remote face service",
    pattern: new RegExp(
      joined(
        "un",
        "splash\\.com|pra",
        "vatar\\.cc|random",
        "user\\.me|picsum\\.photos|ui-avatars\\.com",
      ),
      "iu",
    ),
  },
  {
    name: "removed onboarding or media tooling",
    pattern: new RegExp(
      joined("react-", "joyride|", "joyride|", "ffmpeg|", "demogen|", "demo:generate"),
      "iu",
    ),
  },
  {
    allowedPathPrefixes: ["openspec/changes/archive/"],
    allowedPaths: new Set(["openspec/specs/project-tooling/spec.md"]),
    name: "removed structured import contract",
    pattern: /OrgToolsImport|org-tools-import/u,
  },
  {
    name: "embedded audio or video content type",
    pattern: new RegExp(joined("(?:audio|", "video)/[a-z0-9.+-]+"), "iu"),
  },
];

function repositoryFiles() {
  const result = spawnSync(
    "git",
    ["ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      maxBuffer: 32 * 1024 * 1024,
    },
  );

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || "Unable to enumerate the repository worktree.");
  }

  return result.stdout.split("\0").filter(Boolean);
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(path)));
    } else if (entry.isFile()) {
      files.push(path);
    }
  }

  return files;
}

function normalizedRelativePath(path) {
  return relative(repositoryRoot, path).split(sep).join("/");
}

function firstLineNumber(content, index) {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor += 1) {
    if (content.charCodeAt(cursor) === 10) line += 1;
  }
  return line;
}

function removeOpaqueIntegrityValues(path, content) {
  if (path !== "pnpm-lock.yaml") return content;
  return content.replace(
    /integrity:\s+sha(?:256|384|512)-[A-Za-z0-9+/=]+/gu,
    "integrity: <checksum>",
  );
}

function matchesFor(content, pattern) {
  return [...content.matchAll(pattern)].map((match) => match[1]);
}

async function validateScreenshotDemo(violations) {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(screenshotManifestPath, "utf8"));
  } catch {
    violations.push({ path: "docs/screenshot-demo.json", rule: "invalid screenshot manifest" });
    return;
  }

  if (!Array.isArray(manifest)) {
    violations.push({ path: "docs/screenshot-demo.json", rule: "manifest must be an array" });
    return;
  }

  const ids = manifest.map((scenario) => scenario?.id);
  const files = manifest.map((scenario) => scenario?.file);
  if (
    manifest.length !== requiredScreenshotIds.length ||
    new Set(ids).size !== manifest.length ||
    [...ids].sort().join("\0") !== [...requiredScreenshotIds].sort().join("\0")
  ) {
    violations.push({
      path: "docs/screenshot-demo.json",
      rule: "manifest must contain each required core scenario exactly once",
    });
  }
  if (
    new Set(files).size !== manifest.length ||
    files.some((file) => typeof file !== "string" || !/^demo-[a-z-]+\.png$/u.test(file))
  ) {
    violations.push({
      path: "docs/screenshot-demo.json",
      rule: "manifest screenshot filenames must be unique demo PNGs",
    });
  }

  const actualFiles = (await readdir(screenshotsDirectory))
    .filter((file) => file.endsWith(".png"))
    .sort();
  if (actualFiles.join("\0") !== [...files].sort().join("\0")) {
    violations.push({
      path: "docs/screenshots",
      rule: "PNG files must exactly match the screenshot manifest",
    });
  }

  const readme = await readFile(join(repositoryRoot, "README.md"), "utf8");
  const screenshotGuide = await readFile(join(repositoryRoot, "docs", "screenshots.md"), "utf8");
  const readmeLinks = matchesFor(readme, /(docs\/screenshots\/[^)\s]+\.png)/gu);
  const guideLinks = matchesFor(screenshotGuide, /(screenshots\/[^)\s]+\.png)/gu);
  const expectedReadmeLinks = files.map((file) => `docs/screenshots/${file}`).sort();
  const expectedGuideLinks = files.map((file) => `screenshots/${file}`).sort();

  if (
    readmeLinks.length !== manifest.length * 2 ||
    [...new Set(readmeLinks)].sort().join("\0") !== expectedReadmeLinks.join("\0")
  ) {
    violations.push({
      path: "README.md",
      rule: "README must preview and directly link every manifest screenshot exactly once",
    });
  }
  if (
    guideLinks.length !== manifest.length * 2 ||
    [...new Set(guideLinks)].sort().join("\0") !== expectedGuideLinks.join("\0")
  ) {
    violations.push({
      path: "docs/screenshots.md",
      rule: "screenshot guide must preview and directly link every manifest screenshot exactly once",
    });
  }
}

async function main() {
  const violations = [];
  const worktreePaths = repositoryFiles();
  const outputExists = await stat(productionOutput)
    .then((entry) => entry.isDirectory())
    .catch(() => false);

  await validateScreenshotDemo(violations);

  if (!outputExists) {
    violations.push({
      path: "apps/ui/out",
      rule: "production output is missing; run pnpm build before this check",
    });
  }

  const absolutePaths = new Set(worktreePaths.map((path) => resolve(repositoryRoot, path)));
  if (outputExists) {
    for (const path of await walk(productionOutput)) absolutePaths.add(resolve(path));
  }

  for (const absolutePath of [...absolutePaths].sort()) {
    const path = normalizedRelativePath(absolutePath);
    const pathSegments = path.split("/");
    const isProductionFile = path.startsWith("apps/ui/out/");

    if (!isProductionFile) {
      const blockedSegment = pathSegments.find((segment) => blockedPathSegments.has(segment));
      if (blockedSegment) {
        violations.push({
          path,
          rule: `forbidden generated or cache directory: ${blockedSegment}`,
        });
      }
    }

    const extension = extname(path).toLowerCase();
    if (blockedMediaExtensions.has(extension)) {
      violations.push({ path, rule: `forbidden audio or video artifact: ${extension}` });
    }
    if (extension === ".tsbuildinfo") {
      violations.push({ path, rule: "generated TypeScript build cache must not be published" });
    }
    if (path.endsWith("apps/ui/next-env.d.ts")) {
      violations.push({ path, rule: "generated Next.js type declaration must not be published" });
    }
    if (binaryExtensions.has(extension) || path === scannerPath) continue;

    const content = removeOpaqueIntegrityValues(path, await readFile(absolutePath, "utf8"));
    for (const {
      allowedPathPrefixes = [],
      allowedPaths = new Set(),
      name,
      pattern,
      skipProductionScripts = false,
    } of contentRules) {
      if (allowedPaths.has(path)) continue;
      if (allowedPathPrefixes.some((prefix) => path.startsWith(prefix))) continue;
      if (
        isProductionFile &&
        skipProductionScripts &&
        (extension === ".js" || extension === ".map")
      ) {
        continue;
      }
      const match = pattern.exec(content);
      if (!match || match.index === undefined) continue;
      violations.push({ path, rule: name, line: firstLineNumber(content, match.index) });
    }
  }

  if (violations.length > 0) {
    console.error(`Public-safety check failed with ${violations.length} violation(s):`);
    for (const violation of violations) {
      const location = violation.line ? `${violation.path}:${violation.line}` : violation.path;
      console.error(`- ${location}: ${violation.rule}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log(`Public-safety check passed (${absolutePaths.size} files scanned).`);
}

await main();
