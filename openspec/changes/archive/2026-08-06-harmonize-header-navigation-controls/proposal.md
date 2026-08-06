## Why

The product tabs still read as one dense segmented block, while the global actions on the right are
separate controls with visible spacing. Giving every product tab the same individual boundary and
rhythm will make the unified header more balanced and easier to scan.

## What Changes

- Render the six product tabs as separate, equally styled bordered controls instead of one filled
  segmented container.
- Use the same responsive horizontal gap for product tabs as for the right-side header actions.
- Preserve a clear active-tab state, hover and focus feedback, horizontal overflow, keyboard tab
  behavior, header height, and existing control order.
- Leave internal tabs in dialogs and product surfaces unchanged.
- Update interface documentation, browser assertions, and deterministic screenshots.
- Preserve all data contracts, application behavior, localization, privacy, and persistence.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interface-chrome`: Require individually bounded, consistently spaced product navigation items
  within the unified header.

## Impact

The change affects only the header-level Tabs styling, interface-chrome requirements, usage and
screenshot documentation, browser tests, and generated screenshots. It adds no dependency, changes
no public format, and introduces no network or storage behavior.
