## MODIFIED Requirements

### Requirement: MCP management is a focused floating workflow
The MCP modal SHALL use the shared dialog hierarchy and provide compact consent, credentials, a
copyable agent setup prompt, and activity without exposing credentials behind the modal or shifting
sidebar geometry. Its title SHALL have a localized screen-reader description but no visible subtitle.
Long setup prompts and activity lists SHALL scroll within bounded regions while primary Enable,
Disable, Rotate, Copy, and Undo decisions remain explicit. It SHALL not duplicate enabled status in
a badge and SHALL not render a raw configuration section, Examples tab, or provider-notice section.

#### Scenario: Compact consent modal
- **WHEN** disabled MCP management opens at a narrow viewport
- **THEN** the full-access warning, cancellation, and Enable action remain readable without page overflow

#### Scenario: Enabled management modal
- **WHEN** enabled MCP management opens in either theme
- **THEN** endpoint, masked credentials, selected client, copyable setup prompt, and activity remain visually separated with restrained boundaries and shadows

#### Scenario: Accessible compact header
- **WHEN** assistive technology opens MCP management
- **THEN** it receives the MCP title and localized hidden description without rendering a visible subtitle
