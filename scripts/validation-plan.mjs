#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export const ALL_BROWSER_TAGS = [
  "@access",
  "@core",
  "@editor",
  "@employees",
  "@localization",
  "@output",
  "@performance",
  "@state",
  "@units",
];

export const ALL_SCREENSHOT_MODULES = [
  "access",
  "administration",
  "authentication",
  "calendar",
  "download",
  "editor",
  "employees",
  "language",
  "teams",
  "theme",
];

export const FAST_GATES = [
  "lint",
  "typecheck",
  "unit",
  "architecture",
  "dead-source-and-dependencies",
  "spec",
  "diff",
  "source-publication",
];

const normalized = (path) => path.replaceAll("\\", "/").replace(/^\.\//u, "");

const isKnownDocumentation = (path) =>
  path === "AGENTS.md" ||
  path === "README.md" ||
  path === ".github/PULL_REQUEST_TEMPLATE.md" ||
  path.startsWith("docs/") ||
  path.startsWith("openspec/");

const isValidationInfrastructure = (path) =>
  path === ".github/workflows/ci.yml" ||
  path === ".github/workflows/full-regression.yml" ||
  path === "packages/screenshots/playwright.config.ts" ||
  path === "packages/screenshots/package.json" ||
  path.startsWith("packages/screenshots/scripts/") ||
  path === "packages/screenshots/tests/browser-test.ts" ||
  path === "scripts/check-browser-shards.mjs" ||
  path.startsWith("scripts/run-validation") ||
  path.startsWith("scripts/validation-") ||
  path === "scripts/verify-screenshots.mjs";

const isDeliveryInput = (path) =>
  path === "Dockerfile" ||
  path === "compose.yaml" ||
  path === "compose.dev.yaml" ||
  path === ".dockerignore" ||
  path === ".github/workflows/container.yml" ||
  path.startsWith("bin/org-tools-image-") ||
  path === "scripts/check-public-safety.mjs";

const isDependencyInput = (path) =>
  path === "package.json" ||
  path === "pnpm-lock.yaml" ||
  path === "pnpm-workspace.yaml" ||
  path.endsWith("/package.json");

const add = (set, ...values) => {
  for (const value of values) set.add(value);
};

const addOwnedUiFeedback = (path, browserTags, screenshotModules) => {
  add(browserTags, "@core");
  if (/auth|access|permission|administration|projection|session|backup/u.test(path)) {
    add(browserTags, "@access");
    add(screenshotModules, "access", "administration", "authentication");
  }
  if (/employee|tag|display|model/u.test(path)) {
    add(browserTags, "@employees");
    add(screenshotModules, "employees");
  }
  if (/unit|team/u.test(path)) {
    add(browserTags, "@units");
    add(screenshotModules, "teams");
  }
  if (/editor|canvas|staffing|position|color|image/u.test(path)) {
    add(browserTags, "@editor");
    add(screenshotModules, "editor");
  }
  if (/export|download|backup/u.test(path)) {
    add(browserTags, "@output");
    add(screenshotModules, "download");
  }
  if (/state|store|persistence/u.test(path)) add(browserTags, "@state");
  if (/calendar/u.test(path)) add(screenshotModules, "calendar");
};

export function createValidationPlan(inputPaths, { baseAvailable = true } = {}) {
  const paths = [...new Set(inputPaths.map(normalized).filter(Boolean))].sort();
  const browserTags = new Set();
  const screenshotModules = new Set();
  const reasons = [];
  let audit = false;
  let build = false;
  let full = false;
  let image = false;
  let migrations = false;
  let runtime = false;
  let screenshotAll = false;

  if (!baseAvailable) {
    runtime = true;
    build = true;
    add(browserTags, ...ALL_BROWSER_TAGS);
    reasons.push("comparison base is unavailable; using every Core domain");
  }

  for (const path of paths) {
    if (isValidationInfrastructure(path)) {
      full = true;
      reasons.push(`${path}: validation evidence infrastructure`);
      continue;
    }

    if (isDeliveryInput(path)) {
      build = true;
      image = true;
      audit = true;
      reasons.push(`${path}: container or publication boundary`);
      continue;
    }

    if (isDependencyInput(path)) {
      build = true;
      image = true;
      audit = true;
      add(browserTags, "@core");
      reasons.push(`${path}: installed dependency graph`);
      continue;
    }

    if (isKnownDocumentation(path)) {
      if (path === "docs/screenshot-demo.json") {
        runtime = true;
        screenshotAll = true;
        reasons.push(`${path}: maintained screenshot manifest`);
      } else if (/^docs\/screenshots\/.*\.png$/u.test(path)) {
        reasons.push(`${path}: maintained screenshot output`);
      } else {
        reasons.push(`${path}: documentation or specification source`);
      }
      continue;
    }

    if (
      path === "packages/screenshots/tests/editor-performance-workflow.ts" ||
      path === "packages/screenshots/tests/performance-policy.ts"
    ) {
      runtime = true;
      build = true;
      add(browserTags, "@performance");
      reasons.push(`${path}: deterministic large-Editor performance evidence`);
      continue;
    }

    if (path.startsWith("packages/screenshots/tests/")) {
      full = true;
      reasons.push(`${path}: browser evidence definition`);
      continue;
    }

    if (/\.(?:test|spec)\.[cm]?[jt]sx?$/u.test(path)) {
      reasons.push(`${path}: complete unit suite is always fast`);
      continue;
    }

    if (path.startsWith("apps/ui/migrations/") || /migration|repository|postgres/u.test(path)) {
      runtime = true;
      build = true;
      migrations = true;
      add(browserTags, "@access", "@state");
      reasons.push(`${path}: PostgreSQL or migration boundary`);
      continue;
    }

    if (path.startsWith("apps/ui/src/server/") || path.startsWith("apps/ui/src/app/api/")) {
      runtime = true;
      build = true;
      add(browserTags, "@access", "@state");
      if (/backup|download|export/u.test(path)) add(browserTags, "@output");
      reasons.push(`${path}: server or authorization boundary`);
      continue;
    }

    if (path.startsWith("apps/ui/messages/") || path.startsWith("apps/ui/src/i18n/")) {
      runtime = true;
      build = true;
      screenshotAll = true;
      add(browserTags, "@core", "@localization");
      reasons.push(`${path}: localized product interface`);
      continue;
    }

    if (path.startsWith("packages/types/")) {
      runtime = true;
      build = true;
      add(browserTags, "@core", "@state");
      if (path.includes("security")) add(browserTags, "@access");
      reasons.push(`${path}: shared public contract`);
      continue;
    }

    if (path.startsWith("apps/ui/src/components/ui/") || path.startsWith("apps/ui/src/styles/")) {
      runtime = true;
      build = true;
      screenshotAll = true;
      add(browserTags, "@core");
      reasons.push(`${path}: shared visual primitive`);
      continue;
    }

    if (path.startsWith("apps/ui/src/") || path.startsWith("apps/ui/public/")) {
      runtime = true;
      build = true;
      addOwnedUiFeedback(path, browserTags, screenshotModules);
      reasons.push(`${path}: owned product runtime domain`);
      continue;
    }

    runtime = true;
    build = true;
    add(browserTags, ...ALL_BROWSER_TAGS);
    reasons.push(`${path}: unknown product path; using every Core domain`);
  }

  if (full) {
    runtime = true;
    build = true;
    image = true;
    migrations = true;
    audit = true;
    screenshotAll = true;
    add(browserTags, ...ALL_BROWSER_TAGS);
  }

  return {
    audit,
    baseAvailable,
    browserTags: ALL_BROWSER_TAGS.filter((tag) => browserTags.has(tag)),
    build,
    fastGates: FAST_GATES,
    full,
    image,
    migrations,
    paths,
    reasons: [...new Set(reasons)],
    runtime,
    screenshotAll,
    screenshotModules: ALL_SCREENSHOT_MODULES.filter((module) => screenshotModules.has(module)),
    screenshots: screenshotAll || screenshotModules.size > 0,
  };
}

export function createFullValidationPlan() {
  return {
    audit: true,
    baseAvailable: true,
    browserTags: ALL_BROWSER_TAGS,
    build: true,
    fastGates: FAST_GATES,
    full: true,
    image: true,
    migrations: true,
    paths: [],
    reasons: ["explicit Full Regression profile"],
    runtime: true,
    screenshotAll: true,
    screenshotModules: ALL_SCREENSHOT_MODULES,
    screenshots: true,
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
    ...(plan.audit ? ["dependency-security-audit"] : []),
    ...(plan.runtime ? ["development-runtime"] : []),
    ...(plan.build ? ["production-build", "full-publication-scan"] : []),
    ...(plan.migrations ? ["migration-and-restart"] : []),
    ...(plan.full ? ["browser:full"] : plan.browserTags.map((tag) => `browser:${tag}`)),
    ...(plan.screenshots
      ? [
          plan.screenshotAll
            ? "screenshots:all-once"
            : `screenshots:${plan.screenshotModules.join(",")}`,
        ]
      : []),
    ...(plan.image ? ["production-image"] : []),
  ];
  const skipped = [
    ...(!plan.audit ? ["dependency-security-audit"] : []),
    ...(!plan.runtime ? ["development-runtime"] : []),
    ...(!plan.build ? ["production-build", "full-publication-scan"] : []),
    ...(!plan.migrations ? ["migration-and-restart"] : []),
    ...(plan.browserTags.length === 0 ? ["browser-feedback"] : []),
    ...(!plan.screenshots ? ["screenshot-feedback"] : []),
    ...(!plan.image ? ["production-image"] : []),
    ...(!plan.full ? ["full-regression"] : []),
  ];
  return [
    `Validation plan (${plan.full ? "full" : "affected Core"})`,
    `Changed paths: ${plan.paths.length}`,
    ...plan.paths.map((path) => `  - ${path}`),
    "Selected gates:",
    ...selected.map((gate) => `  - ${gate}`),
    "Skipped expensive gates:",
    ...(skipped.length ? skipped.map((gate) => `  - ${gate}`) : ["  - none"]),
    "Reasons:",
    ...(plan.reasons.length
      ? plan.reasons.map((reason) => `  - ${reason}`)
      : ["  - no changed paths"]),
    "Nightly, manual, and Release Please Full Regression remain exhaustive.",
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
