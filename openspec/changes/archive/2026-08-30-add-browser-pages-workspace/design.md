## Context

The local application is a Next.js server whose client owns all editing, analysis, rendering,
import, and export behavior while a project controller supplies SQLite persistence. GitHub Pages is
currently built by a separate handwritten showcase generator. Static export cannot include the
mutation route handlers or dynamic project routes, but it can host the existing Client Components.

File System Access is a progressive enhancement: supported secure-context browsers can retain a
user-selected JSON file handle, while other browsers must stay in memory and use downloads. The
public `OrgToolsState` and the local SQLite API must remain unchanged.

## Goals / Non-Goals

**Goals:**

- Publish the real six-workflow UI as a static application under `/org-tools/`.
- Share one UI and store implementation between SQLite and browser-file persistence.
- Add default-off, trailing, single-flight Autosave to both persistence modes.
- Keep workspace bytes out of browser databases, network requests, and generated artifacts.
- Preserve safe dirty-state, validation, conflict, and recovery behavior.

**Non-Goals:**

- Emulate SQLite, project CRUD, stable project links, or multi-project state on Pages.
- Add remote synchronization, accounts, telemetry, a service worker, or offline asset caching.
- Change the public transfer schema, SQLite schema, or project HTTP API.

## Decisions

### Use a second static Next.js entry point

`apps/pages` has one root App Router page, `output: "export"`, `basePath: "/org-tools"`, unoptimized
images, and no server routes. It aliases the browser source in `apps/ui` and renders the same shared
workspace surface through a browser controller. Keeping a separate app tree prevents static-export
analysis from collecting `node:sqlite`, mutation handlers, redirects, or dynamic project pages.

The Pages build first creates `apps/pages/out`, then the repository wrapper replaces ignored
`pages-out`, copies the static output, and adds `.nojekyll`. The existing manual workflow uploads
that artifact. The old handwritten showcase renderer is removed.

### Make persistence a discriminated client contract

The shared workspace context exposes common dirty, save status, manual Save, Autosave, and display
name behavior plus a `mode` discriminator. SQLite mode retains project lists and management methods.
Browser mode exposes New, Open, Save As, File System Access availability, and file recovery. The
shell renders `ProjectSwitcher` only for SQLite and a geometrically equivalent file popover for
Pages.

The browser controller starts with one blank parsed workspace, never a fake project document. Open
accepts only a strict full workspace. Existing Import remains separate so partial state and ordinary
JSON keep their existing append/replace workflow.

### Persist a handle, not organization data

The IndexedDB database `org-tools-browser` contains one `workspace` object-store entry named
`active-file-handle`. It stores only a structured-cloneable `FileSystemFileHandle`. Full snapshots,
imports, previews, entity IDs, selections, and file contents never enter IndexedDB, local storage,
session storage, cookies, or Cache Storage.

At startup, a remembered handle with granted read permission is opened and strictly parsed. A
promptable handle blocks editing behind Reconnect or Start blank because permission requests require
a user gesture. Denied, missing, or corrupt files remain recoverable and are never replaced with a
blank snapshot implicitly.

Unsupported browsers use a normal JSON input and full-workspace download. They cannot Autosave.

### Keep file writes explicit and conflict-aware

Manual Save validates and serializes one full workspace. A bound file is checked against its last
known `{lastModified, size}` fingerprint, written through `createWritable`, and marked clean only
after `close`. Save without a handle invokes Save As. Save As stores the new handle only after a
successful write. Download fallback marks the captured organization sequence clean after invoking
the full-workspace download.

An unexpected fingerprint pauses saving and offers Load file, Overwrite, Save As, or Cancel. New and
Open reuse Save/Discard/Cancel. `beforeunload` remains active while organization data is dirty.

### Add one default-off Autosave policy

The bounded boolean preference `org-tools-autosave-enabled` lives in local storage and defaults to
false. A 1000 ms trailing timer watches organization change sequence only. Save is single-flight;
changes arriving during a write stay dirty and schedule one follow-up. Manual Save cancels the timer
and runs immediately.

SQLite Autosave calls the unchanged expected-revision endpoint. Browser Autosave requires a writable
handle; enabling it without one opens Save As in the originating click, and cancellation leaves the
preference off. Errors and conflicts pause automatic writes without clearing dirty state. UI-only
changes never serialize the full organization; SQLite UI overlay persistence stays independent.

## Risks / Trade-offs

- [File System Access is unavailable in some browsers] → Feature-detect both pickers and keep the
  complete import/download fallback.
- [A remembered handle loses permission] → Require an explicit Reconnect gesture and never request
  access in the background.
- [Two pages write one file] → Compare fingerprints before every write and require an explicit
  conflict decision.
- [Autosave serializes a large state too often] → Observe organization sequence only, debounce for
  1000 ms, and allow one snapshot/write at a time.
- [Shared UI accidentally imports server code] → Give the static app its own route tree and fail
  artifact checks on `node:sqlite`, `/api/projects`, dynamic project paths, or server chunks.

## Migration Plan

Build and test both runtimes before replacing the Pages artifact. Merge the archived change into
`main`, publish through the guarded manual command, and verify the public Import/edit/export flow.
Rollback is a normal revert and Pages republish; no state or database migration is required.

## Open Questions

None.
