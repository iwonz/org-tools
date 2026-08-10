## Why

The product header still reads as a separate strip from populated workflows because their outer
islands own a contrasting card fill. The Org Editor also places its primary controls on the opposite
side from the canvas origin and viewport controls, making the editing chrome feel split.

## What Changes

- Continue the shell background through the header and every top-level product workflow so the
  header and content read as one surface without a contrasting outer content fill.
- Preserve bounded fields, Employee and Team cards, nested Analytics groups, calendar cells,
  dialogs, popovers, selection states, and control islands where a boundary communicates meaning.
- Move the populated Org Editor's combined View and editing action island from the top right to the
  top left while keeping Search last and opening its field to the right.
- Keep the bottom-left viewport island, empty states, data contracts, state behavior, localization,
  privacy boundaries, and performance model unchanged.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interface-chrome`: Require one uninterrupted shell background across the app header and
  top-level workflow containers.
- `organization-editor`: Place the populated Editor action island at the top left and retain the
  right-opening Search behavior.

## Impact

The change affects the shared product-surface wrapper, Org Editor floating-control placement,
browser geometry assertions, screenshots, and interface documentation. It adds no dependency,
network behavior, storage, schema, import, export, or compatibility change.
