## MODIFIED Requirements

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

### Requirement: The canonical Editor View uses destination terminology
The interface SHALL label the canonical Editor View with the existing localized Units destination
term in English and Russian. Related visible copy for copying from the canonical View, Employee
membership, and destructive warnings SHALL use the same localized product term without changing
machine-facing `main` values or user-authored custom View names.

#### Scenario: English canonical View copy
- **WHEN** the Editor and related workflows render in English
- **THEN** the canonical View and related user-facing phrases use `Units` rather than `Main`

#### Scenario: Russian canonical View copy
- **WHEN** the Editor and related workflows render in Russian
- **THEN** the canonical View and related user-facing phrases use the Russian Units destination term rather than the former dedicated Main label

#### Scenario: Machine contracts remain stable
- **WHEN** state is imported, exported, persisted, or synchronized
- **THEN** canonical View kind and field values remain unchanged and only localized display copy differs

## REMOVED Requirements

### Requirement: Protocol failures map to stable localized messages
**Reason**: The only protocol-specific control and merge failures belonged to the removed MCP workflow.
**Migration**: Existing state validation and persistence errors remain covered by the general localization requirements.
