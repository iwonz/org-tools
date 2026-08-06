## Why

Individually bordered product tabs and a filled active tab make the navigation read as a row of
buttons rather than a tab control. The product navigation should instead form one cohesive island
with a tab-specific selection indicator.

## What Changes

- Group the six product tabs inside one bordered, rounded, theme-aware navigation island.
- Remove gaps, individual tab borders, and button-like active backgrounds.
- Indicate the active tab with stronger text and a thin inset bottom marker while preserving subtle
  hover and keyboard focus feedback.
- Preserve header height, order, horizontal scrolling, Radix tab semantics, and right-side actions.
- Leave all nested tab controls unchanged.
- Update interface documentation, browser assertions, and deterministic screenshots.
- Preserve all data contracts, localization, privacy, storage, and application behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interface-chrome`: Define the product navigation as one contiguous island with a non-button-like
  active-tab indicator.

## Impact

The change affects the header-specific Tabs classes, interface-chrome requirements, usage and
screenshot documentation, browser tests, and generated screenshots. It adds no dependency and
changes no state or public file format.
