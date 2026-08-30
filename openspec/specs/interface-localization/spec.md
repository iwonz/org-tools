# interface-localization Specification

## Purpose
Define supported interface locales, local preference resolution, runtime switching, and locale-independent workspace data.
## Requirements
### Requirement: The interface supports English and Russian
The application SHALL provide complete English and Russian translations for every runtime label,
status, empty state, dialog, validation error, accessibility name, tooltip, plural, number, tag date,
workspace replacement summary, destructive warning, and calendar date while leaving user-authored
and imported content unchanged. Russian UI copy SHALL present Unit as Team with grammatical
declension and Live Unit as Dynamic Team while machine contracts remain English.

#### Scenario: English transfer interface
- **WHEN** the active locale is English
- **THEN** workspace filename, size, counts, replacement warning, errors, and transient Save states
  are English

#### Scenario: Russian transfer interface
- **WHEN** the active locale is Russian
- **THEN** workspace filename, size, counts, replacement warning, errors, and transient Save states
  are Russian

#### Scenario: Localized state machine content
- **WHEN** either locale imports or exports a workspace
- **THEN** explanatory copy is localized while `kind`, `content`, field keys, ISO dates, filenames,
  and synthetic data remain English

#### Scenario: Namespace-safe catalog initialization
- **WHEN** sentence-style typed UI IDs contain period characters
- **THEN** the client provider receives deterministically encoded dot-free keys and initializes without an `INVALID_KEY` console error
- **AND** runtime lookups continue to resolve the original typed IDs in both locales

### Requirement: Locale is detected and persisted locally
The application SHALL use a valid saved `en` or `ru` preference, otherwise select the first
supported browser language and fall back to English, then persist only that locale preference on a
best-effort basis.

#### Scenario: First Russian browser load
- **WHEN** no valid locale preference exists and the browser languages include Russian
- **THEN** the first rendered interface is Russian and `ru` is saved locally

#### Scenario: Unsupported browser language
- **WHEN** no valid locale preference exists and no browser language is supported
- **THEN** the first rendered interface is English and `en` is saved locally

#### Scenario: Unavailable local storage
- **WHEN** reading or writing the locale preference throws an error
- **THEN** the detected locale remains active in memory and the application remains usable

### Requirement: Users can switch locale without routing
The application SHALL provide a Russian/English selector immediately before the theme selector with
only the decorative active flag in its closed trigger and flag, localized language name, and
selected indicator in each menu option. It SHALL apply a selection without navigation, reload,
middleware, locale URL segments, or remote catalog requests.

#### Scenario: Runtime switch
- **WHEN** the user selects the other language
- **THEN** the open interface, accessibility names, document language, metadata, flag, and localized reference content update in place and the new choice remains active after reload

#### Scenario: Compact closed trigger
- **WHEN** the language selector is closed
- **THEN** its square trigger shows only the active Russian or United Kingdom flag and no visible language name

#### Scenario: Complete language menu
- **WHEN** the language selector is open
- **THEN** both options show their flag and language name and the active option shows its selected indicator

#### Scenario: Accessible flag presentation
- **WHEN** assistive technology reads the language selector
- **THEN** the accessible name identifies the active language without treating the decorative flag as content

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
