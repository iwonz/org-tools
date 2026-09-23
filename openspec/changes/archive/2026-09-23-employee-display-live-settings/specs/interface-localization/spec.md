## MODIFIED Requirements

### Requirement: Employee schema and Tag management are completely localized
All six bundled locales SHALL translate model dialogs, Employee and Unit-context field-group
headings, display-only token help, line-spacing number controls, per-format Reset actions, field
kinds, value types, hashing, requiredness, option lifecycle, the Tag edit dialog, full-spectrum
palette label, exact color input types and validation, custom-color value, named Tag colors, counts,
duplicate review columns, validation, accessible names, and custom filter controls without raw keys
or fallback English in another locale. Standard HTML color keywords, canonical color values,
template tokens, and numeric pixel values SHALL remain technical input.

The obsolete image-export boss-label field and its validation copy MUST be absent from every
catalog. New blank State MUST embed each creation locale's existing Manager translation in the
default `isBoss` ternary without later locale-driven rewriting.

#### Scenario: Audit localized Tag color controls
- **WHEN** localization validation opens Tag editing and its color dropdown in each supported locale
- **THEN** the edit dialog, full palette, exact input types, validation, custom color value, No color, named presets, and accessibility names use that locale except technical color values

#### Scenario: Audit Employee display controls
- **WHEN** localization validation opens Employee Model and Display in each supported locale
- **THEN** both field groups, display-only marker, every line-gap number input, and every Reset action use that catalog while technical tokens and pixel numbers remain unchanged

#### Scenario: Create localized boss defaults
- **WHEN** blank State is created in each supported locale
- **THEN** its Editor-export ternary contains that catalog's Manager translation and no boss-label control appears in either image dialog

#### Scenario: Audit Russian management surfaces
- **WHEN** localization validation opens Employee model, Tags, Tag editing, Employee form, Import review, filters, output settings, and Calendar
- **THEN** every owned visible and accessible string uses the Russian catalog except allowed data and technical names

### Requirement: Employee display settings are localized
The system SHALL provide Employee model tabs, four display-section labels, preview copy, line-gap
labels, per-format Reset actions, Markdown selection actions, link editor fields and actions,
validation feedback, and related accessible names in all six bundled locale catalogs with identical
placeholders and no obsolete keys.

#### Scenario: Open Display in every locale
- **WHEN** the user opens Employee model, selects Display, edits Markdown, changes a gap, or resets a format in any supported locale
- **THEN** every visible label, validation message, tooltip, and accessible name uses that locale catalog
