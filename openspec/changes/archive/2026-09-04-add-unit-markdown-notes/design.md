## Context

Each organization View owns an exact Unit document, while Employee data is global. Unit cards are
spatially culled and share deterministic geometry with PNG export. The state parser requires exact
keys, server mode persists the full organization snapshot to one SQLite row, and Pages keeps the
same state only in live-tab memory. There is no Markdown dependency or renderer today.

## Goals / Non-Goals

**Goals:**

- Keep durable Markdown context on a Unit without expanding or visually crowding its canvas card.
- Make editing explicit, undoable, View-local, safely rendered, and available in both runtimes.
- Preserve notes through existing View copy, clipboard, state transfer, persistence, and tab-sync
  paths.

**Non-Goals:**

- Rendering notes in PNG, Employee JSON/Template output, Unit search, or the Units tab.
- Remote images, executable HTML, collaborative text editing, draft persistence, or a new API/table.
- Runtime migration or acceptance of the former Unit state shape.

## Decisions

### Store one bounded source string on each Unit

`OrgEditorUnit.noteMarkdown` is a required string, normalized to LF and limited to 64 KiB of UTF-8.
An empty or whitespace-only draft saves as the empty string. Unit construction supplies `""`, and
all existing structural copy paths retain the value through normal Unit cloning. This keeps note
ownership aligned with isolated View documents and requires no global identity between copied
Units.

The strict parser requires the new key. A one-time offline maintenance step backs up the configured
SQLite database and sidecars, adds an empty note to every stored Unit, validates the full new state,
and increments the singleton revision once. The SQL table shape and state API remain unchanged.
Former exported State files are intentionally rejected rather than normalized at runtime.

### Commit a dialog draft as one Editor command

Opening the dialog copies the Unit source into local component state and always selects Preview.
Preview renders the current draft, so a user can review edits before committing. Save validates and
normalizes the draft, then calls one `OrgEditorStore` command that changes only the target Unit note
and timestamp. Closing a changed draft routes through a nested confirmation; discard and cancel do
not notify persistence. Undo/Redo therefore remain View-local and automatic persistence observes
one organization mutation.

### Keep the canvas affordance geometry-neutral

An absolutely positioned document icon occupies the Unit header's reserved trailing inset. Empty
notes use opacity only and become visible on card hover, focus-within, or direct keyboard focus.
Nonempty notes remain visible with the semantic signal foreground and a restrained tonal fill.
Pointer handlers stop propagation before the card drag threshold. The button has an accessible name
but no tooltip, title, border, or shadow. Since neither card bounds nor content flow change, spatial
indexes, links, collision handling, and PNG geometry remain untouched, and PNG omits the affordance.

### Render a safe local GFM subset on demand

The dialog lazily loads `react-markdown` with `remark-gfm`. Raw HTML is not enabled. A custom image
renderer emits inert alternative text instead of an `img`, preventing local or remote requests.
Links require an explicit click and receive a new browsing context plus `noopener`, `noreferrer`,
and no-referrer policy. The renderer is instantiated only while a note dialog is open and memoized
by the draft; ordinary canvas rendering never parses Markdown.

## Risks / Trade-offs

- **State files become immediately incompatible** -> update fixtures and docs together, transform
  only the current local SQLite state with a verified backup, and keep the parser exact.
- **Large notes can stall parsing** -> enforce the UTF-8 limit before commit and lazy-load/render only
  the active dialog draft.
- **Invisible empty actions can be missed by keyboard or touch users** -> retain the action in the
  tab order and reveal it on focus-within in addition to pointer hover.
- **Markdown links can disclose data through navigation** -> never auto-fetch content and require an
  explicit protected click.

## Migration Plan

1. Stop the local runtime and copy the configured database plus any sidecars to one timestamped
   backup family.
2. Parse the existing organization/UI JSON with the current production parser, add
   `noteMarkdown: ""` to every Unit, validate with the new production parser, and update the
   singleton row in one transaction with revision incremented once.
3. Verify Employee, Tag, View, Unit, UI, and timestamp data are otherwise identical before removing
   the one-off maintenance code from the deliverable.
4. Roll back by restoring the backup family if validation or any filesystem/transaction step fails.

## Open Questions

None.
