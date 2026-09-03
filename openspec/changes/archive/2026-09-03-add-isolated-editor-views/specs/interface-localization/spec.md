## ADDED Requirements

### Requirement: View management is localized in every supported language
The interface SHALL provide complete catalog entries for system View naming, View selection,
Blank/Copy creation, source selection, rename, deletion, validation, confirmation, Tag footer
accessibility, and Download source feedback in `en`, `zh`, `ru`, `es`, `fr`, and `ar`. The system
View SHALL display the locale's existing Units destination name, including its localized Russian
equivalent.

#### Scenario: Manage Views in six locales
- **WHEN** localization validation opens every View control and dialog in each supported locale
- **THEN** visible copy, tooltips, errors, and accessibility names contain no missing key or fallback text

#### Scenario: Use Views in Arabic
- **WHEN** the Arabic interface selects, creates, or deletes a View
- **THEN** controls follow RTL logical placement while the Editor coordinate layer remains LTR
