## MODIFIED Requirements

### Requirement: Documentation and gallery cover current product surfaces
The repository SHALL document the current browser-memory and loopback SQLite runtimes, direct State
Export, State/Employee Import, structured JSON/Template Data Download, Editor Image/JSON/Template
export, privacy, performance, usage, and screenshot workflows without obsolete integration
guidance. The deterministic gallery SHALL contain exactly 38 PNGs covering the current product
scenarios, replacing both CSV frames with JSON-exclusion and Editor-JSON frames. The README SHALL
retain exactly ten featured Import, direct Export, theme, language, Teams, Employees, Editor,
Analytics, Calendar, and Download frames.

#### Scenario: Complete gallery
- **WHEN** screenshot generation runs against the production runtimes
- **THEN** it deterministically replaces exactly 38 declared PNGs covering only current product workflows

#### Scenario: Transfer gallery
- **WHEN** screenshot generation completes
- **THEN** featured Import shows State and Employee modes while featured Export shows the direct complete-state sidebar action without a mode dialog

#### Scenario: Structured-output gallery
- **WHEN** screenshot generation completes
- **THEN** Data Download shows JSON collections, exact exclusions, bounded preview, and Template while Editor shows Image, JSON, and Template

#### Scenario: Editor gallery
- **WHEN** Editor frames are generated
- **THEN** none contains a View selector or View management action

#### Scenario: Featured README
- **WHEN** a visitor opens README
- **THEN** the same ten current product previews remain featured and every linked PNG exists

#### Scenario: Deterministic generation
- **WHEN** the 38-frame gallery is generated twice from unchanged source and fixed fixtures
- **THEN** every PNG hash is identical and every owned page has no unexpected console or network diagnostic
