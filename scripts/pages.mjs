import { copyFile, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
export const pagesOutput = join(repositoryRoot, "pages-out");

const manifestPath = join(repositoryRoot, "docs", "screenshot-demo.json");
const screenshotSource = join(repositoryRoot, "docs", "screenshots");
const screenshotOutput = join(pagesOutput, "screenshots");
const repositoryUrl = "https://github.com/iwonz/org-tools";
const moduleOrder = [
  "projects",
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
const moduleNames = {
  analytics: "Analytics",
  calendar: "Calendar",
  download: "Data Download",
  editor: "Visual Editor",
  employees: "Employees",
  export: "Workspace Export",
  import: "Import",
  language: "Language",
  projects: "Project workspaces",
  teams: "Teams",
  theme: "Theme",
};

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function assertString(value, field, index) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`Screenshot ${index + 1} has an invalid ${field}.`);
  }
  return value;
}

export async function loadShowcaseManifest() {
  const value = JSON.parse(await readFile(manifestPath, "utf8"));
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error("Screenshot manifest must be a non-empty array.");
  }

  const ids = new Set();
  const files = new Set();
  const scenarios = value.map((scenario, index) => {
    if (scenario === null || typeof scenario !== "object" || Array.isArray(scenario)) {
      throw new Error(`Screenshot ${index + 1} must be an object.`);
    }
    const id = assertString(scenario.id, "id", index);
    const module = assertString(scenario.module, "module", index);
    const title = assertString(scenario.title, "title", index);
    const file = assertString(scenario.file, "file", index);
    const description = assertString(scenario.description, "description", index);
    if (!moduleOrder.includes(module)) throw new Error(`Screenshot ${id} has an unknown module.`);
    if (!/^(?:demo|feature)-[a-z-]+\.png$/u.test(file)) {
      throw new Error(`Screenshot ${id} has an unsafe filename.`);
    }
    if (ids.has(id) || files.has(file)) throw new Error(`Screenshot ${id} is duplicated.`);
    if (typeof scenario.featured !== "boolean") {
      throw new Error(`Screenshot ${id} has an invalid featured flag.`);
    }
    if (
      !Array.isArray(scenario.capabilities) ||
      scenario.capabilities.length === 0 ||
      scenario.capabilities.some(
        (capability) => typeof capability !== "string" || capability.trim() === "",
      )
    ) {
      throw new Error(`Screenshot ${id} has invalid capabilities.`);
    }
    ids.add(id);
    files.add(file);
    return {
      capabilities: scenario.capabilities,
      description,
      featured: scenario.featured,
      file,
      id,
      module,
      title,
    };
  });

  for (const scenario of scenarios) {
    const sourcePath = join(screenshotSource, scenario.file);
    const exists = await stat(sourcePath)
      .then((entry) => entry.isFile())
      .catch(() => false);
    if (!exists) throw new Error(`Screenshot source is missing: ${scenario.file}`);
  }

  return scenarios;
}

function renderScenario(scenario) {
  const capabilities = scenario.capabilities
    .map((capability) => `<li>${escapeHtml(capability)}</li>`)
    .join("");
  const className = scenario.featured ? "scenario scenario--featured" : "scenario";
  return `<article class="${className}" data-screenshot="${escapeHtml(scenario.file)}">
  <a class="scenario__image" href="./screenshots/${escapeHtml(scenario.file)}" aria-label="Open ${escapeHtml(scenario.title)} screenshot">
    <img src="./screenshots/${escapeHtml(scenario.file)}" alt="${escapeHtml(scenario.title)}" loading="lazy" width="1440" height="1000">
  </a>
  <div class="scenario__body">
    <div class="scenario__heading"><h3>${escapeHtml(scenario.title)}</h3>${scenario.featured ? '<span class="badge">Core</span>' : ""}</div>
    <p>${escapeHtml(scenario.description)}</p>
    <ul class="capabilities">${capabilities}</ul>
  </div>
</article>`;
}

