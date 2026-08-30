## ADDED Requirements

### Requirement: Browser validation fails on unexpected runtime diagnostics
Development and production browser validation SHALL monitor every owned page for console errors and warnings, uncaught page errors, hydration diagnostics, failed application requests, and failing same-origin resource responses. React, Next.js, MobX, localization, accessibility, and application diagnostics MUST NOT be suppressed or allowlisted. Any exception for browser-generated noise MUST be narrow, documented beside its matcher, and include no organization data.

#### Scenario: Development React diagnostic
- **WHEN** the development probe renders and interacts with the application while React development diagnostics are enabled
- **THEN** a render-phase update, hydration mismatch, uncaught error, or unexpected console warning fails the probe with its source and message

#### Scenario: Complete production workflow audit
- **WHEN** the maintained server and Pages browser catalogs exercise Import, Export, theme, language, Teams, Employees, Editor, Analytics, Calendar, Data Download, menus, dialogs, and representative mutations
- **THEN** every page finishes without an unexpected console error or warning, page error, failed application request, or failing same-origin resource response

#### Scenario: Actionable failure report
- **WHEN** an unexpected browser diagnostic occurs
- **THEN** validation reports the runtime, scenario, diagnostic category, URL when available, and message without transmitting the diagnostic or synthetic state outside the local test process
