## Context

The Tag catalog currently edits one Tag in an inline panel and its shared color popover offers a saturation/value palette, hue control, and named presets. Custom colors persist as lowercase six-digit HEX. The shared Template Format component already owns the `@query` suggestion behavior used by Data Download, Editor Template export, and custom Employee Template fields, but provides no visible discovery cue before typing.

The solution must stay local, dependency-free, strict, accessible, and complete in all six bundled locales. It must not make palette interaction traverse Employees or Units, and invalid input must never reach the organization store.

## Goals / Non-Goals

**Goals:**

- Support exact color entry in HTML Keyword, HEX, RGB, and RGBA modes beside the existing visual palette and named presets.
- Preserve RGBA alpha in the strict state using one normalized representation.
- Move Tag editing into a focused modal draft with explicit Save and Cancel.
- Make the existing `@` token workflow apparent at every shared Format field without adding persistent UI state.

**Non-Goals:**

- Changing Tag assignment, import behavior, export syntax, or named preset semantics.
- Adding a third-party color library, remote palette, eyedropper, or browser storage.
- Adding token catalogs back below Format fields.

## Decisions

### Canonical color storage remains HEX-based

Named presets remain semantic names. Typed HTML Keyword, HEX, and RGB values normalize to lowercase `#rrggbb`; RGBA values with a non-opaque alpha normalize to lowercase `#rrggbbaa`, while an alpha of one collapses to `#rrggbb`. This retains one deterministic persisted form, supports alpha without storing user-input syntax, and keeps equality and strict validation cheap. The state parser accepts only named presets, lowercase six-digit HEX, or lowercase eight-digit HEX. Short and uppercase HEX are accepted only as UI input and normalized before they reach state.

The input modes intentionally accept bounded, explicit syntax: a standard HTML/CSS named-color keyword; `#rgb` or `#rrggbb`; `rgb(r, g, b)` with integer channels; and `rgba(r, g, b, a)` with integer channels plus alpha from zero through one. A local standards keyword table avoids browser-specific parsing and network access. Alternatives such as persisting arbitrary CSS strings or using a color dependency were rejected because they weaken validation and increase runtime surface.

### Alpha influences the derived tonal surface

The color helper parses both canonical HEX widths. It composites the selected RGBA color against the local light or dark neutral base before deriving the restrained fill and readable foreground. Palette interaction produces opaque colors; exact RGBA entry is the explicit path to alpha. Contrast checks remain local and deterministic.

### Exact input is draft-only until valid

The picker owns transient input mode, input text, and validation. Changing mode reformats the current selected color into that mode. Valid input immediately updates only the parent Tag draft; invalid or incomplete input renders localized feedback and leaves the last valid draft color unchanged. Palette and preset choices update the exact field. Closing the color popover discards only incomplete input; closing the edit dialog discards the entire Tag draft.

### Tag editing uses a nested dedicated Dialog

The Tag catalog remains a searchable list. Edit opens a sibling portal Dialog containing Name and the shared color picker. Save invokes the existing atomic catalog mutation once; Cancel or close discards the copied definition. Delete remains a separately confirmed catalog action. A nested dialog is preferable to an expanded inline row because it avoids catalog reflow, keeps color controls fully visible, and gives focus restoration and escape handling to the existing Dialog primitive.

### Format guidance belongs to the shared input

`TemplateFormatInput` renders the Format label and a small focusable help icon. Its existing Tooltip explains that typing `@` opens token suggestions, and the textarea receives matching localized placeholder copy. Because all token-aware Format surfaces use this component, one change covers Data Download, Editor Template export, and Employee Template definitions without duplicating behavior. The tooltip and placeholder do not change the stored format, caret logic, or output.

## Risks / Trade-offs

- [Eight-digit HEX expands the strict state domain] → Update the shared type, parser, rendering tests, state fixtures, documentation, and both runtimes together; retain six-digit HEX and named presets unchanged.
- [RGBA colors can become visually weak] → Composite alpha against each theme base before deriving a contrast-checked tonal surface.
- [Exact input can be temporarily invalid while typing] → Keep it local, expose an inline error, and never call the parent change handler until parsing succeeds.
- [A dialog opened from another dialog can create focus or stacking issues] → Render it as a sibling portal, use the established Dialog primitive, and cover keyboard close/focus behavior in browser tests.
- [A help icon can add visual noise] → Use a small muted icon directly after the label, reveal copy only on hover/focus, and keep layout stable.

## Migration Plan

No database migration or compatibility reader is added. Existing semantic and six-digit HEX colors remain valid. New non-opaque RGBA values are stored directly in the singleton state as canonical eight-digit HEX and travel through normal strict Import/Export.

Rollback requires converting any eight-digit custom color to an opaque six-digit value before reverting the parser; otherwise the older strict runtime will correctly reject that state.

## Open Questions

None.