function renderPage(scenarios) {
  const featured = scenarios.filter((scenario) => scenario.featured);
  const heroScenario = featured.find((scenario) => scenario.module === "editor") ?? featured[0];
  if (!heroScenario) throw new Error("The showcase requires at least one featured screenshot.");

  const navigation = moduleOrder
    .filter((module) => scenarios.some((scenario) => scenario.module === module))
    .map((module) => `<a href="#${module}">${moduleNames[module]}</a>`)
    .join("");
  const sections = moduleOrder
    .map((module) => {
      const entries = scenarios.filter((scenario) => scenario.module === module);
      if (entries.length === 0) return "";
      return `<section class="module" id="${module}">
  <div class="module__heading"><span>${String(entries.length).padStart(2, "0")}</span><h2>${moduleNames[module]}</h2></div>
  <div class="scenario-grid">${entries.map(renderScenario).join("")}</div>
</section>`;
    })
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Org Tools static product showcase: local SQLite project workspaces, organization editing, analytics, calendar, import, and export.">
  <meta name="color-scheme" content="dark light">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23f3f6fa'/%3E%3Cpath d='M10 22 22 10m-8 0h8v8' fill='none' stroke='%230d1117' stroke-width='3'/%3E%3C/svg%3E">
  <title>Org Tools · Static product showcase</title>
  <style>
    :root { color-scheme: dark; --bg: #0d1117; --panel: #151b23; --panel-strong: #1b2330; --text: #f3f6fa; --muted: #9ba8b8; --line: rgba(255,255,255,.09); --accent: #8fb7d8; --accent-strong: #c5e1f5; }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { margin: 0; background: var(--bg); color: var(--text); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height: 1.55; }
    a { color: inherit; }
    img { display: block; max-width: 100%; }
    .shell { width: min(1540px, calc(100% - 40px)); margin: 0 auto; }
    .site-header { position: sticky; top: 0; z-index: 10; border-bottom: 1px solid var(--line); background: rgba(13,17,23,.9); backdrop-filter: blur(18px); }
    .site-header__inner { min-height: 68px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
    .brand { display: flex; align-items: center; gap: 12px; font-weight: 720; letter-spacing: -.03em; text-decoration: none; }
    .brand__mark { width: 30px; height: 30px; display: grid; place-items: center; border-radius: 8px; background: var(--text); color: var(--bg); font-size: 18px; }
    .header-links { display: flex; align-items: center; gap: 8px; }
    .button { display: inline-flex; min-height: 40px; align-items: center; justify-content: center; border-radius: 8px; padding: 0 16px; background: var(--text); color: var(--bg); font-size: 14px; font-weight: 680; text-decoration: none; }
    .button--quiet { background: var(--panel-strong); color: var(--text); }
    .hero { padding: 84px 0 52px; }
    .hero__copy { max-width: 900px; }
    .eyebrow { margin: 0 0 18px; color: var(--accent); font-size: 13px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 0; max-width: 980px; font-size: clamp(48px, 8vw, 102px); line-height: .95; letter-spacing: -.065em; }
    .hero__lede { max-width: 760px; margin: 28px 0 0; color: var(--muted); font-size: clamp(18px, 2.5vw, 24px); }
    .hero__actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 30px; }
    .boundary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; margin: 54px 0 0; overflow: hidden; border-radius: 12px; background: var(--line); }
    .boundary article { padding: 22px; background: var(--panel); }
    .boundary strong { display: block; margin-bottom: 6px; font-size: 15px; }
    .boundary span { color: var(--muted); font-size: 14px; }
    .hero-shot { margin-top: 44px; overflow: hidden; border-radius: 16px; background: var(--panel); box-shadow: 0 30px 80px rgba(0,0,0,.32); }
    .hero-shot img { width: 100%; height: auto; }
    .catalog-intro { padding: 82px 0 24px; }
    .catalog-intro h2 { margin: 0; font-size: clamp(34px, 5vw, 62px); letter-spacing: -.05em; }
    .catalog-intro p { max-width: 720px; color: var(--muted); font-size: 18px; }
    .catalog-nav { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 24px; }
    .catalog-nav a { border-radius: 7px; padding: 8px 11px; background: var(--panel); color: var(--muted); font-size: 13px; text-decoration: none; }
    .catalog-nav a:hover, .catalog-nav a:focus-visible { background: var(--panel-strong); color: var(--text); }
    .module { padding: 58px 0; scroll-margin-top: 72px; }
    .module__heading { display: flex; align-items: baseline; gap: 14px; margin-bottom: 22px; }
    .module__heading span { color: var(--accent); font: 600 12px/1 ui-monospace, SFMono-Regular, Menlo, monospace; }
    .module__heading h2 { margin: 0; font-size: clamp(28px, 4vw, 44px); letter-spacing: -.045em; }
    .scenario-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; }
    .scenario { min-width: 0; overflow: hidden; border-radius: 12px; background: var(--panel); }
    .scenario--featured { background: var(--panel-strong); }
    .scenario__image { display: block; overflow: hidden; background: #e8edf2; }
    .scenario__image img { width: 100%; height: auto; transition: transform .25s ease; }
    .scenario__image:hover img { transform: scale(1.012); }
    .scenario__body { padding: 20px; }
    .scenario__heading { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
    .scenario h3 { margin: 0; font-size: 19px; letter-spacing: -.025em; }
    .scenario p { min-height: 46px; margin: 10px 0 16px; color: var(--muted); font-size: 14px; }
    .badge { border-radius: 6px; padding: 4px 7px; background: rgba(143,183,216,.14); color: var(--accent-strong); font-size: 11px; font-weight: 700; text-transform: uppercase; }
    .capabilities { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; list-style: none; }
    .capabilities li { border-radius: 6px; padding: 5px 8px; background: rgba(255,255,255,.055); color: #c3ccd7; font-size: 12px; }
    footer { margin-top: 60px; border-top: 1px solid var(--line); padding: 42px 0 64px; color: var(--muted); }
    .footer-inner { display: flex; justify-content: space-between; gap: 24px; }
    @media (max-width: 800px) { .shell { width: min(100% - 24px, 1540px); } .header-links .button--quiet { display: none; } .hero { padding-top: 60px; } h1 { line-height: 1; letter-spacing: -.055em; } .boundary { grid-template-columns: 1fr; } .scenario-grid { grid-template-columns: 1fr; } .scenario p { min-height: 0; } .footer-inner { flex-direction: column; } }
    @media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } .scenario__image img { transition: none; } }
  </style>
</head>
<body>
  <header class="site-header"><div class="shell site-header__inner">
    <a class="brand" href="#top"><span class="brand__mark" aria-hidden="true">↗</span>Org Tools</a>
    <nav class="header-links" aria-label="Repository links">
      <a class="button button--quiet" href="${repositoryUrl}/blob/main/docs/screenshots.md" rel="noreferrer">All scenarios</a>
      <a class="button" href="${repositoryUrl}#run-locally" rel="noreferrer">Run locally</a>
    </nav>
  </div></header>
  <main id="top">
    <section class="hero"><div class="shell">
      <div class="hero__copy">
        <p class="eyebrow">Static product showcase · 46 verified scenarios</p>
        <h1>Map the organization. Keep the data local.</h1>
        <p class="hero__lede">Org Tools is a private organization editor with durable SQLite project workspaces, visual structure, analytics, calendar, import, and export. The working application runs locally on Node.js and binds only to loopback.</p>
        <div class="hero__actions">
          <a class="button" href="${repositoryUrl}#run-locally" rel="noreferrer">Run the real app locally</a>
          <a class="button button--quiet" href="${repositoryUrl}" rel="noreferrer">Browse source</a>
        </div>
      </div>
      <div class="boundary" aria-label="Product boundary">
        <article><strong>Local by design</strong><span>Organization data moves only between your browser and the loopback runtime.</span></article>
        <article><strong>Durable workspaces</strong><span>Multiple projects live in one configurable local SQLite file with explicit Save.</span></article>
        <article><strong>Showcase, not a hosted editor</strong><span>This public page contains documentation and synthetic screenshots only.</span></article>
      </div>
      <a class="hero-shot" href="./screenshots/${escapeHtml(heroScenario.file)}" aria-label="Open the visual Editor screenshot"><img src="./screenshots/${escapeHtml(heroScenario.file)}" alt="${escapeHtml(heroScenario.title)}" width="1440" height="1000"></a>
    </div></section>
    <section class="catalog-intro"><div class="shell">
      <p class="eyebrow">Complete capability catalog</p>
      <h2>See every visible workflow.</h2>
      <p>Each frame is generated in Chromium from an isolated synthetic project. Core modules and supporting dialogs are kept together so the product can be understood without opening real organization data.</p>
      <nav class="catalog-nav" aria-label="Capability sections">${navigation}</nav>
    </div></section>
    <div class="shell">${sections}</div>
  </main>
  <footer><div class="shell footer-inner"><span>Org Tools · static showcase</span><span>The functional application runs locally. No organization data is accepted here.</span></div></footer>
</body>
</html>
`;
}

export async function buildPages() {
  const scenarios = await loadShowcaseManifest();
  await rm(pagesOutput, { force: true, recursive: true });
  await mkdir(screenshotOutput, { recursive: true });
  await Promise.all(
    scenarios.map((scenario) =>
      copyFile(join(screenshotSource, scenario.file), join(screenshotOutput, scenario.file)),
    ),
  );
  await writeFile(join(pagesOutput, "index.html"), renderPage(scenarios), "utf8");
  await writeFile(join(pagesOutput, ".nojekyll"), "", "utf8");
  return scenarios.length;
}

export async function validatePagesOutput() {
  const violations = [];
  const scenarios = await loadShowcaseManifest();
  const expectedFiles = scenarios.map((scenario) => scenario.file).sort();
  const rootEntries = await readdir(pagesOutput).catch(() => []);
  if (rootEntries.sort().join("\0") !== [".nojekyll", "index.html", "screenshots"].join("\0")) {
    violations.push("output root must contain only .nojekyll, index.html, and screenshots");
  }

  const actualScreenshots = await readdir(screenshotOutput).catch(() => []);
  if (actualScreenshots.sort().join("\0") !== expectedFiles.join("\0")) {
    violations.push("output screenshots must exactly match the screenshot manifest");
  }

  const html = await readFile(join(pagesOutput, "index.html"), "utf8").catch(() => "");
  if (!html.startsWith("<!doctype html>")) violations.push("index.html is missing or invalid");
  const declaredScreenshots = [...html.matchAll(/data-screenshot="([^"]+)"/gu)].map(
    (match) => match[1],
  );
  if (declaredScreenshots.sort().join("\0") !== expectedFiles.join("\0")) {
    violations.push("index.html scenario cards must exactly match the screenshot manifest");
  }
  if (!html.includes("Static product showcase") || !html.includes("runs locally")) {
    violations.push("index.html must identify the static showcase and local runtime boundary");
  }
  if (/<(?:script|form|iframe)\b/iu.test(html)) {
    violations.push("index.html must not contain scripts, forms, or frames");
  }
  if (/<(?:img|link|source)\b[^>]*(?:src|href)=["']https?:/iu.test(html)) {
    violations.push("index.html must not load remote resources");
  }
  if (/\b(?:localStorage|sessionStorage|indexedDB|\/api\/projects)\b/u.test(html)) {
    violations.push("index.html must not expose application storage or project endpoints");
  }
  const externalLinks = [...html.matchAll(/<a\b[^>]*href="(https?:\/\/[^"]+)"[^>]*>/gu)];
  if (
    externalLinks.some(
      ([tag, href]) => !href?.startsWith(repositoryUrl) || !tag.includes('rel="noreferrer"'),
    )
  ) {
    violations.push("external links must stay within the repository and suppress referrers");
  }

  return violations;
}
