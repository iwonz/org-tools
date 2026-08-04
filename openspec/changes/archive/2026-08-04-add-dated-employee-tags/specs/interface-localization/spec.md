## MODIFIED Requirements

### Requirement: The interface supports English and Russian
The application SHALL provide complete English and Russian translations for every runtime label, status, empty state, dialog, validation error, accessibility name, tooltip, plural, number, tag date, and calendar date while leaving user-authored and imported content unchanged. Russian UI copy SHALL present Unit as Team with grammatical declension and Live Unit as Dynamic Team while machine contracts remain English.

#### Scenario: English interface
- **WHEN** the active locale is English
- **THEN** dated-tag editors, calendar cloud, day details, event dialogs, errors, counts, and date formats are English

#### Scenario: Russian interface
- **WHEN** the active locale is Russian
- **THEN** dated-tag editors, calendar cloud, day details, event dialogs, errors, counts, and date formats are Russian

#### Scenario: Localized machine example
- **WHEN** either locale displays a version 3 import interface or JSON example
- **THEN** explanatory copy is localized while machine keys, ISO dates, and synthetic user data remain English

#### Scenario: Namespace-safe catalog initialization
- **WHEN** sentence-style typed UI IDs contain period characters
- **THEN** the client provider receives deterministically encoded dot-free keys and initializes without an `INVALID_KEY` console error
- **AND** runtime lookups continue to resolve the original typed IDs in both locales

### Requirement: Locale is independent of workspace state
The application SHALL keep locale outside every `OrgToolsState` version and SHALL NOT translate persisted tag labels, organization content, export keys, machine values, ISO dates, or filenames.

#### Scenario: Open a workspace in Russian
- **WHEN** a Russian-interface user opens an English-authored workspace containing dated tags
- **THEN** the interface and displayed date formatting remain Russian while tag labels and serialized contracts remain unchanged
