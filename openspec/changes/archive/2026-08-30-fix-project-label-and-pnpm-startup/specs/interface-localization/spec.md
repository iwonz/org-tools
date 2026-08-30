## MODIFIED Requirements

### Requirement: The interface supports English and Russian
The application SHALL provide complete English and Russian translations for every runtime label,
status, empty state, dialog, validation error, accessibility name, tooltip, plural, number, tag date,
workspace replacement summary, destructive warning, and calendar date while leaving user-authored
and imported content unchanged. All user-facing copy SHALL call the editable organization a Project
and its selected JSON file a Project file; it SHALL NOT expose workspace or working-area terminology.
Russian UI copy SHALL present Unit as Team with grammatical declension and Live Unit as Dynamic Team
while machine contracts remain English.

#### Scenario: English transfer interface
- **WHEN** the active locale is English
- **THEN** project filename, size, counts, replacement warning, errors, and transient Save states are
  English and use Project terminology

#### Scenario: Russian transfer interface
- **WHEN** the active locale is Russian
- **THEN** project filename, size, counts, replacement warning, errors, and transient Save states are
  Russian and use the localized Project noun with grammatical inflection

#### Scenario: Localized state machine content
- **WHEN** either locale imports or exports a workspace document
- **THEN** explanatory copy is localized and calls it a Project while `kind`, `content`, field keys,
  ISO dates, filenames, and synthetic data remain English

#### Scenario: Namespace-safe catalog initialization
- **WHEN** sentence-style typed UI IDs contain period characters
- **THEN** the client provider receives deterministically encoded dot-free keys and initializes without an `INVALID_KEY` console error
- **AND** runtime lookups continue to resolve the original typed IDs in both locales
