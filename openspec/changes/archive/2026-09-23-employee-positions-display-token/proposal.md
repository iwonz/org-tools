## Why

The Employee display renderer currently turns `{position}` into isolated position badges and links
plain `{email}` values automatically. This loses the earlier compound assignment treatment and
prevents authors from choosing when an email address becomes an action.

## What Changes

- Add a display-only `{positions}` token that renders every contextual assignment as a native
  `Position · Unit` pill in structural order, including the localized missing-position label.
- Restore `{position}` and `{unitName}` as ordinary text values joined with `; `.
- Remove automatic email navigation from `{email}`; authors can create an explicit safe Markdown
  link such as `[{email}](mailto:{email})`.
- Use `{positions}` in the Employees and Units formats for new organizations while retaining every
  saved organization format unchanged.
- Match compound assignment layout, wrapping, and typography across list cards, Editor rows, and
  Editor PNG output.
- Keep rendering local and preserve the current safe-link protocol allowlist. State shape and
  structured Employee export remain unchanged.

Non-goals include rewriting saved formats, adding an image-export setting, or exposing
`{positions}` to custom Template fields and data-download templates.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `employee-model`: Define the display-only `{positions}` token, plain `{position}`, `{unitName}`
  and `{email}` behavior, and new blank-state defaults.
- `organization-editor`: Render and measure compound assignment pills in Editor DOM rows.
- `data-export`: Paint compound assignment pills and explicit inert email links in Editor PNG.
- `privacy-safety`: Require explicit safe Markdown before an email value can navigate.

## Impact

The shared Employee rich-line renderer, Employee card DOM, Editor row geometry, Canvas image
renderer, display-token suggestions, blank-state defaults, unit and browser tests, screenshots,
and related specifications and documentation change. The implementation adds no dependency,
network request, State property, SQLite schema change, or runtime migration.
