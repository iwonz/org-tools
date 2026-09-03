## MODIFIED Requirements

### Requirement: The interface supports English and Russian
The application SHALL provide complete English, Simplified Chinese, Russian, Spanish, French, and
Modern Standard Arabic translations for every runtime label, status, empty state, dialog,
validation and persistence error, accessibility name, tooltip, plural, number, date, destructive
warning, and Calendar surface while leaving user-authored content unchanged. Product copy SHALL use
neutral Import, Export, and state language. Russian UI copy SHALL present Unit as Team with
grammatical declension while machine contracts and public format tokens remain English.

#### Scenario: Render each supported locale
- **WHEN** the active locale is `en`, `zh`, `ru`, `es`, `fr`, or `ar`
- **THEN** every owned visible and accessibility surface uses that catalog except user-authored data
  and explicitly allowed machine tokens

#### Scenario: Render Arabic
- **WHEN** Arabic is active
- **THEN** document language and direction are `ar` and `rtl`, shell and task UI mirror, and Editor
  world coordinates remain stable

#### Scenario: Namespace-safe catalog initialization
- **WHEN** sentence-style typed UI IDs contain period characters
- **THEN** provider initialization and runtime lookup succeed in every locale without a console error

### Requirement: Locale is detected and persisted locally
The application SHALL use a valid saved six-locale bootstrap preference, otherwise select the first
supported browser language and fall back to English. Browser detection SHALL initialize only a new
state; an existing SQLite state, imported state, live-peer state, or explicit saved choice SHALL be
authoritative. Only that bounded locale metadata MAY persist outside organization state.

#### Scenario: First supported browser load
- **WHEN** no valid state or preference exists and browser languages contain a supported language
- **THEN** the blank state starts in the first supported language and stores the bounded preference

#### Scenario: Unsupported browser locale
- **WHEN** no valid preference exists and browser languages contain no supported language
- **THEN** the blank state starts in English

#### Scenario: Loaded state locale
- **WHEN** SQLite, Import, or a live peer supplies a valid state locale
- **THEN** that locale overrides browser bootstrap metadata and updates the document

#### Scenario: Unavailable local storage
- **WHEN** reading or writing locale metadata throws
- **THEN** the active in-memory locale and application remain usable

### Requirement: Users can switch locale without routing
The application SHALL provide a language sidebar action immediately before theme that opens a
compact modal with all six choices. Each row SHALL show a localized language name and its autonym
with native-radio semantics and a selected indicator. Selection SHALL update state, metadata,
direction, and live tabs immediately, close the modal, and require no route, reload, or network
request.

#### Scenario: Open language settings
- **WHEN** a user activates Language in compact or expanded sidebar mode
- **THEN** focus moves into a localized modal containing all six language choices

#### Scenario: Runtime switch
- **WHEN** a user chooses another language
- **THEN** open copy, accessibility names, document metadata, direction, state, preference, and live
  tabs update in place and focus returns safely

### Requirement: Localization completeness is automatically enforced
Catalog validation SHALL require identical non-empty keys and placeholder sets across all six
catalogs. Static checks SHALL reject uncatalogued user-facing literals and fallback-to-key values in
non-English catalogs except an explicit allowlist for product names, machine tokens, filenames, and
user-authored data. Runtime error codes SHALL map to catalog entries and raw messages MUST NOT render.

#### Scenario: Catalog mismatch
- **WHEN** any locale omits a key, placeholder, or non-empty translation
- **THEN** repository validation fails before build publication

#### Scenario: Runtime localization audit
- **WHEN** browser tests select each locale and open representative menus, dialogs, empty states,
  errors, and accessibility surfaces
- **THEN** no untranslated key, raw internal error, or unexpected fallback product copy is visible

### Requirement: Calendar navigation and weekdays are localized
Calendar SHALL format weekday headings, Today, month navigation, Tag assignment counts, and dialog
dates through the active locale while retaining locale-specific week order. Russian navigation
SHALL use the reviewed backward/forward labels, and a Russian day-dialog title MUST NOT append the
abbreviated year suffix.

#### Scenario: Switch Calendar locale
- **WHEN** Calendar changes among supported locales
- **THEN** weekday order, labels, controls, counts, dialogs, direction, and names update in place

#### Scenario: Open a Russian date
- **WHEN** a Russian user opens a Calendar day dialog
- **THEN** the localized date contains the bare year without an abbreviated year suffix
