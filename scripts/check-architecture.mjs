#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

import ts from "typescript";

const PRODUCTION_ROOTS = ["packages/types", "apps/ui/src"];
const SOURCE_EXTENSION = /\.(?:ts|tsx)$/u;
const EXCLUDED_SOURCE = /(?:\.test\.|\.spec\.|\.d\.ts$)/u;

const normalize = (path) => path.split(sep).join("/");

export const architectureZone = (path) => {
  const normalized = normalize(path);
  if (normalized.startsWith("packages/types/")) return "types";
  if (normalized.startsWith("apps/ui/src/i18n/")) return "i18n";
  if (normalized.startsWith("apps/ui/src/lib/")) return "lib";
  if (normalized.startsWith("apps/ui/src/server/")) return "server";
  if (normalized.startsWith("apps/ui/src/stores/")) return "stores";
  if (normalized.startsWith("apps/ui/src/components/")) return "components";
  if (normalized.startsWith("apps/ui/src/app/api/")) return "api";
  if (normalized.startsWith("apps/ui/src/app/")) return "app";
  return null;
};

const ALLOWED_DEPENDENCIES = {
  api: new Set(["api", "i18n", "lib", "server", "types"]),
  app: new Set(["app", "components", "i18n", "lib", "types"]),
  components: new Set(["components", "i18n", "lib", "stores", "types"]),
  i18n: new Set(["i18n", "types"]),
  lib: new Set(["i18n", "lib", "types"]),
  server: new Set(["i18n", "lib", "server", "types"]),
  stores: new Set(["i18n", "lib", "stores", "types"]),
  types: new Set(["types"]),
};

export const validateArchitectureEdges = (edges) =>
  edges.flatMap(({ from, to }) => {
    const sourceZone = architectureZone(from);
    const targetZone = architectureZone(to);
    if (!sourceZone || !targetZone || ALLOWED_DEPENDENCIES[sourceZone].has(targetZone)) return [];
    return [`${from} (${sourceZone}) must not import ${to} (${targetZone})`];
  });

export const findArchitectureCycles = (files, edges) => {
  const graph = new Map(files.map((file) => [file, []]));
  for (const { from, to } of edges) graph.get(from)?.push(to);
  const visiting = new Set();
  const visited = new Set();
  const stack = [];
  const cycles = [];

  const visit = (file) => {
    if (visited.has(file)) return;
    if (visiting.has(file)) {
      const start = stack.indexOf(file);
      cycles.push([...stack.slice(start), file]);
      return;
    }
    visiting.add(file);
    stack.push(file);
    for (const dependency of graph.get(file) ?? []) visit(dependency);
    stack.pop();
    visiting.delete(file);
    visited.add(file);
  };

  for (const file of files) visit(file);
  return cycles;
};

const listSourceFiles = (root) =>
  PRODUCTION_ROOTS.flatMap((sourceRoot) => {
    const absoluteRoot = join(root, sourceRoot);
    return readdirSync(absoluteRoot, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => join(entry.parentPath, entry.name))
      .filter((path) => SOURCE_EXTENSION.test(path) && !EXCLUDED_SOURCE.test(path))
      .map((path) => normalize(relative(root, path)));
  }).sort();

const resolveSourceImport = (root, from, specifier) => {
  let target;
  if (specifier === "@org-tools/types") target = "packages/types/index.ts";
  else if (specifier.startsWith("@org-tools/types/")) {
    target = `packages/types/${specifier.slice("@org-tools/types/".length)}.ts`;
  } else if (specifier.startsWith("@/")) target = `apps/ui/src/${specifier.slice(2)}`;
  else if (specifier.startsWith(".")) {
    target = normalize(relative(root, resolve(root, dirname(from), specifier)));
  } else return null;

  const withoutJavaScriptExtension = target.replace(/\.(?:js|jsx|mjs)$/u, "");
  const candidates = extname(withoutJavaScriptExtension)
    ? [withoutJavaScriptExtension]
    : [
        withoutJavaScriptExtension,
        `${withoutJavaScriptExtension}.ts`,
        `${withoutJavaScriptExtension}.tsx`,
        `${withoutJavaScriptExtension}/index.ts`,
        `${withoutJavaScriptExtension}/index.tsx`,
      ];
  return candidates.find((candidate) => existsSync(join(root, candidate))) ?? null;
};

export const analyzeArchitecture = (root = process.cwd()) => {
  const files = listSourceFiles(root);
  const fileSet = new Set(files);
  const edges = [];
  for (const from of files) {
    const source = readFileSync(join(root, from), "utf8");
    const imports = ts.preProcessFile(source, true, true).importedFiles;
    for (const imported of imports) {
      const to = resolveSourceImport(root, from, imported.fileName);
      if (to && fileSet.has(to)) edges.push({ from, to });
    }
  }
  return {
    cycles: findArchitectureCycles(files, edges),
    edges,
    files,
    violations: validateArchitectureEdges(edges),
  };
};

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const result = analyzeArchitecture();
  const failures = [
    ...result.violations,
    ...result.cycles.map((cycle) => `production dependency cycle: ${cycle.join(" -> ")}`),
  ];
  if (failures.length > 0) {
    console.error(`Architecture validation failed with ${failures.length} issue(s):`);
    for (const failure of failures) console.error(`- ${failure}`);
    process.exitCode = 1;
  } else {
    console.log(
      `Architecture validation passed: ${result.files.length} production modules, ${result.edges.length} internal imports.`,
    );
  }
}
