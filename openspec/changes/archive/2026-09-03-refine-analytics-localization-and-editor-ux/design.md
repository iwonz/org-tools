## Context

Analytics currently builds six count groups from the derived Employee catalog and keeps a detached
entry snapshot while its drill-down is open. Locale bootstrap, strict state validation, catalogs,
date controls, and screenshot automation are hard-coded to `en` and `ru`. Language and theme use
Radix Select popovers. The Editor already coalesces pointer previews, but pointer-down replaces an
existing multi-selection before a group drag completes, and its history, layout, search, and canvas
controls share one top-left surface. The Unit workflow uses a content-sized first pane rather than
an equal split.

## Goals / Non-Goals

**Goals:**

- Derive known birth-year and age summaries locally in one bounded Analytics build.
- Provide complete bundled UI catalogs for the six UN languages and true Arabic RTL behavior.
- Preserve Editor multi-selection, provide selected-only arrangement, and reclaim canvas height.
- Make settings, overlay order, Unit panes, and Calendar labels consistent and testable.
- Preserve the 20,000 Employee / 4,000 Unit performance target and both local-only runtimes.

**Non-Goals:**

- No organization schema, SQLite schema, Import/Export, collaboration, or network-service change.
- No age inference for missing birthdays or the `1900` unknown-year sentinel.
- No alternate Editor Views, automatic organization layout, or manual Pages publication.

## Decisions

1. **Age analytics is a derived snapshot.** `buildAnalytics` accepts an injectable local calendar
   date, walks Employees once, and creates year buckets plus `all`, `male`, and `female` cohort
   summaries. Age is completed Gregorian years; averages retain a number and render to one decimal.
   Unknown or missing years are absent. Extremes compare exact birth date, then normalized name and
   UUID for deterministic ties. This avoids persisted derived data and deterministic-test problems.

2. **Drill-down stores an identity, not Employee arrays.** The open analytical view stores group and
   entry keys, then resolves the current entry from the latest result. Standard Employee actions
   can therefore mutate the organization without leaving stale cards behind.

3. **Locale remains a short stable state value.** `AppLocale` becomes `en | zh | ru | es | fr | ar`.
   A single locale registry owns catalog, BCP-47 formatting locale, direction, self-name, and date
   picker locale. Existing durable state wins; a blank revision uses saved metadata or the first
   supported `navigator.languages` value, then English. This retains explicit user choice while
   making first use browser-aware.

4. **Arabic is real RTL with a stable spatial canvas.** The provider synchronizes `lang` and `dir`
   on the document. Shell, dialogs, forms, and logical placement mirror. The world-positioned Editor
   layer uses LTR coordinates and direction-aware text wrappers so stored x/y positions, hit tests,
   and connections do not change.

5. **Noto Sans is one local superfamily.** Noto Sans covers Latin/Cyrillic, Noto Sans SC covers
   Simplified Chinese, and Noto Sans Arabic covers Arabic. Locale-specific CSS variables apply one
   member consistently to UI controls and portals. Export-only font selection remains separate.

6. **Language and theme are immediate modal choices.** Each sidebar action opens its own compact
   Dialog containing native-radio choice rows. Selection updates state immediately and closes the
   Dialog. No confirmation, draft, remote catalog, or additional persistence is introduced.

7. **Group drag distinguishes click from movement.** Pointer-down on an already selected Unit keeps
   the selection in the transient drag state. Crossing the drag threshold commits the group and
   retains selection; release below the threshold performs ordinary single selection.

8. **Selected arrangement uses an induced forest.** For two or more selected Units, external parent
   links are treated as temporary roots for layout, only selected coordinates are replaced, the old
   selected bounds center is retained, and the resulting group is snapped and moved away from
   unselected bounds. The operation is one store command and preserves selected IDs. Zero or one
   selected Unit keeps the existing full arrangement behavior.

9. **Overlay levels and toolbar anchors are explicit.** Canvas controls remain below the sidebar,
   the sidebar remains below dialogs, and errors remain highest. LTR uses history at top-left and
   canvas controls at top-right; RTL mirrors the logical anchors. Search is the inner-start item and
   grows away from the anchored group without moving its other controls.

10. **Responsive split geometry is structural.** Units uses two equal desktop columns with one
    aligned search row. Below 768 px the panels become equal-height rows. Calendar long-date output
    is assembled from locale parts, removing the Russian year suffix without hard-coded English
    ordering.

## Risks / Trade-offs

- **Six catalogs increase review surface** -> exact key/placeholder tests and a data-driven browser
  audit cover every locale and accessible surface.
- **RTL can expose physical CSS assumptions** -> replace relevant left/right layout with logical
  placement and run Arabic at 390 and 1280 px, while isolating world coordinates.
- **Noto script packages increase static size** -> bundle only required weights/subsets and reject
  remote font requests in Pages checks.
- **Selected layout can collide with external branches** -> use existing overlap resolution against
  the unselected set and assert that unselected coordinates never change.
- **Current date makes age output time-dependent** -> inject the date into pure analytics helpers and
  freeze it in screenshots/tests.

## Migration Plan

The state object and SQLite tables do not migrate. The strict locale validator accepts the expanded
enum; existing `en` and `ru` snapshots remain valid. Deployment replaces bundled client assets and
catalogs. Rollback remains a code rollback because no organization data is rewritten.

## Open Questions

None.
