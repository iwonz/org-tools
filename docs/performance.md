# Performance

The maintained interaction target is a workspace with 20,000 Employees and 4,000 Units on a modern
desktop browser. This is a design target for representative interactions, not a promise that every
canvas arrangement can render all nodes simultaneously.

## Data and indexing

- Persist normalized IDs and relationships rather than nested Employee copies.
- Build shared derived maps, search documents, Unit order, membership, birthday, gender, dated-tag
  event, position, and tag indexes outside component render paths.
- Build expensive indexes lazily for Main and the active or exported custom View.
- A custom View references the global catalog and stores only local Employees and sparse overrides.
- Live Unit resolution uses its dedicated manual-assignment search indexes to avoid recursive Live
  membership and position evaluation.

## Rendering

Employee lists, Unit-aware pickers, and long filter options must remain virtualized.
Use stable item keys and remeasure rows when section composition or filters change. Components must
receive resolved data and contexts through props rather than observing the whole organization store.
Employee list rows use a zero-gap virtualizer layout; their measured heights remain content-driven.

Analytics keeps six bounded virtualized lists on lightweight tonal surfaces. The groups use compact
grid gaps without borders, row cards, or section rules. Internal spacing is included in each
computed section height so the eight-row viewport cap remains unchanged. The shared product-surface
wrapper adds no observer or derived-data boundary. Calendar
uses seven fluid columns, four or five adaptive rows, at most two inline tag
events per day, and a bounded two-line tag cloud so a 31-day month fits the maintained 1280-by-720
desktop viewport. Smaller viewports retain local overflow as a safe fallback. Per-tag event dialogs
virtualize upcoming and past rows. The selected Calendar day is stored as one ISO key and resolves
against current indexes, avoiding duplicated Employee snapshots after edits or deletion.

Canvas pointer movement should update imperative preview state without triggering a complete React
render for every event. Portaled drag previews and full-size valid drop targets should avoid
measuring the entire tree repeatedly.

Org Editor controls render in compact top-left and bottom-left toolbar surfaces. These static paint
layers add no observers or canvas-data work. Search remains closed and unmounted at its zero-width
state until requested, then expands to the right of its trigger without changing canvas data or
forcing a layout pass over canvas nodes. The dedicated canvas background token adds no observer or
layout work. Its adaptive grid changes only the constant-cost CSS background interval when scale
changes. Coordinate snapping runs inside explicit add, move, paste, overlap, or layout commands and
does not add a render-time collection scan or pointer-event observer.

Org Editor Employee rows use deterministic tag-chip packing and cached per-Unit prefix offsets.
Locale or tag changes invalidate those measurements. Visibility lookup uses the prefix offsets, and
the PNG pipeline separately reuses one compact chip geometry for both painting and exported
row-height growth without hidden-tag counters or unused tag rows.
Quick Employee tag options keep one fixed 44 px virtualizer estimate so their compact layout does
not require content measurement or clip the checkbox and date action.

## Import and export

Import reads at most 25 MiB, validates one detached complete workspace, and derives only three
summary counts before an atomic replacement. It does not build mapping indexes, partial projections,
or preview graphs. Complete-state parsing validates references in indexed passes instead of repeated
full collection scans. Export serializes one validated live snapshot only after the explicit action.
Large synthetic fixtures are generated in a temporary directory and are never committed.

Download derives only the selected sources and Employees. Canvas PNG generation reuses current layout
and locally available embedded avatar data, with no network fetch.

## Project persistence

Organization change tracking observes store collection references and editor document references;
it does not stringify the workspace after each edit. The full 20,000-Employee and 4,000-Unit
snapshot is created, strictly validated, and serialized only for manual Save or one explicitly
enabled trailing autosave. UI-only changes never schedule that work. The 1000 ms debounce coalesces
organization mutations, allows only one snapshot write at a time, and schedules at most one next
write when edits arrive during an active Save. SQLite receives one snapshot and replaces one
`state_json` value in an atomic transaction; browser mode writes the same snapshot only to the bound
file handle.

UI persistence is a separate 300 ms debounced path. Its bounded projection contains scalar shell
state plus viewport and selection for each View; it never walks or serializes the Employee catalog,
Unit graph, Live rules, or editor documents. Revision conflicts do not retry or repeatedly serialize
in a retry loop. Project lists exclude state JSON, so opening the switcher remains proportional to
the number of projects rather than organization size. Browser IndexedDB work reads or writes only a
file handle and never traverses the organization graph.

Avatar input is bounded before interactive editing: 25 MiB compressed, 40 megapixels decoded, and a
4096-pixel longest-side preview. Confirmation renders only one 512-by-512 WebP canvas and releases
the temporary source URL rather than retaining both original and cropped images.

## Verification

Performance-sensitive changes should record dataset size, browser, build mode, and measured
interaction. At minimum, exercise search, filters, Unit navigation, View switching, canvas selection,
complete workspace Import, and Export against the maintained target dataset. Treat visible blocking,
unbounded memory duplication, or per-row network work as regressions.

Generate the maintained dataset outside the repository with `pnpm fixture:performance`. The command
prints the temporary `org-tools-state.json` path and does not create a tracked fixture.
