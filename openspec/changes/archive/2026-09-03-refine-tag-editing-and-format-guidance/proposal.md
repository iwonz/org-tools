## Why

Tag color editing currently separates the visual palette from exact value entry, while inline Tag editing makes a larger catalog workflow feel transient and cramped. Token-aware Format fields also hide their `@` shortcut until the user already knows it exists.

## What Changes

- Extend the Tag color control with a typed value editor supporting HTML Keyword, HEX, RGB, and RGBA input alongside the full palette and named presets.
- Normalize valid typed values to a canonical lowercase six- or eight-digit HEX Tag color while showing localized, format-specific validation feedback without mutating a Tag on invalid input.
- Replace inline/popover Tag editing in the Tag catalog with a dedicated edit dialog that contains the Tag name and shared color control.
- Add a compact help icon beside every token-aware Format label, plus localized hover/focus guidance and placeholder copy explaining that `@` opens token suggestions.
- Extend the strict state contract so custom Tag colors may retain an RGBA alpha channel as canonical eight-digit HEX, while existing named and opaque custom values remain valid.
- Preserve local-only behavior, existing named/custom filled Tag rendering, and the existing `{token}` output syntax.
- Non-goals: changing Tag assignment, adding remote color services, or changing export semantics.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `tag-catalog`: Extend the shared color picker and move catalog editing into a dedicated dialog.
- `single-state-runtime`: Extend strict custom Tag colors to canonical eight-digit HEX for RGBA alpha.
- `data-export`: Make the existing `@` token workflow discoverable in every shared Format field.
- `interface-localization`: Localize color-format controls, validation, Tag edit dialog copy, and token guidance across all six supported locales.
- `project-tooling`: Cover the new dialog, typed color formats, token affordance, and deterministic screenshots.

## Impact

- Affects the Tag catalog dialog, shared Tag color picker and color parsing utilities, shared Template Format input, six bundled message catalogs, unit/browser tests, screenshot scenarios, documentation, and canonical capability specs.
- Does not add dependencies, network access, persistence endpoints, or state versioning. Valid typed values are resolved locally to canonical lowercase HEX; the strict Tag color field is extended to accept eight-digit HEX for non-opaque RGBA values.
