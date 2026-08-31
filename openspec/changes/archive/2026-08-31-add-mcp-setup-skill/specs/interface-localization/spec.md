## MODIFIED Requirements

### Requirement: The interface supports English and Russian
The application SHALL provide complete English and Russian translations for every runtime label,
status, empty state, dialog, validation and persistence error, accessibility name, tooltip, plural,
number, tag date, state replacement summary, destructive warning, calendar date, MCP consent,
credential control, setup-prompt control, activity summary, and state-merge choice while leaving
user-authored content unchanged. Product copy SHALL use neutral Import, Export, and state language
and SHALL NOT expose project, workspace, working-area, Save, or Autosave terminology. Russian UI
copy SHALL present Unit as Team with grammatical declension and Live Unit as Dynamic Team while
machine contracts, the English agent setup prompt, configuration syntax, and supported client
product names remain English.

#### Scenario: English runtime surfaces
- **WHEN** the active locale is English
- **THEN** every visible, error, menu, dialog, tooltip, accessibility, MCP, and merge surface is English except user-authored data and explicitly allowed machine or client tokens

#### Scenario: Russian runtime surfaces
- **WHEN** the active locale is Russian
- **THEN** the same product surfaces are Russian without an untranslated key while the preformatted agent prompt and machine configuration remain intentionally English

#### Scenario: Namespace-safe catalog initialization
- **WHEN** sentence-style typed UI IDs contain period characters
- **THEN** provider initialization and runtime lookup succeed in both locales without an invalid-key console error

#### Scenario: Hidden MCP description
- **WHEN** the visible MCP title has no subtitle in either locale
- **THEN** assistive technology receives the localized MCP management description from the message catalog
