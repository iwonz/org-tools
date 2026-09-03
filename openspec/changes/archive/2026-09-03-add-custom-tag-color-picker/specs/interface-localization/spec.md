## MODIFIED Requirements

### Requirement: Employee schema and Tag management are completely localized
All six bundled locales SHALL translate model dialogs, field kinds, value types, hashing,
requiredness, option lifecycle, the full-spectrum Tag palette label, custom-color value, named Tag
colors, counts, duplicate review columns, validation, accessible names, and custom filter controls
without raw keys or fallback English in another locale.

#### Scenario: Audit localized Tag color controls
- **WHEN** localization validation opens the Tag catalog and its color dropdown in each supported locale
- **THEN** the full palette, custom color value, No color, named presets, and accessibility names use that locale except the canonical HEX value

#### Scenario: Audit Russian management surfaces
- **WHEN** localization validation opens Employee model, Tags, Employee form, Import review, filters, output settings, and Calendar
- **THEN** every owned visible and accessible string uses the Russian catalog except allowed data and technical names
