#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const ALL_BROWSER_SUITES = [
  "tests/smoke.spec.ts",
  "tests/localization.spec.ts",
  "tests/auth-access.spec.ts",
  "tests/state.spec.ts",
];

const FAST_GATES = [
  "lint",
  "typecheck",
  "unit",
  "dead-source-and-dependencies",
  "dependency-security-audit",
  "browser-shard-partition",
  "spec",
  "diff",
  "source-publication",
];

const normalized = (path) => path.replaceAll("\\", "/").replace(/^\.\//u, "");
const matches = (path, pattern) => pattern.test(path);

const isKnownDocumentation = (path) =>
  path === "AGENTS.md" ||
  path === "README.md" ||
  path === ".github/PULL_REQUEST_TEMPLATE.md" ||
  path.startsWith("docs/") ||
  path.startsWith("openspec/");

const isValidationInfrastructure = (path) =>
  path === "Dockerfile" ||
  path === "compose.yaml" ||
  path === "compose.dev.yaml" ||
  path === "package.json" ||
  path === "pnpm-lock.yaml" ||
  path === "pnpm-workspace.yaml" ||
  path === "tsconfig.json" ||
  path.startsWith(".github/workflows/") ||
  path.startsWith("bin/") ||
  path.startsWith("scripts/") ||
  path === "packages/screenshots/playwright.config.ts" ||
  path === "packages/screenshots/package.json" ||
  path === "packages/screenshots/scripts/run-playwright.mjs" ||
  path === "packages/screenshots/tests/browser-test.ts" ||
  path === "packages/screenshots/tests/helpers.ts";

const isVisualApplicationPath = (path) =>
  path.startsWith("apps/ui/messages/") ||
  path.startsWith("apps/ui/src/components/") ||
  path.startsWith("apps/ui/src/styles/") ||
  matches(
    path,
    /^apps\/ui\/src\/(?:app|lib|stores)\/.*(?:editor|employee|tag|calendar|export|display|surface|color|image)/u,
  );

const addSuite = (suites, suite) => suites.add(suite);

export function createValidationPlan(inputPaths, { baseAvailable = true } = {}) {
  const paths = [...new Set(inputPaths.map(normalized).filter(Boolean))].sort();
  const browserSuites = new Set();
  const reasons = [];
  let runtime = false;
  let build = false;
  let screenshots = false;
  let image = false;
  let fullFallback = !baseAvailable;

  if (!baseAvailable) reasons.push("comparison base is unavailable; using the complete plan");

  for (const path of paths) {
    if (isValidationInfrastructure(path)) {
      fullFallback = true;
      reasons.push(`${path}: validation or delivery infrastructure`);
      continue;
    }

    if (isKnownDocumentation(path)) {
      if (path === "docs/screenshot-demo.json" || /^docs\/screenshots\/.*\.png$/u.test(path)) {
        screenshots = true;
        runtime = true;
        reasons.push(`${path}: maintained gallery contract`);
      } else {
        reasons.push(`${path}: documentation or specification source`);
      }
      continue;
    }

    if (path.startsWith("packages/screenshots/tests/")) {
      runtime = true;
      if (path.endsWith("screenshots.spec.ts")) screenshots = true;
      else if (path.endsWith("auth-access.spec.ts"))
        addSuite(browserSuites, "tests/auth-access.spec.ts");
      else if (path.endsWith("localization.spec.ts"))
        addSuite(browserSuites, "tests/localization.spec.ts");
      else if (path.endsWith("state.spec.ts")) addSuite(browserSuites, "tests/state.spec.ts");
      else if (path.endsWith("smoke.spec.ts") || path.endsWith("-workflow.ts")) {
        addSuite(browserSuites, "tests/smoke.spec.ts");
      } else {
        fullFallback = true;
      }
      reasons.push(`${path}: browser coverage`);
      continue;
    }

    if (/\.(?:test|spec)\.[cm]?[jt]sx?$/u.test(path)) {
      reasons.push(`${path}: complete unit suite is always fast`);
      continue;
    }

    if (
      path.startsWith("apps/ui/migrations/") ||
      path.startsWith("apps/ui/src/server/") ||
      path.startsWith("apps/ui/src/app/api/")
    ) {
      runtime = true;
      build = true;
      image = true;
      addSuite(browserSuites, "tests/auth-access.spec.ts");
      addSuite(browserSuites, "tests/state.spec.ts");
      reasons.push(`${path}: server, security, or PostgreSQL boundary`);
      continue;
    }

    if (path.startsWith("apps/ui/messages/") || path.startsWith("apps/ui/src/i18n/")) {
      runtime = true;
      build = true;
      screenshots = true;
      addSuite(browserSuites, "tests/localization.spec.ts");
      addSuite(browserSuites, "tests/smoke.spec.ts");
      reasons.push(`${path}: localized product interface`);
      continue;
    }

    if (path.startsWith("packages/types/")) {
      runtime = true;
      build = true;
      image = true;
      addSuite(browserSuites, "tests/smoke.spec.ts");
      addSuite(browserSuites, "tests/state.spec.ts");
      if (path.includes("security")) addSuite(browserSuites, "tests/auth-access.spec.ts");
      reasons.push(`${path}: shared public type contract`);
      continue;
    }

    if (path.startsWith("apps/ui/src/") || path.startsWith("apps/ui/public/")) {
      runtime = true;
      build = true;
      image = true;
      addSuite(browserSuites, "tests/smoke.spec.ts");
      if (/auth|access|permission|administration|projection|backup/u.test(path)) {
        addSuite(browserSuites, "tests/auth-access.spec.ts");
      }
      if (/state|store|authenticated-state/u.test(path))
        addSuite(browserSuites, "tests/state.spec.ts");
      if (isVisualApplicationPath(path)) screenshots = true;
      reasons.push(`${path}: product runtime`);
      continue;
    }

    fullFallback = true;
    reasons.push(`${path}: no owned impact rule; using the complete plan`);
  }

  if (fullFallback) {
    runtime = true;
    build = true;
    screenshots = true;
    image = true;
    for (const suite of ALL_BROWSER_SUITES) addSuite(browserSuites, suite);
  }

  return {
    baseAvailable,
    browserSuites: ALL_BROWSER_SUITES.filter((suite) => browserSuites.has(suite)),
    build,
    fastGates: FAST_GATES,
    fullFallback,
    image,
    paths,
    reasons: [...new Set(reasons)],
    runtime,
    screenshots,
  };
}

const gitLines = (args) =>
  execFileSync("git", args, { encoding: "utf8" })
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export function discoverChangedPaths(base = "origin/main") {
  let baseAvailable = true;
  let committed = [];
  try {
    const mergeBase = execFileSync("git", ["merge-base", base, "HEAD"], {
      encoding: "utf8",
    }).trim();
    committed = gitLines(["diff", "--name-only", "--diff-filter=ACMRD", `${mergeBase}...HEAD`]);
  } catch {
    baseAvailable = false;
  }

  const paths = new Set(committed);
  for (const args of [
    ["diff", "--name-only", "--diff-filter=ACMRD"],
    ["diff", "--cached", "--name-only", "--diff-filter=ACMRD"],
    ["ls-files", "--others", "--exclude-standard"],
  ]) {
    for (const path of gitLines(args)) paths.add(path);
  }
  return { baseAvailable, paths: [...paths].sort() };
}

export function formatValidationPlan(plan) {
  const selected = [
    ...plan.fastGates,
    ...(plan.runtime ? ["development-runtime"] : []),
    ...(plan.build ? ["production-build", "full-publication-scan"] : []),
    ...plan.browserSuites.map((suite) => `browser:${suite}`),
    ...(plan.screenshots ? ["gallery-feedback"] : []),
    ...(plan.image ? ["production-image (authoritative CI)"] : []),
  ];
  const skipped = [
    ...(!plan.runtime ? ["development-runtime"] : []),
    ...(!plan.build ? ["production-build", "full-publication-scan"] : []),
    ...(plan.browserSuites.length === 0 ? ["browser-feedback"] : []),
    ...(!plan.screenshots ? ["gallery-feedback"] : []),
    ...(!plan.image ? ["production-image"] : []),
  ];
  return [
    `Validation plan (${plan.fullFallback ? "complete fallback" : "affected"})`,
    `Changed paths: ${plan.paths.length}`,
    ...plan.paths.map((path) => `  - ${path}`),
    "Selected gates:",
    ...selected.map((gate) => `  - ${gate}`),
    "Skipped expensive feedback gates:",
    ...(skipped.length ? skipped.map((gate) => `  - ${gate}`) : ["  - none"]),
    "Reasons:",
    ...(plan.reasons.length
      ? plan.reasons.map((reason) => `  - ${reason}`)
      : ["  - no changed paths"]),
    "Authoritative CI still runs the complete validation matrix.",
  ].join("\n");
}

function parseCli(argv) {
  let base = "origin/main";
  let json = false;
  const paths = [];
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--json") json = true;
    else if (value === "--base") base = argv[++index] ?? base;
    else if (value === "--path") paths.push(argv[++index] ?? "");
    else throw new Error(`Unknown argument: ${value}`);
  }
  return { base, json, paths };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const options = parseCli(process.argv.slice(2));
  const discovery = options.paths.length
    ? { baseAvailable: true, paths: options.paths }
    : discoverChangedPaths(options.base);
  const plan = createValidationPlan(discovery.paths, discovery);
  console.log(options.json ? JSON.stringify(plan, null, 2) : formatValidationPlan(plan));
}
