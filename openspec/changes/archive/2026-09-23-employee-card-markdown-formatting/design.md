## Context

The persisted Employee display formats already store arbitrary strings and resolve template tokens
into semantic parts, but every part is flattened before DOM or Canvas rendering. Consequently Tags
lose their catalog colors, positions lose their badge surface, and the first rendered line receives
hard-coded emphasis. Editor geometry currently counts plain lines and cannot account for wrapping
semantic chips. The shared Template format input supports caret token suggestions but has no
selection editing mode.

The exact State shape does not change. The implementation must preserve list-card navigation,
Editor single-button rows, local-only rendering, six locales, deterministic PNG output, and the
20,000 Employee / 4,000 Unit target.

## Goals / Non-Goals

**Goals:**

- Compile each resolved display format into a shared inline-Markdown and semantic-token model.
- Render equivalent text marks, Tag chips, position badges, links, wrapping, and row geometry in DOM
  and Editor PNG.
- Provide an accessible selection toolbar only in the four Display format inputs.
- Remove implicit line hierarchy and flatten Display configuration section surfaces.

**Non-Goals:**

- Full block Markdown, raw HTML, remote images, embedded content, or rich-text persistence.
- Changing the exact State contract, default format strings, or runtime compatibility behavior.
- Activating nested links inside an Editor Employee row.
- Styling arbitrary array or custom field values as chips.

## Decisions

### Compile to one rich-line model

The renderer will expose normalized lines whose nodes are regular text runs with bold, italic,
strike, code, optional safe-link metadata, or semantic Tag and position groups. DOM cards, Editor
rows, previews, and Canvas painting consume this model instead of independently parsing output.

Template conditions and token resolution run first, but token values are represented by opaque
markers while Markdown is parsed. Marker substitution happens only after parsing, so Employee data
cannot inject Markdown. The parser accepts inline GFM emphasis, delete, inline code, and links;
block markers, raw HTML, and images degrade to inert text. `mdast-util-from-markdown`,
`mdast-util-gfm`, and the GFM micromark extension become direct UI dependencies so the same AST is
available without a DOM renderer.

### Preserve semantic fields

The `{tags}` marker resolves from Employee Tag objects and reuses existing color, date, locale, and
search behavior. The `{position}` marker resolves to ordered contextual values and uses the former
neutral bordered position surface; `{unitName}` stays an independent safe Unit action in list
contexts. Semantic groups ignore surrounding Markdown marks and links, while adjacent regular text
retains them. Other arrays and Composite fields keep their existing deterministic text conversion.

### Use one inline layout contract

Every line has the same context-specific base font and normal weight. Text runs truncate when the
surface requires a single line; Tag and position groups wrap complete chips. Editor layout measures
rich lines at the available width and derives row heights, offsets, hit targets, anchors, Unit
bounds, and PNG coordinates from the same metrics. Canvas paints font marks, safe-link decoration,
code surfaces, catalog-colored Tags, and neutral positions from that layout. Open positions and Unit
Tag footers keep their current layout path.

### Add opt-in selection editing

`TemplateFormatInput` receives an explicit inline-Markdown-tools option used only by Employee
Display. A non-collapsed textarea selection opens a local anchored toolbar for bold, italic, strike,
code, and link operations. Format actions toggle delimiters and restore the selection. Link editing
uses a transient URL draft with Apply and Remove; outside dismissal and Escape discard only the
transient editor. The toolbar and `@` suggestion menu are mutually exclusive and never persist UI
state.

Only `http:`, `https:`, `mailto:`, and `tel:` destinations are active. Explicit Markdown links take
precedence over automatic field navigation. List cards use explicit protected anchors; Editor rows
and PNG retain visual link treatment without nested interactions.

### Bound parsing work

Resolved Markdown skeletons replace Employee values with stable markers. A small bounded cache keyed
by the format and the resolved conditional skeleton reuses parsed structures across visible rows.
Virtualization remains the primary list bound, and cache entries contain no organization values.

## Risks / Trade-offs

- **Rich chip wrapping can change card and Unit heights** → measure semantic groups with shared DOM
  and Canvas constants and cover anchors, collapsed Units, and long collections.
- **Textarea selection can collapse when toolbar controls receive focus** → prevent pointer-driven
  selection loss, retain an explicit range, and restore it after every command.
- **Markdown and template braces can interact unexpectedly** → keep the existing template parser
  authoritative and parse only its resolved literal/marker skeleton.
- **Unsafe links could disclose data or open embedded content** → allow only explicit navigation
  protocols, disable Editor interaction, suppress opener/referrer, skip HTML, and never load images.
- **AST parsing can add hot-path work** → cache marker skeletons, render only virtualized rows, and
  retain the existing scale browser scenario.

## Migration Plan

No State, SQLite, Import, Export, or BroadcastChannel shape changes. Existing format strings acquire
the new rendering interpretation immediately, and rollback restores the previous renderer without
data conversion.

## Open Questions

None.
