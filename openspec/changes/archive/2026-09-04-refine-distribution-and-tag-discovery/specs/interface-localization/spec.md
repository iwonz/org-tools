## MODIFIED Requirements

### Requirement: Distribution mode is localized in every bundled locale
The distribution workflow MUST have complete catalog entries in every bundled locale. This includes
the context action, checked and mixed bulk states, source-only status, distributed status,
multi-Unit row action, placement-map controls, locate actions, other-Unit counts, and accessibility
labels in English, Simplified Chinese, Russian, Spanish, French, and Modern Standard Arabic.

#### Scenario: Use distribution mode in any locale
- **WHEN** the workflow, bulk action, or placement map opens in any supported locale
- **THEN** visible and accessible copy uses that catalog without fallback keys or unexpected English

#### Scenario: Use distribution mode in Arabic
- **WHEN** the active locale is Arabic
- **THEN** menus and modal controls follow RTL direction while map and Editor coordinates retain LTR geometry

### Requirement: Tag-filter bulk actions are localized
Tag search, search empty states, Select all, and Deselect all in Employee Tag filters SHALL have
complete visible and accessible copy in English, Simplified Chinese, Russian, Spanish, French, and
Modern Standard Arabic. RTL layout SHALL keep each thematic icon at the logical start of its label.

#### Scenario: Open Tag filters in any locale
- **WHEN** a user expands and searches the Tag filter section in any supported locale
- **THEN** search and both bulk actions use that locale without fallback keys or unexpected English

#### Scenario: Open Tag filters in Arabic
- **WHEN** the Arabic interface renders Tag search and bulk actions
- **THEN** controls follow the mirrored logical direction without changing geometry
