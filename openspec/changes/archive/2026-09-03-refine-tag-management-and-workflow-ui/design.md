## Context

The Tag catalog already owns UUID definitions, exact color parsing, and a dedicated edit dialog, but
its color picker is nested in a Popover whose Select portal has a lower z-index. Catalog rows still
read as cards, color changes are coupled to rename, and there is no Employee drill-down. Employee
Import is target-driven, Editor PNG tags use one neutral fill, and weekend styling is generic gray.
The application must retain six-locale, local-only, 20,000-Employee behavior in both runtimes.

## Goals / Non-Goals

**Goals:**

- Establish deterministic Dialog, Popover, and Select layering.
- Make Tag rows flat and give view, color, rename, and delete independent actions.
- Reuse virtualized full Employee cards for Tag membership.
- Make Import mapping source-driven and keep it one-to-one and bounded.
- Preserve catalog Tag colors in local PNG rendering.
- Improve Language, Unit-count, and Calendar weekend presentation.

**Non-Goals:**

- Changing `OrgToolsState`, SQLite, APIs, Import file shapes, Tag assignment shapes, or persistence.
- Importing Tag colors from Employee files or introducing remote flag assets.
- Publishing GitHub Pages manually.

## Decisions

### Floating surfaces use an explicit layer order

Dialog content remains the modal base, Popover portals render above it, and Select portals render
above Popovers. The shared Select primitive owns the higher layer so every nested Select benefits
without component-specific workarounds. Errors and help tooltips retain their higher layers.

### Tag concerns use separate actions

The rename dialog contains only the name draft. A palette icon opens the shared color editor from
the catalog row. Named/reset choices commit once; palette and hue gestures preview locally and
commit once at gesture completion; valid exact input commits on Enter or blur. Escape, outside-close
without a committed value, and invalid input leave the definition unchanged. This avoids rebuilding
the 20,000-Employee derived model on pointer samples.

An Eye action stores only the stable Tag ID. Its dialog derives current Employees from the shared
name-sorted index and renders `EmployeeCardList` with the ordinary Tag/Edit/Delete action
composition. Removing the Tag or Employee re-derives the list; disappearance of the definition
closes the drill-down.

### Language flags are bundled decoration

Six small local SVG assets represent GB, CN, RU, ES, FR, and SA. They are `aria-hidden`, appear at
the logical start of each radio row, mirror with RTL, and never introduce a request or locale state.

### Employee mapping is source-driven

Transient mapping becomes a one-to-one collection of `{ sourcePath, target }`. Every discovered path
renders once with a target Select. Suggested aliases preselect targets and all other paths default to
Do not import. Selecting an occupied target transfers it from the previous source. Targets include
built-ins, Tags, Teams, existing Value definitions, and a staged new Value definition bound to the
source row. Mapping rows are virtualized; changing them reuses parsed source rows and runs the
existing indexed preview derivation once.

### Canvas tags share deterministic visual color resolution

The Tag layout carries label plus catalog color. A pure helper resolves neutral, named, six-digit,
and alpha-bearing custom colors to a light tonal fill and contrast-safe foreground for canvas use,
matching the live Tag semantics without reading DOM styles. Text measurement, wrapping, row growth,
and image bounds remain unchanged.

### Weekend presentation uses a semantic rose token

Weekend headings and in-month cells use theme-aware rose fill variables. A current weekend retains
the weekend surface while the existing signal date badge provides the strongest current-day cue.
Unit roster metadata is reordered only: count and matches follow search, then selected Unit identity
and breadcrumbs.

## Risks / Trade-offs

- **Large heterogeneous imports can expose many paths** → virtualize the source-path rows and keep
  source discovery and representative JSON bounded as today.
- **Fast palette movement could trigger repeated persistence** → separate local preview from the
  single commit at gesture completion.
- **Nested dialogs can lose focus context** → store stable IDs, use sibling Radix dialogs, and return
  focus to the originating action after close.
- **Canvas and CSS colors can drift** → test one shared pure color resolver for neutral, named,
  custom, and alpha values in both preview and downloaded PNG paths.
- **Country flags are representative of languages, not locale regions** → document the fixed visual
  mapping and keep the language name/autonym as the authoritative accessible label.
