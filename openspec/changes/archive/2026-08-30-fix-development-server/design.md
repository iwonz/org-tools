## Context

`pnpm dev` currently lets Next.js 16 choose Turbopack while production deliberately builds with
webpack. Both development compilers observe the monorepo workspace root. The default ignored
`.org-tools/org-tools.sqlite3` therefore participates in file watching: opening or selecting a
project writes SQLite state, triggers Fast Refresh during root navigation, and can leave the browser
on the development `Rendering…` overlay even though `/` and the project route returned successful
responses. `pnpm dev:check` cannot detect this because its database lives in the system temporary
directory and it uses `fetch` only.

The runtime must remain loopback-only, use an isolated SQLite database during checks, terminate all
children, and make no external request with workspace data.

## Goals / Non-Goals

**Goals:**

- Make `pnpm dev` use a deterministic compiler that loads the first project in a real browser.
- Keep repository-local SQLite and browser-diagnostic writes outside the development module
  watcher.
- Verify the documented root URL, stable project redirect, interactive shell, and local project API.
- Keep diagnostics bounded and cleanup reliable on success, timeout, or browser failure.

**Non-Goals:**

- Changing production or Pages application behavior, workspace persistence, state contracts, or UI.
- Adding another browser engine, runtime dependency, telemetry, or remote health service.
- Treating the development probe as a replacement for the production browser suites.

## Decisions

1. `apps/ui` will start `next dev` through a bounded launcher that passes `--webpack` explicitly.
   Production already uses webpack, so this removes a dev-only compiler split. The launcher keeps
   Next output buffered until it has warmed `/`, the selected project route, and the project API;
   users therefore receive the ready URL only after the initial route compilation has settled.
   Retaining the raw compiler command was rejected because Next reports its listener ready before
   on-demand route compilation is complete.
2. The webpack configuration will ignore every `.org-tools` directory as runtime state and every
   `.playwright-cli` directory as browser-diagnostic output. Ignoring only `*.sqlite3` was rejected
   because rollback journals, configured database names, and local runtime config can change
   alongside the database. Both directory names are already gitignored and reserved for generated
   local state.
3. A root-only Next.js 16 `proxy.ts` will open a short-lived repository connection and return a real
   redirect before route rendering. If configuration or SQLite initialization fails, Proxy falls
   through to the existing root page so its localized blocking recovery remains intact. Reusing the
   process-global repository was rejected because Proxy is a separate request boundary and should
   not rely on shared globals.
4. The probe will launch Chromium from the repository's existing `@playwright/test` tooling after
   the HTTP server is ready. It will navigate from `/`, wait for the stable UUID project URL, and
   require the application shell and Editor canvas. The existing API response validation remains.
5. The probe's isolated database will live in a uniquely named child of the ignored `.org-tools`
   runtime directory. This reproduces the watcher boundary without touching the user's default
   database and removes only the child it owns.
6. The probe will import Playwright through the screenshots workspace, which already owns the
   dependency and browser installation in CI. No new package or network boundary is introduced.
7. Browser and server cleanup remain in one `finally` path. Failure output includes a concise
   browser cause plus the existing bounded server log tail.
8. The interactive launcher forwards termination signals, bounds startup output, accepts the
   existing root recovery page when SQLite is deliberately unavailable, and terminates Next on a
   timeout. It never opens a browser or sends a non-loopback request.
9. Gallery captures that do not intentionally demonstrate autosave will wait for transient
   `Unsaved` or `Saved` feedback to clear. Persistent `Save failed` feedback remains visible. This
   removes timer-bound raster differences without hiding a declared status scenario.

## Risks / Trade-offs

- **Webpack development startup can be slower than a healthy Turbopack startup.** → Reliability and
  parity with production take precedence for this local SQLite application; the bounded probe
  records the actual first-load path.
- **The probe now requires an installed Chromium binary.** → CI already installs it before
  `pnpm dev:check`, local browser suites have the same prerequisite, and a missing browser produces
  an explicit failure instead of a false healthy result.
- **A browser process could survive an interrupted probe.** → The owned browser closes before the
  Next.js child and temporary database cleanup in `finally`.
- **A broad ignore could hide source files.** → The pattern matches only path segments named
  `.org-tools` or `.playwright-cli`, which are reserved, ignored directories prohibited from tracked
  source content.
