## ADDED Requirements

### Requirement: The interface supports English and Russian
The application SHALL provide complete English and Russian translations for every runtime label,
status, empty state, dialog, validation error, accessibility name, tooltip, plural, number, and date
while leaving user-authored and imported content unchanged.

#### Scenario: English interface
- **WHEN** the active locale is English
- **THEN** every product surface and surfaced failure is presented in English

#### Scenario: Russian interface
- **WHEN** the active locale is Russian
- **THEN** every product surface and surfaced failure is presented in Russian

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
The application SHALL provide a Russian/English selector immediately before the theme selector and
apply a selection without navigation, reload, middleware, locale URL segments, or remote catalog
requests.

#### Scenario: Runtime switch
- **WHEN** the user selects the other language
- **THEN** the open interface, accessibility names, document language, and metadata update in place
  and the new choice remains active after reload

### Requirement: Locale is independent of workspace state
The application SHALL keep locale outside `OrgToolsStateV1` and SHALL NOT translate persisted
organization content, export keys, machine values, or filenames.

#### Scenario: Open a workspace in Russian
- **WHEN** a Russian-interface user opens an English-authored workspace
- **THEN** the interface remains Russian while workspace content and serialized contracts remain
  unchanged
