## Why

The full-View image export dialog places its settings in a narrow right-hand column on wide screens, which compresses controls and causes labels and color choices to wrap poorly. Its explanatory subtitle repeats what the dialog title and action already communicate.

## What Changes

- Place the complete-View preview first and stack every image setting below it, matching the established Unit context-menu image export layout.
- Remove the descriptive subtitle from the full-View image export dialog.
- Preserve every existing export setting, preview interaction, Copy and Save action, renderer behavior, and local-only data flow.
- Keep the exact State shape and SQLite contents unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: require the full-View image export dialog to use the same vertical preview-and-settings composition as scoped Unit image export and omit the redundant subtitle.
- `project-tooling`: cover the vertical dialog composition and removed subtitle in browser tests and the maintained screenshot gallery.

## Impact

The change affects the full-View image export dialog, six bundled locale catalogs, focused browser assertions, product documentation, OpenSpec capability requirements, and existing gallery images. It adds no dependency, network access, State field, persistence behavior, or SQLite conversion.
