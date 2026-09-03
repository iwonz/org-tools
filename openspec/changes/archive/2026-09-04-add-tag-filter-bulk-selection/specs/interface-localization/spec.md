## ADDED Requirements

### Requirement: Tag-filter bulk actions are localized
Select all and Deselect all in Employee Tag filters SHALL have complete visible and accessible copy
in English, Simplified Chinese, Russian, Spanish, French, and Modern Standard Arabic. RTL layout
SHALL keep each thematic icon at the logical start of its label.

#### Scenario: Open Tag filters in any locale
- **WHEN** a user expands the Tag filter section in any supported locale
- **THEN** both bulk actions use that locale without fallback keys or unexpected English

#### Scenario: Open Tag filters in Arabic
- **WHEN** the Arabic interface renders the bulk actions
- **THEN** their icon-label order follows the mirrored logical direction without changing geometry
