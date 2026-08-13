## ADDED Requirements

### Requirement: Tabs use color-only pointer feedback
Product and nested tab triggers SHALL keep a transparent background when the pointer hovers them and
SHALL communicate hover through foreground color without adding a fill, border, underline, shadow,
font-weight change, or layout shift. Focus rings, active color, disabled state, and keyboard
navigation SHALL remain available.

#### Scenario: Product tab hover
- **WHEN** the pointer hovers an inactive product tab in either theme
- **THEN** the tab foreground changes while its background remains transparent
- **AND** its dimensions, border, font weight, and neighboring tab positions do not change

#### Scenario: Nested tab hover
- **WHEN** the pointer hovers an inactive nested tab in Download, a dialog, or another workflow
- **THEN** the trigger uses the same foreground-only feedback and retains a transparent background

#### Scenario: Keyboard focus
- **WHEN** a user focuses or activates a tab with the keyboard
- **THEN** the focus ring, color-based active state, and standard tab navigation remain available without a hover fill
