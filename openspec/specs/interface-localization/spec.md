# interface-localization Specification

## Purpose
Define complete six-language runtime localization, bounded bootstrap metadata, in-place locale
switching, and Arabic right-to-left behavior.
## Requirements
### Requirement: The interface supports all six official UN languages
The application SHALL provide complete English, Simplified Chinese, Russian, Spanish, French, and
Modern Standard Arabic translations for every runtime label, status, empty state, dialog,
validation and persistence error, accessibility name, tooltip, plural, number, date, destructive
warning, and Calendar surface while leaving user-authored content unchanged. Product copy SHALL use
neutral Import, Export, and state language and SHALL NOT expose project, workspace, working-area,
Save, Autosave, or agent-access terminology. Russian UI copy SHALL present Unit as Team with
grammatical declension and Live Unit as Dynamic Team while machine contracts and supported public
format tokens remain English.

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
- **THEN** that locale overrides bootstrap metadata and updates the rendered interface

#### Scenario: Unavailable local storage
- **WHEN** reading or writing the locale preference throws
- **THEN** the active in-memory state locale and application remain usable

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
  tabs update in place, the modal closes, and focus returns safely

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

### Requirement: Employee transfer is completely localized
All six bundled locales SHALL provide matching non-empty messages for Import tabs, source mapping,
Team options, counts, duplicate policies, per-row actions, validation, progress, confirmation, and
accessibility names. User data and source field paths SHALL remain verbatim.

#### Scenario: Russian Employee Import
- **WHEN** Russian is active and the user opens every Employee Import step
- **THEN** all owned visible and accessibility copy is Russian except allowed technical terms and user data

### Requirement: Structured export is completely localized
All six bundled locales SHALL provide matching non-empty messages for JSON and Template tabs, Unit and
Tag collection controls, the unified sortable field list, drag handles, nested field names,
exclusions, bounded-preview metadata, build progress, validation, clipboard feedback, direct State
Export errors, Editor scope icons, image alignment accessibility names, and the default boss label.
Russian SHALL consistently use its localized Template label and localized manager boss default;
English SHALL consistently label them `Template` and `Manager`.

Editor export SHALL omit redundant Preview labels and the removed expanded-image Open action while
retaining localized accessible names for controls that render only an icon.

#### Scenario: Russian structured output
- **WHEN** Russian is active and a user opens Data Download or Editor export
- **THEN** both format selectors, field-order controls, scope and alignment controls, and image boss default use localized Russian copy without obsolete Preview or Open product labels

#### Scenario: English structured output
- **WHEN** English is active and a user opens Data Download or Editor export
- **THEN** both format selectors use `Template`, the image boss default uses `Manager`, and every remaining owned export control is English

#### Scenario: Accessible sortable and icon-only controls
- **WHEN** assistive technology reads a drag handle, scope action, or title-alignment action
- **THEN** its localized name describes the field move, scope, or alignment without relying on the visible icon

### Requirement: Birthday entry and validation are completely localized
All six bundled locales SHALL provide matching non-empty copy for Day, Month, Year, Unknown year,
incomplete birthday, invalid complete date, and required `DD.MM.YYYY` format feedback. Calendar
month names and accessibility names SHALL continue to use the active locale.

#### Scenario: Localized birthday form
- **WHEN** a user opens Employee create or edit in English or Russian
- **THEN** all three birthday controls, the unknown-year option, validation, and accessibility copy use the active locale without raw internal text

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
- **WHEN** localization validation opens Employee model, Tags, Tag editing, Employee form, Import review, filters,
  output settings, and Calendar
- **THEN** every owned visible and accessible string uses the Russian catalog except allowed data and technical names

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
