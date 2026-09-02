## ADDED Requirements

### Requirement: Structured export is completely localized
Both bundled locales SHALL provide matching non-empty messages for JSON and Template tabs, Unit and
Tag collection controls, nested field names, exclusions, bounded-preview metadata, build progress,
validation, clipboard feedback, and direct State Export errors. Russian SHALL consistently use its
localized Template label; English SHALL consistently label it `Template`.

#### Scenario: Russian structured output
- **WHEN** Russian is active and a user opens Data Download or Editor export
- **THEN** both format selectors use the localized Russian Template label and all owned JSON, exclusion, preview, and error copy is Russian

#### Scenario: English structured output
- **WHEN** English is active and a user opens Data Download or Editor export
- **THEN** both format selectors use `Template` and all owned JSON, exclusion, preview, and error copy is English

## MODIFIED Requirements

### Requirement: Employee transfer is completely localized
Both bundled locales SHALL provide matching non-empty messages for Import tabs, source mapping,
Team options, counts, duplicate policies, per-row actions, validation, progress, confirmation, and
accessibility names. User data and source field paths SHALL remain verbatim.

#### Scenario: Russian Employee Import
- **WHEN** Russian is active and the user opens every Employee Import step
- **THEN** all owned visible and accessibility copy is Russian except allowed technical terms and user data
