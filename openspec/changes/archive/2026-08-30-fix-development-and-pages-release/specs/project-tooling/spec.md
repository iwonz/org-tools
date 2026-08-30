## ADDED Requirements

### Requirement: Development startup has a bounded functional probe
The repository SHALL provide a development smoke command that starts the real loopback Next.js
development entry point with an isolated temporary SQLite database, verifies project initialization,
stable routing, rendered output, and the project list API, and always terminates its child process.

#### Scenario: Healthy development server
- **WHEN** `pnpm dev:check` runs with a free loopback port
- **THEN** the command observes the root project redirect, a successful project page, and a valid
  current project API response before exiting successfully and removing temporary state

#### Scenario: Development startup failure
- **WHEN** the server cannot start, initialize SQLite, compile the route, or answer within the fixed
  deadline
- **THEN** the command terminates the child, removes temporary state, prints bounded diagnostic
  output, and exits unsuccessfully

### Requirement: Repository validation includes the static showcase
The repository SHALL keep package-manager configuration in its supported workspace location and
SHALL build and inspect the ignored Pages artifact in continuous and pre-publication validation.

#### Scenario: Supported package-manager configuration
- **WHEN** repository commands run with the pinned pnpm version
- **THEN** dependency overrides are applied from workspace configuration without obsolete-field
  warnings

#### Scenario: Continuous showcase validation
- **WHEN** CI validates a clean checkout
- **THEN** it runs the development probe, builds the Pages artifact, and applies publication-safety
  checks before reporting success
