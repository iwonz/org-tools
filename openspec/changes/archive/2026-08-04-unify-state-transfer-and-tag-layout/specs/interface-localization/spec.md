## MODIFIED Requirements

### Requirement: The interface supports English and Russian
The application SHALL provide complete English and Russian translations for every runtime label,
status, empty state, dialog, validation error, accessibility name, tooltip, plural, number, tag date,
state projection, import operation, mapping target, destructive warning, and calendar date while
leaving user-authored and imported content unchanged. Russian UI copy SHALL present Unit as Team with
grammatical declension and Live Unit as Dynamic Team while machine contracts remain English.

#### Scenario: English transfer interface
- **WHEN** the active locale is English
- **THEN** state choices, append and replace operations, generic mapping, tag calendar actions, errors, counts, and dates are English

#### Scenario: Russian transfer interface
- **WHEN** the active locale is Russian
- **THEN** state choices, append and replace operations, generic mapping, tag calendar actions, errors, counts, and dates are Russian

#### Scenario: Localized state machine content
- **WHEN** either locale saves or maps JSON
- **THEN** explanatory copy is localized while `kind`, `content`, field keys, ISO dates, filenames, and synthetic data remain English

#### Scenario: Namespace-safe catalog initialization
- **WHEN** sentence-style typed UI IDs contain period characters
- **THEN** the client provider receives deterministically encoded dot-free keys and initializes without an `INVALID_KEY` console error
- **AND** runtime lookups continue to resolve the original typed IDs in both locales

### Requirement: Locale is independent of workspace state
The application SHALL keep locale outside `OrgToolsState` and SHALL NOT translate persisted tag
labels, organization content, export keys, state discriminators, machine values, ISO dates, or
filenames.

#### Scenario: Open a workspace in Russian
- **WHEN** a Russian-interface user opens an English-authored workspace containing dated tags
- **THEN** the interface and displayed date formatting remain Russian while tag labels and serialized contracts remain unchanged

#### Scenario: Obsolete contract error
- **WHEN** a selected state contains obsolete version fields or an invalid content payload
- **THEN** the localized error describes an unsupported current state without offering generic mapping fallback
