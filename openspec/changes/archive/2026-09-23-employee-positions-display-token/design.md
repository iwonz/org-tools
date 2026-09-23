## Context

Employee display formats are resolved into cached rich lines shared by list cards, Editor DOM rows,
and Editor PNG. `{position}` currently becomes a semantic badge group, while `{unitName}` remains
text and `{email}` gains an automatic `mailto:` action in list cards. The earlier Employee cards
instead represented each Unit assignment as one pill containing both position and Unit.

The State already stores four arbitrary format strings. This change alters blank-state defaults and
rendering semantics without changing the State shape, persisted values, or trust boundary.

## Goals / Non-Goals

**Goals:**

- Introduce display-only `{positions}` assignment pills while restoring scalar `{position}` and
  `{unitName}` text behavior.
- Reproduce the previous `Position · Unit` hierarchy and Unit navigation in list cards.
- Keep Editor geometry and PNG painting deterministic and visually aligned with the DOM.
- Make email navigation author-controlled through explicit safe Markdown.
- Preserve previously valid custom fields named `positions` until their owner renames them.

**Non-Goals:**

- Rewriting existing saved formats or changing structured exports.
- Adding `{positions}` to custom Template fields or data-download templates.
- Adding persistent State, an image-export control, a dependency, or remote behavior.

## Decisions

### Use a display-only semantic token

The Display tab exposes `{positions}` in addition to the shared Employee and contextual Unit keys.
The resolver emits one semantic assignment record per supplied Unit context, including contexts
whose position is empty. `{position}` and `{unitName}` continue through ordinary array formatting,
so they serialize with `; ` and accept normal Markdown styling.

This keeps the native compound treatment explicit. Inferring a compound pill from adjacent
`{position}` and `{unitName}` tokens would make templates sensitive to whitespace and prevent the
two values from being used independently.

### Preserve legacy custom-key validity

The State parser continues accepting a custom field whose normalized key is `positions`. Such a
field wins over the display semantic token and remains editable under its existing key. Model saves
reject creation of a new `positions` key or renaming another field to it, and the Display suggestion
list offers the custom field instead of the semantic token while that collision exists.

This avoids invalidating a previously valid State while making future authoring unambiguous.

### Keep assignment data structured until final rendering

The rich model stores the localized position label and its Unit context. A shared text projection
produces `Position · Unit` for line normalization, measurement, tests, and accessible fallback. DOM
renders the position with foreground emphasis and the Unit with muted text; Canvas uses the same
ordered records and compound width projection with a dedicated painter.

Whole assignment pills wrap between records. Long content stays within the available width through
the existing bounded truncation behavior. The row-count helper measures the compound projection so
Editor rows, Unit bounds, hit targets, anchors, and PNG use the same number of visual rows.

### Localize the missing position at the rendering boundary

The shared rich renderer accepts the localized `Position not specified` text, with the English
catalog key as a deterministic fallback for non-React callers. Card and image entry points pass the
active locale text. No export preference or persistent field is added.

### Remove implicit email actions from formatted cards

An ordinary `{email}` node follows the same text path as other scalar fields. The existing explicit
Markdown link path remains the only way to produce a `mailto:` action, validates the current
protocol allowlist, stops card activation, and remains inert in Editor and PNG. Profile and Unit
automatic actions retain their current behavior.

## Risks / Trade-offs

- **Canvas text metrics can differ slightly from CSS metrics** → Measure the compound text with the
  active export font, use the shared packing order, and cover narrow and multi-assignment cases in
  geometry and browser tests.
- **A legacy custom `positions` field hides the new token** → Preserve the custom field deliberately,
  suppress the duplicate suggestion, and make the semantic token available after rename.
- **Existing formats keep the old authored `{position}` result** → Leave them unchanged as required;
  document `{positions}` and apply it to new-organization defaults and maintained fixtures.
- **A long Unit name can consume the pill width** → Keep the position visible first and truncate the
  remaining Unit segment inside the bounded pill.
