## ADDED Requirements

### Requirement: Language choices include bundled representative flags
The Language modal SHALL place a bundled representative flag at the logical start of each English,
Simplified Chinese, Russian, Spanish, French, and Arabic radio row. Flags SHALL be decorative local
SVGs for GB, CN, RU, ES, FR, and SA; language names and autonyms SHALL remain the accessible source
of meaning and SHALL mirror correctly in Arabic RTL without network access.

#### Scenario: Open the Language modal
- **WHEN** the modal renders in an LTR locale
- **THEN** each language row has its flag left of the localized name and autonym

#### Scenario: Render Arabic direction
- **WHEN** the modal renders in Arabic RTL
- **THEN** each flag occupies the mirrored logical start while the radio label remains correctly announced

### Requirement: Refined Tag and mapping workflows are localized
All six bundled catalogs SHALL provide matching non-empty visible, validation, tooltip, empty-state,
and accessibility copy for Tag color/view actions, Tag Employee drill-down, and source-driven
Employee mapping targets. Technical JSON paths and canonical colors SHALL remain verbatim.

#### Scenario: Audit refined workflows
- **WHEN** localization validation opens Tag actions, membership details, and Employee mapping in every locale
- **THEN** owned copy uses the active catalog without fallback keys or unexpected English
