## MODIFIED Requirements

### Requirement: Documentation and automation are publication-ready
The repository SHALL document stable UUID Employee identity, normalized duplicate detection,
State/Employees transfer, the system and isolated custom Editor Views, local runtimes, privacy, and
scale behavior. It SHALL include an
English README with exactly nine deterministic featured screenshot previews, a comprehensive grouped
screenshot catalog, contributor and security guidance, license, tests, specifications, detailed
documentation, CI, and generated PNGs. Non-English product copy SHALL live only in its corresponding
locale catalog; source, comments, fixtures, tests, specifications, and documentation SHALL remain
English. The public state contract SHALL be unversioned, current-only,
complete, and validated without discriminators, partial scopes, legacy migration, project metadata,
or compatibility readers. Employee mapping is supported only by the explicit Employee transfer mode.

#### Scenario: README visual showcase
- **WHEN** a visitor opens README
- **THEN** exactly one full-size Import, Export, theme, language, Teams, Employees, Editor, Calendar, and Download preview is linked locally

#### Scenario: Complete visual capability catalog
- **WHEN** a visitor opens the detailed screenshot guide
- **THEN** the 56-frame gallery contains nine featured workflows and only currently visible supporting
  behavior, without project, file, Save, autosave, or obsolete conflict frames

#### Scenario: Continuous validation
- **WHEN** CI runs on a clean checkout
- **THEN** locale completeness, singleton repository/API, tab synchronization, automatic writes,
  frame-coalesced Editor interaction, complete state transfer, both builds, browser suites,
  screenshots, OpenSpec, and public-safety checks pass against isolated synthetic state

#### Scenario: Current-schema policy
- **WHEN** the state and Employee transfer contracts change
- **THEN** old View shapes, digest Employee IDs, inline Tags, obsolete custom/output state, fixtures,
  docs, and tests are removed together

#### Scenario: Large transfer validation
- **WHEN** performance coverage maps and reviews 20,000 Employees
- **THEN** it verifies linear derivation, sparse overrides, virtualized rows, and one atomic Apply

#### Scenario: Screenshot generation
- **WHEN** screenshot generation runs against both production runtimes
- **THEN** it deterministically replaces exactly 56 declared PNGs, including nine featured frames

#### Scenario: Screenshot manifest consistency
- **WHEN** generation or publication checks inspect the gallery
- **THEN** identifiers and filenames are unique, featured and guide links match the manifest, and
  removed persistence images are absent

#### Scenario: Publication language scan
- **WHEN** public-safety checks scan tracked source and production output
- **THEN** non-English product copy outside its corresponding locale catalog fails validation

#### Scenario: Large Editor interaction validation
- **WHEN** automated performance coverage prepares 20,000 Employees and 4,000 Units
- **THEN** pan and Unit drag preview produce no durable writes before completion, one final logical
  write after completion, and no per-event full Unit visibility scan

### Requirement: Browser validation fails on unexpected runtime diagnostics
Development and production browser validation SHALL monitor every owned page for console errors and
warnings, uncaught page errors, hydration diagnostics, failed application requests, and failing
same-origin resource responses. React, Next.js, MobX, localization, accessibility, and application
diagnostics MUST NOT be suppressed or allowlisted. Any exception for browser-generated noise MUST
be narrow, documented beside its matcher, and include no organization data.

#### Scenario: Development React diagnostic
- **WHEN** the development probe renders and interacts with the application while React development
  diagnostics are enabled
- **THEN** a render-phase update, hydration mismatch, uncaught error, or unexpected console warning
  fails the probe with its source and message

#### Scenario: Complete production workflow audit
- **WHEN** the maintained server and Pages browser catalogs exercise Import, Export, theme,
  language, Teams, Employees, Editor, Calendar, Data Download, menus, dialogs, and
  representative mutations
- **THEN** every page finishes without an unexpected console error or warning, page error, failed
  application request, or failing same-origin resource response

