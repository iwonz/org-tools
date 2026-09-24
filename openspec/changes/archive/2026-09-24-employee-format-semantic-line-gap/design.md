## Context

`layoutEmployeeDisplayRichLines` currently emits one flat array of visual rows. Each row carries a `gapAfter`, so a semantic continuation can use the native Tag-surface gap while an authored or text-wrap boundary uses the saved format gap. List DOM positions every row absolutely, and Editor geometry and PNG iterate the same flat list.

Although the numeric geometry can describe both gap kinds, it does not preserve which rows belong to one resolved format block. The list renderer therefore cannot express the intended outer stack directly: the saved gap belongs between complete format blocks, while wrapping inside `{tags}` and `{positions}` belongs to those semantic collections and remains six pixels.

The work remains entirely inside local derived rendering. It does not cross a new trust boundary, alter State validation, or add a dependency.

## Goals / Non-Goals

**Goals:**

- Preserve resolved format blocks in the shared measured layout.
- Apply the saved line gap between adjacent blocks without top or bottom spacing.
- Preserve six-pixel vertical and horizontal packing inside wrapped Tag and assignment collections.
- Keep ordinary text wrapping, authored blank rows, inline semantic content, RTL coordinates, Editor geometry, and PNG output deterministic.
- Make list DOM structure reflect the shared geometry through an outer vertical flex stack.

**Non-Goals:**

- Changing the State shape, saved gap values, defaults, format syntax, tokens, localization, or SQLite data.
- Changing standalone Tag collections outside Employee formatted content.
- Changing Tag-surface typography, padding, radius, colors, or borders.

## Decisions

### Preserve blocks as a first-class derived layout level

The layout result will expose ordered visual blocks as well as the flattened visual rows consumed by existing Editor and Canvas paths. Each block records its measured height, global vertical offset, and child rows with offsets relative to the block. A blank authored row is a block; a source row that resolves empty is omitted.

This keeps one measurement pass and one bounded cache. Building a separate DOM-only grouping would risk geometry drift, while replacing all consumers with DOM measurement would make PNG rendering and large Editor views dependent on browser layout.

### Separate outer and internal gaps

The saved `lineGap` is inserted exactly once between adjacent blocks. There is no outer padding, and a single block is unaffected. Within a block, ordinary text wraps continue to use `lineGap`; continuation rows created while packing one `{tags}` or `{positions}` flow use `TAG_SURFACE_METRICS.gap`, which remains six pixels. Horizontal semantic packing also remains six pixels.

This matches the user's distinction between format line spacing and the collection's native chip packing. Treating every physical semantic row as an outer block would incorrectly expand or collapse the collection when the format setting changes.

### Render list blocks with flex and retain measured child coordinates

The list information column will be a column flex container with `row-gap: lineGap`. Each measured block is a relatively positioned child whose visual rows retain their exact measured horizontal coordinates and internal vertical offsets. Editor and PNG continue to consume the flattened rows and their global coordinates from the same layout result.

The unmeasured first render will use the same outer block stack and pass `lineGap` only to its outer rows; semantic fallback collections retain the native six-pixel gap. Once width and fonts are known, the measured result replaces it without changing the spacing contract.

### Keep cache and invalidation inputs unchanged

Block construction occurs inside the existing cached layout calculation. Width, content, locale, direction, font, measurement revision, density, and line gap remain cache inputs. The additional block arrays are linear views over the same measured fragments and preserve the 20,000 Employee and 4,000 Unit target.

## Risks / Trade-offs

- **Mixed text and semantic content can wrap at different boundary kinds inside one authored row.** → Preserve the current per-row internal `gapAfter` while adding the block boundary; tests cover text before and after semantic nodes.
- **DOM flex rounding could differ from absolute global offsets.** → Set block heights from the shared layout, position child rows from block-relative measured offsets, and compare DOM bounds with the flattened global coordinates.
- **Editor or PNG code could accidentally recompute grouping.** → Keep flattened `lines` on the shared layout as the only geometry input for these consumers and test equal row tops and total heights.
- **Initial unmeasured content could briefly use browser wrapping.** → Mirror the nested outer and semantic gap contract in the fallback DOM and retain the existing synchronous layout measurement path.

## Migration Plan

No migration is required. Deployment replaces derived rendering code only. Rollback restores the previous renderer without transforming State or SQLite. Before integration, verify that the configured owned SQLite snapshot remains valid and unchanged under the production parser.

## Open Questions

None.
