# interface-localization Specification

## Purpose
Define complete English/Russian runtime localization, bounded bootstrap metadata, and in-place locale switching.
## Requirements
### Requirement: The interface supports English and Russian
The application SHALL provide complete English and Russian translations for every runtime label,
status, empty state, dialog, validation and persistence error, accessibility name, tooltip, plural,
number, tag date, state replacement summary, destructive warning, and calendar date while leaving
user-authored content unchanged. Product copy SHALL use neutral Import, Export, and state language
and SHALL NOT expose project, workspace, working-area, Save, Autosave, or agent-access terminology.
Russian UI copy SHALL present Unit as Team with grammatical declension and Live Unit as Dynamic Team
while machine contracts and supported public format tokens remain English.

#### Scenario: English runtime surfaces
- **WHEN** the active locale is English
- **THEN** every visible, error, menu, dialog, tooltip, and accessibility surface is English except user-authored data and explicitly allowed machine tokens

#### Scenario: Russian runtime surfaces
- **WHEN** the active locale is Russian
- **THEN** the same product surfaces are Russian without an untranslated key while machine tokens remain intentionally English

#### Scenario: Namespace-safe catalog initialization
- **WHEN** sentence-style typed UI IDs contain period characters
- **THEN** provider initialization and runtime lookup succeed in both locales without an invalid-key console error

### Requirement: Locale is detected and persisted locally
The application SHALL use a valid saved `en` or `ru` bootstrap preference, otherwise select the
first supported browser language and fall back to English. It SHALL persist only that bounded
bootstrap preference on a best-effort basis, then treat the current validated state as authoritative
and synchronize locale with the other durable UI context.

#### Scenario: First Russian browser load
- **WHEN** no valid state or preference exists and browser languages include Russian
- **THEN** the blank state starts in Russian and the bounded preference is saved locally

#### Scenario: Loaded state locale
- **WHEN** SQLite, Import, or a live peer supplies a valid state locale
- **THEN** that locale overrides bootstrap metadata and updates the rendered interface

#### Scenario: Unavailable local storage
- **WHEN** reading or writing the locale preference throws
- **THEN** the active in-memory state locale and application remain usable

### Requirement: Users can switch locale without routing
The application SHALL provide a Russian/English selector immediately before theme with only the
decorative active flag in its trigger and flag, localized language name, and selected indicator in
each option. Selection SHALL update the current durable state and live tabs without navigation,
reload, middleware, locale URL segments, or remote catalog requests.

#### Scenario: Runtime switch
- **WHEN** the user selects the other language
- **THEN** open copy, accessibility names, document metadata, state, bootstrap preference, flag, and
  live tabs update in place

#### Scenario: Compact closed trigger
- **WHEN** the language selector is closed
- **THEN** its square trigger shows only the active Russian or United Kingdom flag

#### Scenario: Complete language menu
- **WHEN** the language selector is open
- **THEN** both options show their localized language name and the active option shows its indicator

#### Scenario: Accessible flag presentation
- **WHEN** assistive technology reads the selector
- **THEN** the accessible name identifies the active language without treating the flag as content

### Requirement: Localization completeness is automatically enforced
Catalog validation SHALL require identical non-empty keys and placeholder sets. Static checks SHALL
reject uncatalogued user-facing literals and unexpected English fallbacks in the Russian interface,
except an explicit allowlist for Org Tools, JSON, CSV, English, filenames, and user-authored data.
Runtime error codes SHALL map to catalog entries and raw internal messages MUST NOT be rendered.

#### Scenario: Catalog mismatch
- **WHEN** a locale omits a key, placeholder, or non-empty translation
- **THEN** repository validation fails before build publication

#### Scenario: Runtime localization audit
- **WHEN** browser tests switch locale and open menus, dialogs, empty states, and error states
- **THEN** no untranslated key, raw internal error, or unexpected foreign-language product copy is
  visible or announced

### Requirement: Employee transfer is completely localized
Both bundled locales SHALL provide matching non-empty messages for transfer tabs, source mapping,
Team options, counts, duplicate policies, per-row actions, validation, progress, confirmation, and
accessibility names. User data and source field paths SHALL remain verbatim.

#### Scenario: Russian Employee Import
- **WHEN** Russian is active and the user opens every Employee Import step
- **THEN** all owned visible and accessibility copy is Russian except allowed technical terms and user data

#### Scenario: English Employee Export
- **WHEN** English is active and the user opens Employee Export
- **THEN** all owned visible and accessibility copy is English
