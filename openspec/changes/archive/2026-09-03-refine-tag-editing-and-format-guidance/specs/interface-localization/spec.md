## MODIFIED Requirements

### Requirement: Refined core workflows are completely localized
All six bundled locales SHALL provide matching non-empty visible and accessibility copy for database
recreation and confirmation, Template token descriptions and suggestions, the token-aware Format
help icon and placeholder, representative Employee Import preview metadata, source-to-target
mapping, Calendar event groups, segmented Gender, compound Birthday, draft Tag selection, and
generic Unit form validation. Stable server recovery codes MUST resolve through the catalog and raw
filesystem or parser messages MUST NOT be rendered.

#### Scenario: Recover in Russian
- **WHEN** the Russian runtime shows either blocking database error and opens Create new confirmation
- **THEN** every warning, action, accessible name, and failure message is Russian without exposing a filesystem error

#### Scenario: Use refined workflows in English
- **WHEN** the English runtime opens token suggestions, Format guidance, Employee Import, a populated Calendar day, and the Employee form
- **THEN** all owned labels, descriptions, options, errors, and accessibility names are English

#### Scenario: Preserve machine and user values
- **WHEN** any locale displays `{token}`, a JSON source path, filename, Tag, Unit, or Employee data
- **THEN** the machine token and user-authored value remain verbatim while surrounding product copy is localized

### Requirement: Employee schema and Tag management are completely localized
All six bundled locales SHALL translate model dialogs, field kinds, value types, hashing,
requiredness, option lifecycle, the Tag edit dialog, full-spectrum palette label, exact color input
types and validation, custom-color value, named Tag colors, counts, duplicate review columns,
validation, accessible names, and custom filter controls without raw keys or fallback English in
another locale. Standard HTML color keywords and canonical color values SHALL remain technical input.

#### Scenario: Audit localized Tag color controls
- **WHEN** localization validation opens Tag editing and its color dropdown in each supported locale
- **THEN** the edit dialog, full palette, exact input types, validation, custom color value, No color, named presets, and accessibility names use that locale except technical color values

#### Scenario: Audit Russian management surfaces
- **WHEN** localization validation opens Employee model, Tags, Tag editing, Employee form, Import review, filters, output settings, and Calendar
- **THEN** every owned visible and accessible string uses the Russian catalog except allowed data and technical names
