## Why

Org Editor PNG exports render Employee tags as bright blue chips with geometry that differs from the
Employee cards, making the exported image feel visually disconnected and leaving avoidable empty
space around wrapped tags. Product tabs also begin at inconsistent vertical offsets, so switching
between the flush Editor canvas and ordinary workflows produces a visible content jump.

## What Changes

- Render every tag in Org Editor PNG output with the same neutral chip treatment, typography,
  localized `label · date` content, and compact wrapping rhythm used by Employee cards.
- Use one shared deterministic chip geometry for PNG drawing and Employee-row height calculation so
  wrapped tag rows do not reserve unused vertical space.
- Remove the outer top inset from populated product-tab content while retaining horizontal and
  bottom breathing room and all meaningful internal control spacing.
- Keep the Editor canvas background distinct, preserve all tag data and export settings, and make no
  changes to state, import, or export contracts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: require Employee tags in PNG output to match the on-screen card treatment
  and use compact shared wrapping geometry.
- `interface-chrome`: require all product workflows to begin flush with the bottom edge of the
  unified header without a tab-specific outer top inset.

## Impact

The change affects the local canvas PNG renderer, shared Org Editor tag-packing constants, root
spacing in populated Teams, Employees, Analytics, and Download workflows, related unit/browser
tests, screenshots, and user/performance documentation. It adds no dependency or network behavior,
does not persist organization data, and does not change public state or output schemas.
