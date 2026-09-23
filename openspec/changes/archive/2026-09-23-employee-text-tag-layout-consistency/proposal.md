## Why

Employee display text is currently sized with average character-width heuristics and then clipped
inside absolutely positioned fragments, which cuts valid username and email suffixes. Tag surfaces
also mix normal and compact metrics and estimated suffix widths, producing inconsistent padding,
spacing, and rendering between application DOM and Editor PNG output.

## What Changes

- Measure Employee display text, Markdown runs, Tag labels, dates, counts, and assignment ranges with
  the actual target font through one bounded Canvas measurement service.
- Replace normal and compact Tag densities with one 11 px visual contract using 8 px inline padding,
  2 px block padding, a 6 px radius, and 6 px horizontal and vertical gaps everywhere.
- Keep dated and counted suffixes inside their logical Tag surface with exactly the shared padding and
  no estimated trailing width.
- Use a fixed 6 px gap between rows created by Tag or assignment wrapping while retaining the saved
  Employee line gap for authored, blank, and ordinary text rows.
- Recalculate Editor rows, Unit bounds, virtualization, hit testing, anchors, and PNG output from the
  same measured layout.
- Render each Employee Display Reset action at normal font weight.
- Keep all measurement and font loading local; do not change persistent State, import/export data, or
  SQLite.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `employee-model`: require complete unclipped formatted values, exact measured wrapping, unified Tag
  metrics, fixed semantic-wrap gaps, and a normal-weight Reset action.
- `dated-employee-tags`: require one Tag surface contract for labels, dates, and counted suffixes with
  symmetric content padding.
- `tag-catalog`: require every application Tag surface and collection to use the same typography,
  decoration, and two-axis spacing.
- `organization-editor`: require DOM geometry and PNG drawing to consume actual-font measurements and
  the one shared Tag contract.
- `interface-chrome`: replace density-specific Tag presentation with one accessible visual surface.
- `project-tooling`: cover unclipped identity text and exact cross-surface Tag geometry in maintained
  validation and the 59-frame gallery.

## Impact

The change affects Employee rich layout, Tag surface primitives, list cards, Employee controls,
Calendar, Editor rows and Unit footers, image export, unit and browser tests, maintained screenshots,
and rendering/performance documentation. The runtime will add no dependency or network request.
State remains exact and unchanged, so the configured SQLite snapshot requires validation but no
conversion. Deliberate compact Tag sizing is removed; Editor rows and exported Unit geometry may grow
to preserve the unified metrics and complete content.
