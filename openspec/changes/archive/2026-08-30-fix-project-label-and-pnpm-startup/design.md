## Context

Org Tools already calls durable SQLite containers “projects”, while the browser-only file mode and
workspace-transfer UI expose “workspace” as a product label. The latter is an implementation and
state-contract term, not a useful second user concept. The repository also pins pnpm 10.33.2 in
`packageManager`; pnpm 11 defaults to enforcing that declaration and cannot self-switch when it was
itself launched by a Corepack shim, which produces the reported startup failure.

The strict `OrgToolsState` discriminator remains `content: "workspace"`. Organization data stays
inside the browser or loopback runtime and this change adds no request or persistence path.

## Goals / Non-Goals

**Goals:**

- Present Project consistently anywhere the UI currently exposes workspace terminology.
- Preserve correct grammar and complete error/recovery copy in English and Russian.
- Make `pnpm dev` runnable when Corepack invokes the repository's declared pnpm 11.24.0.
- Keep CI, lockfile, local builds, Pages builds, browser tests, and screenshots reproducible.

**Non-Goals:**

- Renaming TypeScript workspace types, components, storage keys, filenames, documentation concepts,
  OpenSpec capability names, or the public JSON discriminator.
- Changing SQLite project behavior, file permissions, autosave, Import/Export semantics, or state.
- Weakening package-manager checks with a global warning/ignore policy.

## Decisions

1. Existing typed message IDs remain unchanged and both message catalogs receive Project-oriented
   display values. This keeps call sites and format validation stable while making all currently
   visible and dormant localized copy consistent. Renaming internal identifiers was rejected
   because it creates mechanical churn without a user-facing benefit.
2. English and Russian display copy use the localized Project noun, Project file label, and matching
   New/Open actions with grammatical inflection in full sentences. “Workspace” remains only in
   machine contracts and engineering documentation where it describes the in-memory/state boundary.
3. The root `packageManager` pin moves to exact `pnpm@11.24.0`. Adding `pmOnFail: warn` or `ignore`
   was rejected because it would allow divergent toolchains and is not supported by the currently
   pinned pnpm 10 line. A redundant `devEngines.packageManager` declaration is also unnecessary.
4. Tooling validation will exercise the Corepack-facing package-manager selection as well as the
   normal `pnpm dev:check` path. The existing lockfile format is retained if pnpm 11.24.0 accepts it
   unchanged under a frozen install.
5. Browser and screenshot assertions will use the new visible terminology. The full screenshot
   gallery is regenerated and compared twice because the file menu and transfer dialogs are
   documented surfaces.

## Risks / Trade-offs

- **A blanket textual replacement could corrupt technical contracts.** → Change catalog values and
  user documentation selectively; retain keys, filenames, code identifiers, and
  `content: "workspace"`.
- **The pnpm upgrade could rewrite dependency resolution.** → Run a frozen install/check first and
  reject unrelated lockfile changes.
- **Older globally installed pnpm versions may need Corepack to download the pin once.** → Document
  Corepack as the supported selection path and keep one exact version for local and CI parity.
- **Screenshots can retain stale terminology.** → Regenerate all 48 frames and compare hashes from
  two complete runs.
