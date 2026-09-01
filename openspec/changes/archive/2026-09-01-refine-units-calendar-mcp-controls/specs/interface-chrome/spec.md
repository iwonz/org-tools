## MODIFIED Requirements

### Requirement: MCP management is a focused floating workflow
The MCP modal SHALL use the shared dialog hierarchy and provide compact consent, credentials, a
copyable agent setup prompt, and activity without exposing credentials behind the modal or shifting
sidebar geometry. Its title SHALL have a localized screen-reader description but no visible subtitle.
Long setup prompts and activity lists SHALL scroll within bounded regions while primary Enable,
Disable, Rotate, Copy, and Undo decisions remain explicit. Setup and Activity tabs and the primary
Enable or Disable action SHALL retain localized visible labels and place a thematic decorative icon
after each label without changing control geometry. The modal SHALL not duplicate enabled status in
a badge and SHALL not render a raw configuration section, Examples tab, or provider-notice section.

#### Scenario: Compact consent modal
- **WHEN** disabled MCP management opens at a narrow viewport
- **THEN** the full-access warning, cancellation, and icon-bearing Enable action remain readable without page overflow

#### Scenario: Enabled management modal
- **WHEN** enabled MCP management opens in either theme
- **THEN** endpoint, masked credentials, selected client, copyable setup prompt, and activity remain visually separated with restrained boundaries and shadows

#### Scenario: Accessible compact header
- **WHEN** assistive technology opens MCP management
- **THEN** it receives the MCP title and localized hidden description without rendering a visible subtitle

#### Scenario: MCP control icon order
- **WHEN** Setup, Activity, Enable, or Disable renders in the MCP modal
- **THEN** the localized text precedes one thematic icon and the icon does not add a duplicate accessible name

## ADDED Requirements

### Requirement: Units detail panes use one compact alignment
The Units hierarchy SHALL begin directly at the workflow content boundary without an empty spacer
below the shared header. Search, breadcrumbs, and Employee rows SHALL share one horizontal start
aligned to the Employee avatar column without introducing an outer border or shadow.

#### Scenario: Populated Units workflow alignment
- **WHEN** a Unit with Employees is selected at a maintained desktop width
- **THEN** the hierarchy has no redundant header gap and search, breadcrumbs, and Employee avatars share the documented content edge
