# Performance

The maintained interaction target is a workspace with 20,000 Employees and 4,000 Units on a modern
desktop browser. This is a design target for representative interactions, not a promise that every
canvas arrangement can render all nodes simultaneously.

## Data and indexing

- Persist normalized IDs and relationships rather than nested Employee copies.
- Build shared derived maps, search documents, Unit order, membership, birthday, dated-tag event,
  position, and tag indexes outside component render paths.
- Build expensive indexes lazily for Main and the active or exported custom View.
- A custom View references the global catalog and stores only local Employees and sparse overrides.
- Live Unit resolution uses its dedicated manual-assignment search indexes to avoid recursive Live
  membership and position evaluation.

## Rendering

Employee lists, Unit-aware pickers, long filter options, and import previews must remain virtualized.
Use stable item keys and remeasure rows when section composition or filters change. Components must
receive resolved data and contexts through props rather than observing the whole organization store.

Analytics keeps six bounded virtualized lists, but lays them out with spacing and thin section
dividers instead of a nested border lattice. Calendar uses seven fluid columns, four or five
adaptive rows, at most two inline tag events per day, and a bounded two-line tag cloud so a 31-day
month fits the maintained 1280-by-720 desktop viewport. Smaller viewports retain local overflow as a
safe fallback. Per-tag event dialogs virtualize upcoming and past rows.

Canvas pointer movement should update imperative preview state without triggering a complete React
render for every event. Portaled drag previews and full-size valid drop targets should avoid
measuring the entire tree repeatedly.

Org Editor Employee rows use deterministic tag-chip packing and cached per-Unit prefix offsets.
Locale or tag changes invalidate those measurements. Visibility lookup uses the prefix offsets, and
the same row-height model expands Unit bounds and local PNG output without hidden-tag counters.

## Import and export

Parsing and preview keep bounded samples for display while retaining enough normalized row and graph
state for an atomic commit. JSON hierarchy and inline Employee relations normalize once before preview.
Large synthetic fixtures are generated in a temporary directory and are never committed. Complete
state parsing validates references in indexed passes instead of repeated full collection scans.

Download derives only the selected sources and Employees. Canvas PNG generation reuses current layout
and locally available embedded avatar data, with no network fetch.

Avatar input is bounded before interactive editing: 25 MiB compressed, 40 megapixels decoded, and a
4096-pixel longest-side preview. Confirmation renders only one 512-by-512 WebP canvas and releases
the temporary source URL rather than retaining both original and cropped images.

## Verification

Performance-sensitive changes should record dataset size, browser, build mode, and measured
interaction. At minimum, exercise search, filters, Unit navigation, View switching, canvas selection,
mapped import preview, and export against the maintained target dataset. Treat visible blocking,
unbounded memory duplication, or per-row network work as regressions.

Generate the maintained dataset outside the repository with `pnpm fixture:performance`. The command
prints the temporary `org-tools-state.json` path and does not create a tracked fixture.
