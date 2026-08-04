## MODIFIED Requirements

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
