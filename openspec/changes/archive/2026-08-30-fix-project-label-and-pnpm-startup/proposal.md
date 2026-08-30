## Why

The browser application still exposes the implementation term “workspace” where users expect one
consistent product concept: a Project. Separately, the repository pins pnpm 10.33.2, so a Corepack
shim already running pnpm 11.24.0 rejects `pnpm dev` before the application can start.

## What Changes

- Replace user-visible workspace terminology with Project terminology in both bundled locales,
  including the browser file menu, import confirmation, recovery, conflict, and error copy.
- Keep `workspace` as the internal and public JSON contract term; filenames, state shape,
  `content: "workspace"`, persistence behavior, and SQLite project identity do not change.
- Align the repository's exact package-manager pin with pnpm 11.24.0 so Corepack-launched pnpm
  11.24.0 can run repository commands without a version-policy failure.
- Update focused localization, browser, tooling, documentation, and screenshot expectations.
- Preserve the browser-only privacy boundary and do not add network behavior, telemetry, state
  migration, or a new persistence layer.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interface-localization`: Require Project as the consistent user-facing term in English and
  Russian while preserving the technical workspace contract.
- `browser-pages-workspace`: Rename the single-file lifecycle actions and feedback from workspace
  to Project without changing file behavior.
- `project-tooling`: Require the pinned pnpm version to work when invoked through Corepack and keep
  local development commands runnable.

## Impact

The change affects both message catalogs, focused UI/browser assertions and screenshots, the root
package-manager pin, contributor documentation, and the three listed capability specs. It does not
change application state, API routes, SQLite schema, saved JSON compatibility, dependencies, or
GitHub Pages architecture.
