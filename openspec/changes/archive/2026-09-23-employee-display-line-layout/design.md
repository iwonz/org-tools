## Context

Employee card formats are persisted as four strings and rendered into a Markdown-aware rich-line
model shared by list cards, Editor DOM rows, and Editor PNG. The current splitter removes every
empty line, ordinary text is truncated, and Editor geometry counts only logical lines and semantic
chip wraps. Image export dialogs independently supply visible output for `isBoss`. The exact State
has no line-layout settings, so adding them requires a current-only State replacement and an offline
conversion of the owned SQLite row.

## Goals / Non-Goals

**Goals:**

- Preserve intentional internal blank lines and wrap ordinary rich text by words with character
  fallback.
- Persist one validated pixel gap per destination and use it in live previews and destination
  rendering.
- Produce one width-aware row layout for Editor DOM geometry and PNG drawing.
- Separate Employee-owned fields from Unit-context tokens and make `isBoss` condition-only.
- Preserve local-only data flow, bounded caches, and the 20,000 Employee / 4,000 Unit target.

**Non-Goals:**

- Runtime parsing of the obsolete State shape.
- Automatic rewriting of already-current user formats after locale changes.
- Changing Tag or assignment-pill visual primitives, card avatars, boss badges, open positions, or
  Unit Tag clouds.

## Decisions

### Store line gaps beside format strings

`organization.employeeDisplayLineGaps` mirrors the four keys in `EmployeeDisplayFormats` and stores
integers from 0 through 24. Keeping format strings intact avoids weakening field-reference rewrite
and delete protection. One store action commits both drafts so persistence and live-tab broadcast
observe one organization revision. Every default gap is 4 pixels.

### Preserve only intentional internal blank rows

The renderer tracks source-line intent before token evaluation. Blank lines between source lines
that produce content become explicit empty rich rows. Leading and trailing blanks and lines that
only become empty because a value is absent or a condition is false are omitted. This preserves
authored separation without making optional fields reserve space.

### Use a shared width-aware row packer

A pure layout function consumes rich nodes, available width, typography metrics, and the configured
gap. It wraps at Unicode whitespace and falls back to character boundaries for an oversized token.
The function accepts a text-measure callback, returns visual rows and block height, and uses bounded
measurement caches. Editor DOM passes system-font metrics and renders the packed rows; PNG passes
its selected font's Canvas metrics and draws the same row model. List cards use the same rich nodes
with CSS wrapping because their normal document flow owns height. Semantic Tag and assignment groups
retain their existing chip measurements and internal row gaps; the configurable gap applies between
text/format rows and never after the final row.

### Make `isBoss` condition-only

The Employee display resolver returns a boolean for conditional evaluation. Display formatting
suppresses its direct field value, so only a ternary branch creates visible text. New blank State
uses the locale selected at creation to embed the translated Manager literal in the default
Editor-export ternary. That stored user format does not change on later locale switches. The image
dialogs therefore no longer store, validate, or render an independent boss label.

### Publish explicit token scopes

Employee-owned keys and Unit-context keys become separate constants. The Model overview renders
both groups and marks `positions` as display-only. Custom Template-field suggestions use only
Employee-owned and custom keys because Unit context is unavailable during global custom-field
evaluation. Display suggestions retain both groups plus `positions`.

## Risks / Trade-offs

- **Text metrics can vary by browser font rasterization** → use one measurement entry point per
  runtime, render prepacked Editor rows, and cover narrow, long, marked, and unbroken text in DOM and
  PNG tests.
- **Wrapping increases row counts and geometry work** → cache parsed templates and measured text
  with fixed limits, calculate only visible/derived View rows, and retain virtualization.
- **Blank-line intent can be confused with optional empty fields** → preserve only source-authored
  internal blank lines and test false conditions independently.
- **The State change blocks an old owned database** → stop the runtime, back up the database family,
  convert a detached candidate, validate with the production parser, commit once, and prove reopen.

## Migration Plan

1. Confirm the configured SQLite row parses with the pre-change production parser and stop the
   owned runtime.
2. Copy the database and journal family to one timestamped ignored backup.
3. In an external uncommitted converter, add four line gaps of 4 and rewrite visible legacy
   `{isBoss}` output to an equivalent locale-literal ternary while leaving conditional references
   and all other formats unchanged.
4. Validate a detached candidate and all preservation fingerprints, then update the singleton row
   transactionally with one revision increment.
5. Validate the committed row with the new production parser and prove normal startup. Restore the
   backup family if any validation or startup check fails.

## Open Questions

None.
