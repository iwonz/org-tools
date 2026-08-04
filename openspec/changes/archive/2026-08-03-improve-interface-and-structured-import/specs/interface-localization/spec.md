## MODIFIED Requirements

### Requirement: The interface supports English and Russian
The application SHALL provide complete English and Russian translations for every runtime label,
status, empty state, dialog, validation error, accessibility name, tooltip, plural, number, and date
while leaving user-authored and imported content unchanged. Russian UI copy SHALL present Unit as
Team with grammatical declension and Live Unit as Dynamic Team while machine contracts remain
English.

#### Scenario: English interface
- **WHEN** the active locale is English
- **THEN** every product surface and surfaced failure is presented in English with Unit terminology

#### Scenario: Russian interface
- **WHEN** the active locale is Russian
- **THEN** every product surface and surfaced failure is presented in Russian with Team terminology

#### Scenario: Localized machine example
- **WHEN** either locale displays an import interface or JSON example
- **THEN** explanatory copy is localized while machine keys and synthetic user data remain English

#### Scenario: Namespace-safe catalog initialization
- **WHEN** sentence-style typed UI IDs contain period characters
- **THEN** the client provider receives deterministically encoded dot-free keys and initializes without an `INVALID_KEY` console error
- **AND** runtime lookups continue to resolve the original typed IDs in both locales

### Requirement: Users can switch locale without routing
The application SHALL provide a Russian/English selector with decorative Russian and United Kingdom
flag glyphs immediately before the theme selector and apply a selection without navigation, reload,
middleware, locale URL segments, or remote catalog requests.

#### Scenario: Runtime switch
- **WHEN** the user selects the other language
- **THEN** the open interface, accessibility names, document language, metadata, flag, and localized reference content update in place and the new choice remains active after reload

#### Scenario: Accessible flag presentation
- **WHEN** assistive technology reads the language selector
- **THEN** the accessible name identifies the language without treating the decorative flag as content
