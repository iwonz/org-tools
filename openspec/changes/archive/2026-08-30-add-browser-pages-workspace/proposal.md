## Why

The public GitHub Pages URL currently stops at a screenshot catalog even though the core product is
already browser-native. Visitors need a functional, backend-free workspace that preserves the local
privacy boundary while the Node.js runtime continues to provide durable multi-project SQLite use.

## What Changes

- Replace the public showcase with a statically exported Org Tools application containing every
  client-side product workflow.
- Add one browser workspace backed by a user-selected JSON file through File System Access when
  available, with an in-memory and download fallback elsewhere.
- Persist only the last file handle, never workspace bytes, in IndexedDB and require explicit
  permission recovery.
- Add opt-in manual or debounced Autosave to both browser files and SQLite projects; manual Save and
  revision/file conflict protection remain available.
- Keep the strict unversioned `OrgToolsState` transfer contract unchanged.
- Remove obsolete showcase-only output and documentation, extend the screenshot catalog, and publish
  the tested static application through the existing guarded Pages workflow.

## Capabilities

### New Capabilities

- `browser-pages-workspace`: Static browser runtime, local file lifecycle, fallback behavior, and
  browser-file conflict recovery.

### Modified Capabilities

- `interface-chrome`: The persistence control adapts between SQLite projects and a single browser
  workspace, with a shared Autosave preference.
- `privacy-safety`: A public static application may process local organization data in memory and a
  user-selected file without transmitting it or persisting snapshots in browser storage.
- `project-tooling`: Pages commands, CI, publication checks, screenshots, and deployment validate a
  functional static application instead of a documentation artifact.
- `project-workspaces`: SQLite projects gain opt-in debounced Autosave without changing their API or
  conflict contract.
- `public-showcase`: Remove the obsolete non-interactive showcase requirements.
- `workspace-state`: Startup and durability now have explicit SQLite-server and browser-file modes.

## Impact

This affects the shared React shell, workspace controllers, local preference utilities, a new
static Next.js application, Pages build checks and workflow, Playwright coverage, screenshots,
OpenSpec capabilities, and repository documentation. The local SQLite schema and HTTP API remain
unchanged. The only browser database entry is a structured-cloneable file handle; organization data
continues to live solely in memory, SQLite, explicit downloads, or the user's chosen JSON file.
