## Context

Employee card presentation is stored as four format strings and four integer line gaps in the strict organization State. The Display tab currently mirrors all eight values into dialog-local drafts and commits them with one Save action. Normal list cards use CSS row spacing, while Editor and PNG rows use the shared measured layout. This creates different vertical behavior and makes a single-line gap appear to affect outer card height. The list renderer also adds implicit navigation for ordinary tokens even though the format language already supports explicit safe Markdown links.

Both runtimes already observe organization mutations: server mode coalesces validated SQLite writes, and browser mode publishes organization snapshots through `BroadcastChannel`. The State shape and allowed gap range are already correct and remain unchanged.

## Goals / Non-Goals

**Goals:**

- Apply each valid display format or gap edit immediately with one focused organization mutation.
- Keep transient invalid number-input text outside State and normalize it predictably on commit.
- Restore one locale-aware default format without changing its gap or another section.
- Use one measured visual-row model for list DOM, Editor geometry, and PNG vertical spacing.
- Limit implicit Unit navigation to the Unit segment of `{positions}` in Employees and Units.
- Preserve local-only data flow, exact State validation, performance targets, and the maintained gallery size.

**Non-Goals:**

- Changing the State schema, gap range, default gap values, format grammar, or SQLite data.
- Adding automatic links to ordinary tokens or making Editor/PNG content interactive.
- Changing Model-tab custom-field save behavior or PNG-local format override behavior.

## Decisions

### Focused no-op-aware store mutations

The store will expose one operation for a single display format and one for a single line gap. Each operation compares the requested value with the current value before replacing the containing object. Valid changes therefore use the existing organization-change observation, SQLite writer, and live-tab publisher exactly once; repeated values create no revision or persistence work. The existing aggregate setter can remain for internal restoration paths but will also avoid replacing equal state.

This is preferable to a debounced dialog draft because closing the dialog must not cancel an accepted edit and other open tabs need the canonical value as soon as it is valid.

### Controlled format values and transient numeric buffers

Each format input reads the stored value and writes through its focused store operation on every change. Reset computes `createDefaultEmployeeDisplayFormats(store.locale)` at activation time and writes only the selected key.

Each number input keeps a small local string buffer so blank, fractional, and otherwise invalid intermediate typing does not enter State. An in-range integer writes immediately. Blur or Enter clamps a parseable number to 0–24 and restores the latest stored value for an empty or nonnumeric buffer. External state updates replace the buffer when it is not carrying an invalid active edit.

### Shared measured visual rows for list cards

Normal list cards will measure the information-column width and call the same platform-independent employee layout used by Editor and Canvas. The resulting visual rows carry explicit `y`, height, and fragment geometry. DOM positions rows with the shared coordinates, so total height is the sum of row heights plus the configured gap between adjacent rows only. A `ResizeObserver` invalidates visible cards when their width changes; existing bounded layout caches retain keys for content, width, density, locale, direction, and font.

This removes CSS line-height inflation and negative-margin compensation, which cannot reliably match Canvas wrapping or represent authored blank rows.

### Explicit interaction context

Employee card rendering receives a semantic surface context. Only `employees` and `units` enable the Unit-name segment inside a native `{positions}` surface. The position text, separator, and every ordinary token remain text. Fallback cards, drag previews, Editor, and PNG pass inert contexts. Explicit validated Markdown links remain interactive in list contexts and visually inert in Editor/PNG.

The context is explicit rather than inferred from the presence of a callback, because fallback surfaces may still need Unit-selection callbacks for unrelated controls and must not gain navigation accidentally.

### Shared format input callback

`TemplateFormatInput` emits one change notification for one textarea edit and accepts an optional label-side action slot. The Display tab uses that slot for Reset. Other template inputs keep their existing behavior and do not acquire Reset automatically.

## Risks / Trade-offs

- **[Measured list rows could cause resize churn]** → Observe only the content column of mounted virtual rows, ignore unchanged widths, and reuse the bounded shared layout cache.
- **[Immediate writes could amplify typing traffic]** → Focused no-op guards prevent duplicates, while the existing server writer coalesces pending snapshots without delaying in-memory or live-tab updates.
- **[Transient numeric text can diverge from synchronized State]** → Keep invalid text only while the input is actively edited, then normalize on blur/Enter; accept external values once editing completes.
- **[Split semantic fragments can duplicate interactive controls]** → Treat all wrapped Unit fragments as one logical destination with a stable accessible label and consistent click handling while leaving non-Unit fragments inert.
- **[Removing implicit profile navigation changes an established shortcut]** → Preserve explicit Markdown links, including formats such as `[{fullName}]({profileUrl})`, and document the explicit behavior.

## Migration Plan

No data migration is needed because the exact State shape, accepted values, and defaults do not change. Deploy code and documentation together, validate the configured database as already current, and use normal rollback to the prior application commit if needed; stored formats and gaps remain valid in either revision.

## Open Questions

None.