#### Scenario: Actionable failure report
- **WHEN** an unexpected browser diagnostic occurs
- **THEN** validation reports the runtime, scenario, diagnostic category, URL when available, and
  message without transmitting the diagnostic or synthetic state outside the local test process

### Requirement: Documentation and gallery cover current product surfaces
The repository SHALL document both local-only runtimes, six bundled locales, Arabic RTL, isolated
Editor Views over global Employees, View-selectable Data
Download, wrapped direct Tag footers, modal Language and Theme settings, selected-only Editor
arrangement, direct State Export, source-driven Employee Import, colored Editor PNG Tags, privacy,
performance, and screenshots without obsolete guidance. The deterministic gallery SHALL contain
exactly 56 PNGs and the README SHALL retain exactly nine featured Import, Export, Theme, Language,
Units, Employees, Editor, Calendar, and Download frames.

#### Scenario: Complete gallery
- **WHEN** screenshot generation runs against the production runtimes
- **THEN** it deterministically replaces exactly 56 declared PNGs covering only current product workflows

#### Scenario: Locale gallery
- **WHEN** Language frames are generated
- **THEN** the primary frame shows six flagged language rows and the supporting frame demonstrates Arabic RTL

#### Scenario: Updated workflow gallery
- **WHEN** Editor, Units, Calendar, Language, Import, Download, and Tag frames are generated
- **THEN** they show View selection and management, direct Tag footers, View Download source, colored PNG Tags, rose weekends, flags, target Selects, and flat spaced Tag management

#### Scenario: View workflow gallery
- **WHEN** the four supporting View frames are generated
- **THEN** they show the selector, Blank/Copy dialog, isolated custom document, and Rename/Delete lifecycle with synthetic data

#### Scenario: Transfer gallery
- **WHEN** screenshot generation completes
- **THEN** featured Import shows State and Employee modes while supporting frames show source-driven mapping and explicit database recreation

#### Scenario: Tag management gallery
- **WHEN** Tag supporting frames are generated
- **THEN** catalog, rename, quick color, full Employee membership, and separated padding-free rows are visible across the maintained scenarios

#### Scenario: Structured-output gallery
- **WHEN** screenshot generation completes
- **THEN** Data Download shows its View source, JSON collections, exact exclusions, bounded preview, Template, and token suggestions while Editor shows Image, JSON, and Template for the active View

#### Scenario: Editor gallery
- **WHEN** Editor frames are generated
- **THEN** the system selector and protected management state are visible without restoring View-local Employee copies or overrides

#### Scenario: Featured README
- **WHEN** a visitor opens README
- **THEN** the same nine current product previews remain featured and every linked PNG exists

#### Scenario: Deterministic generation
- **WHEN** the 56-frame gallery is generated twice from unchanged source and fixed fixtures
- **THEN** every PNG hash is identical and every owned page has no unexpected console or network diagnostic

#### Scenario: Full-View image settings frame
- **WHEN** the full-View image export gallery frame is captured
- **THEN** it shows the preview above the uncompressed settings and no redundant explanatory subtitle

### Requirement: Localization validation covers every supported catalog
Automated checks SHALL validate exact keys, placeholders, non-empty translations, allowed technical
tokens, browser detection, writing direction, and representative visible and accessibility surfaces
for `en`, `zh`, `ru`, `es`, `fr`, and `ar` in both production runtimes.

#### Scenario: Validate six catalogs
- **WHEN** repository and browser validation runs
- **THEN** every supported locale passes static parity and runtime surface checks without fallback copy

#### Scenario: Validate large localized data
- **WHEN** Editor exercises 20,000 Employees and 4,000 Units
- **THEN** locale-only UI changes do not serialize organization state or trigger per-frame full scans

## REMOVED Requirements

### Requirement: Dashboard dependencies and screenshots are deterministic
**Reason**: Analytics charts, DOM capture, and their three gallery scenarios are removed.
**Migration**: Exclusive dependencies are removed and the remaining 56-frame gallery retains deterministic generation.
