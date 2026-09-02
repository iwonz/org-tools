## ADDED Requirements

### Requirement: Employee transfer is completely localized
Both bundled locales SHALL provide matching non-empty messages for transfer tabs, source mapping,
Team options, counts, duplicate policies, per-row actions, validation, progress, confirmation, and
accessibility names. User data and source field paths SHALL remain verbatim.

#### Scenario: Russian Employee Import
- **WHEN** Russian is active and the user opens every Employee Import step
- **THEN** all owned visible and accessibility copy is Russian except allowed technical terms and user data

#### Scenario: English Employee Export
- **WHEN** English is active and the user opens Employee Export
- **THEN** all owned visible and accessibility copy is English

## REMOVED Requirements

### Requirement: The canonical Editor View uses destination terminology
**Reason**: The Editor no longer exposes a View concept or selector.

**Migration**: Use the localized Editor destination name and the one current Unit structure.
