## Why

The icon between the two words makes the compact product wordmark busier than intended. Removing it leaves a cleaner text-only identity while preserving the established accessible name and restrained gradient treatment.

## What Changes

- Remove the decorative emoji between `Org` and `Tools` in the application header.
- Keep a readable visual space between the words, the accessible `Org Tools` name, the light/dark graphite-to-blue gradients, and the no-shadow treatment.
- Update the header smoke coverage, documentation, and deterministic screenshots for the text-only wordmark.
- Do not change organization state, transfers, navigation, localization, privacy behavior, or dependencies.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `organization-editor`: Require a text-only `Org Tools` wordmark without an intervening icon or emoji.

## Impact

The compact application header component, browser smoke assertions, screenshot gallery, usage documentation, and organization-editor specification change. There is no public state or export compatibility impact, no new network or storage behavior, and no dependency change.
