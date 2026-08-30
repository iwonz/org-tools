## Context

Org Tools now has two persistence runtimes: revisioned SQLite projects and a browser file workspace.
Both already persist only complete `OrgToolsState` snapshots, while the global Import and Export
actions still carry older partial projections and arbitrary JSON mapping. The shared shell also
keeps a permanent Save status column and several Radix floating surfaces lack a visible edge when
their color matches the page.

## Goals / Non-Goals

**Goals:**

- Make the public transfer contract a single strict complete-workspace document.
- Make global Import failure-atomic and Export immediate while preserving current project/file
  identity and dirty tracking.
- Provide brief, non-shifting Save feedback and visually distinct dropdown surfaces.
- Remove obsolete code and artifacts rather than retaining compatibility readers.

**Non-Goals:**

- Change SQLite schema, project CRUD, revision conflict behavior, or browser file binding.
- Change the Download tab's CSV, JSON, template, clipboard, or PNG functions.
- Add remote storage, telemetry, a format version, or a migration layer.
- Add outlines to modal dialogs, tooltips, controls, or hover/active rows.

## Decisions

1. `OrgToolsState.content` becomes the literal `"workspace"`. The production parser rejects every
   other value before graph validation, and creators always emit the literal. This replaces the old
   public contract instead of preserving dead projections.
2. Global Import reads at most 25 MiB, parses one strict workspace into a detached candidate, and
   shows a compact summary before one destructive store replacement. The browser controller and
   SQLite project controller are not involved, so the current file handle or project identity stays
   unchanged and normal organization change tracking marks the result dirty.
3. Global Export validates one fresh live snapshot and immediately downloads
   `org-tools-state.json`. It is separate from persistence Save and the tabular Download workflow.
4. Save feedback uses a small view-state hook driven by dirty and persistence status transitions.
   Unsaved and successful Saved feedback expire after 2000 ms, Saving lasts for the write, failure
   persists until a new mutation or save attempt, and an absolutely anchored live region prevents
   header geometry changes.
5. Unsupported File System Access removes the entire Autosave row. New, Open, and Save As retain
   their existing input/download fallback. The file-menu visual heading is removed while its
   accessible trigger name remains.
6. Shared Popover and Select content plus direct theme/language and custom context-menu surfaces use
   one `border-border` hairline. Items keep borderless tonal interaction states and existing minimal
   separation shadows.
7. The screenshot manifest removes mapping, mapped preview, and partial export frames. The remaining
   48-frame catalog documents valid/invalid workspace Import, direct Export, fallback behavior,
   transient status, and outlined dropdowns. A primary workflow needs supporting frames only when
   the manifest declares additional UI behavior.

## Risks / Trade-offs

- [Existing partial files stop opening] → Reject them with an owned localized workspace-only error;
  full `content: "workspace"` files remain unchanged and no misleading migration is attempted.
- [Immediate Export has no visual confirmation] → Treat the browser download as confirmation and
  retain owned validation errors only.
- [Transient status could be missed] → Keep `aria-live`, show Saving for the complete operation, and
  leave failures persistent until the user acts.
- [A universal outline can become decorative noise] → Scope it to non-modal floating containers,
  use one neutral token, and never add item or interaction borders.
- [Large imports could duplicate state work] → Parse once into a detached candidate and install it
  atomically; no mapping or projection planning remains.

## Migration Plan

Replace the contract, UI, tests, docs, examples, screenshots, and capability specs in one commit.
There is no data migration: existing complete workspace files and SQLite snapshots remain valid;
obsolete partial and generic files are intentionally unsupported. Rollback is the single change
commit because no database schema or stored snapshot is rewritten automatically.

## Open Questions

None.
