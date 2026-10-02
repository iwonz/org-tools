## ADDED Requirements

### Requirement: Maintained validation audits repository hygiene and locked dependencies
The repository SHALL provide deterministic checks for dead tracked source, generated or sensitive
artifacts, obsolete current-runtime contracts, and locked dependency advisories. Explicit
dependency auditing MAY contact the package registry during development and CI, but MUST NOT run in
the application or transmit organization data, credentials, or deployment configuration.

#### Scenario: Audit a clean change
- **WHEN** maintained fast and complete validation run for a change
- **THEN** source hygiene, current documentation, locked dependencies, tracked artifacts, and
  publication boundaries are checked alongside the existing functional gates

#### Scenario: Detect a vulnerable production package
- **WHEN** the installed locked dependency graph contains an advisory at the configured failing severity
- **THEN** validation fails with package and advisory metadata without printing application secrets or organization data

#### Scenario: Review a possible dead file
- **WHEN** static analysis identifies a file without an import consumer
- **THEN** it is removed only after command, configuration, declaration-companion, build, and test consumers are also excluded

### Requirement: Local stateful validation cannot mutate configured organization data
The maintained local changed-path and deterministic-gallery validation SHALL run browser, fixture,
authentication, and runtime checks in a dedicated Compose project with temporary bind-backed
PostgreSQL and Backup directories. They MUST NOT connect to, authenticate against, migrate, or
replace the configured development organization, and cleanup MUST remove the temporary data after
the run.

#### Scenario: Validate a change beside an existing development organization
- **WHEN** a developer runs changed-path validation with a configured PostgreSQL organization
- **THEN** all stateful checks use the isolated validation database and the configured organization remains byte-for-byte unchanged

#### Scenario: Interrupt changed-path validation
- **WHEN** validation succeeds, fails, or receives an interrupt
- **THEN** validation containers stop and their temporary PostgreSQL and Backup directories are removed without stopping the ordinary development project

#### Scenario: Verify the complete gallery locally
- **WHEN** a developer runs the supported two-pass gallery command
- **THEN** both passes use an isolated temporary organization and leave the configured development organization unchanged

#### Scenario: Run the complete local browser matrix
- **WHEN** changed validation selects every maintained browser spec without a CI shard
- **THEN** each spec runs serially in a fresh Chromium process against the same isolated validation database, while every scenario still executes exactly once

## MODIFIED Requirements

### Requirement: Documentation and gallery cover current product surfaces
The repository SHALL consistently document the authenticated PostgreSQL server, account access,
Backup/Restore, authorized Data Download and image export, six bundled locales, Arabic RTL,
Employees, Units, global Tags, isolated Editor Views, staffing slots, Calendar, and container
operations without presenting removed browser-only, SQLite, State Import/Export, Employee Import,
Analytics, Open Position, or GitHub Pages behavior as current. Historical OpenSpec archives and
Git history MAY retain completed records. The maintained gallery SHALL contain exactly 56 synthetic
PNG files and README SHALL feature the nine current product surfaces.

#### Scenario: Validate current documentation
- **WHEN** repository validation scans current capability specs, documentation, contribution templates, and automation
- **THEN** current behavior and terminology agree with implemented routes, persistence, delivery, and maintained tests

#### Scenario: Generate the current gallery
- **WHEN** screenshot generation runs twice against the authenticated production server
- **THEN** exactly 56 declared synthetic PNG files are replaced and both SHA-256 manifests match

#### Scenario: Inspect README previews
- **WHEN** a visitor opens README
- **THEN** nine current product previews are featured and every linked PNG exists

### Requirement: Validation covers catalog ordering and Unit grouping
Repository validation SHALL cover atomic pointer and keyboard Tag moves, filtered insertion and
cancellation, scrollable nested color presets, conditional dated counts, strict grouping state,
earliest-Tag grouping, boss placement, View-local history and copying, manual and Live membership,
ordered output, revisioned server persistence, authorized refresh, accessibility, localization, and
bounded derivation. The 56-frame gallery SHALL include View settings with default-enabled grouping
and Tag cloud switches, distribution colors, and catalog rows with leading reorder handles. README
SHALL retain nine featured frames.

#### Scenario: Validate ordered presentation in the production runtime
- **WHEN** authorized users reorder Tags and toggle View grouping in browser validation
- **THEN** catalog and Employee Tag surfaces retain global sequence, each Employee appears once in expected DOM and PNG order, and PostgreSQL reload preserves the committed result without unexpected diagnostics

#### Scenario: Validate the current-only document boundary
- **WHEN** a View omits settings or supplies invalid settings
- **THEN** strict command validation rejects the complete candidate without mutation and no runtime migration is attempted

#### Scenario: Regenerate settings and catalog frames
- **WHEN** the gallery is generated twice from unchanged source and fixtures
- **THEN** all 56 PNG hashes match and the settings frame shows View display switches and distribution colors

## REMOVED Requirements

### Requirement: Delivery converts an owned previous-schema database safely
**Reason**: This one-time SQLite-to-PostgreSQL release obligation completed during the enterprise runtime migration and is not a current product or delivery path.

**Migration**: Current releases use checked forward-only PostgreSQL migrations and encrypted Backup/Restore; historical conversion evidence remains in archived OpenSpec records.
