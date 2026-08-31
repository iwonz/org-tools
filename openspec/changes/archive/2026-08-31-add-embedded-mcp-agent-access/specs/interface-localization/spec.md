## MODIFIED Requirements

### Requirement: The interface supports English and Russian
The application SHALL provide complete English and Russian translations for every runtime label,
status, empty state, dialog, validation and persistence error, accessibility name, tooltip, plural,
number, tag date, state replacement summary, destructive warning, calendar date, MCP consent,
credential control, client setup instruction, activity summary, and state-merge choice while leaving
user-authored content unchanged. Product copy SHALL use neutral Import, Export, and state language
and SHALL NOT expose project, workspace, working-area, Save, or Autosave terminology. Russian UI
copy SHALL present Unit as Team with grammatical declension and Live Unit as Dynamic Team while
machine contracts and supported client product names remain English.

#### Scenario: English runtime surfaces
- **WHEN** the active locale is English
- **THEN** every visible, error, menu, dialog, tooltip, accessibility, MCP, and merge surface is English except user-authored data and explicitly allowed format or client tokens

#### Scenario: Russian runtime surfaces
- **WHEN** the active locale is Russian
- **THEN** the same surfaces are Russian without an untranslated English fallback or key identifier

#### Scenario: Namespace-safe catalog initialization
- **WHEN** sentence-style typed UI IDs contain period characters
- **THEN** provider initialization and runtime lookup succeed in both locales without an invalid-key console error

## ADDED Requirements

### Requirement: Protocol failures map to stable localized messages
MCP control and concurrent-state errors SHALL expose stable machine codes that map through the
bundled catalog. Raw exceptions, database paths, token fragments, protocol request bodies, and
internal error messages MUST NOT render in the interface.

#### Scenario: MCP authorization or persistence error
- **WHEN** a control request fails with a stable server code
- **THEN** the modal renders the matching localized recovery copy without raw internal content

#### Scenario: Merge conflict localization audit
- **WHEN** browser validation opens the same-field conflict in English and Russian
- **THEN** Keep local, Use MCP, Cancel, affected-field summary, and accessibility names use the active catalog
