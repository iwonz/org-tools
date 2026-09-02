## ADDED Requirements

### Requirement: Birthday entry and validation are completely localized
Both bundled locales SHALL provide matching non-empty copy for Day, Month, Year, Unknown year,
incomplete birthday, invalid complete date, and required `DD.MM.YYYY` format feedback. Calendar
month names and accessibility names SHALL continue to use the active locale.

#### Scenario: Localized birthday form
- **WHEN** a user opens Employee create or edit in English or Russian
- **THEN** all three birthday controls, the unknown-year option, validation, and accessibility copy use the active locale without raw internal text
