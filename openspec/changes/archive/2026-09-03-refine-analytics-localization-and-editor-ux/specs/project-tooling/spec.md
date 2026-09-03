## MODIFIED Requirements

### Requirement: Documentation and gallery cover current product surfaces
The repository SHALL document both local-only runtimes, six bundled locales, Arabic RTL, Analytics
age/year insights, modal Language and Theme settings, selected-only Editor arrangement, direct State
Export, Import, structured output, privacy, performance, and screenshots without obsolete guidance.
The deterministic gallery SHALL contain exactly 46 PNGs and the README SHALL retain exactly ten
featured Import, Export, Theme, Language, Units, Employees, Editor, Analytics, Calendar, and Download
frames.

#### Scenario: Complete gallery
- **WHEN** screenshot generation runs against production runtimes
- **THEN** it replaces exactly 46 declared PNGs covering only current workflows

#### Scenario: Locale gallery
- **WHEN** Language frames are generated
- **THEN** the primary frame shows the six-language modal and the supporting frame demonstrates Arabic RTL

#### Scenario: Updated workflow gallery
- **WHEN** Analytics, Editor, Units, Calendar, Theme, and Language frames are generated
- **THEN** they show the new metrics, controls, equal panes, localized date, and modal selectors

#### Scenario: Featured README
- **WHEN** a visitor opens README
- **THEN** the same ten current product previews remain featured and every PNG exists

#### Scenario: Deterministic generation
- **WHEN** the 46-frame gallery is generated twice from unchanged source and fixed fixtures
- **THEN** every hash is identical and no owned page has a console or network diagnostic

## ADDED Requirements

### Requirement: Localization validation covers every supported catalog
Automated checks SHALL validate exact keys, placeholders, non-empty translations, allowed technical
tokens, browser detection, writing direction, and representative visible and accessibility surfaces
for `en`, `zh`, `ru`, `es`, `fr`, and `ar` in both production runtimes.

#### Scenario: Validate six catalogs
- **WHEN** repository and browser validation runs
- **THEN** every supported locale passes static parity and runtime surface checks without fallback copy

#### Scenario: Validate large localized data
- **WHEN** Analytics and Editor exercise 20,000 Employees and 4,000 Units
- **THEN** locale-only UI changes do not serialize organization state or trigger per-frame full scans
