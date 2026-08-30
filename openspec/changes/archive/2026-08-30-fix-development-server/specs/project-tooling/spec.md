## MODIFIED Requirements

### Requirement: Development startup has a bounded functional probe
The repository SHALL provide a development smoke command that starts the documented loopback
Next.js development entry point with its explicit supported compiler and an isolated temporary
SQLite database inside the ignored runtime boundary, excludes runtime database writes from module
watching, excludes ignored browser-diagnostic writes from module watching, resolves the current
project through a pre-render server redirect, verifies project
initialization, stable browser routing, interactive rendered output, and the project list API, and
always terminates its browser and server child processes.

The interactive development command SHALL warm the root route, selected project route, and local
project API before presenting the workspace URL as ready, and SHALL forward termination to the
owned Next.js process.

#### Scenario: Healthy development server
- **WHEN** `pnpm dev:check` runs with a free loopback port and installed Chromium
- **THEN** the command observes the root navigation settle on a stable UUID project URL, the
  interactive application shell and Editor canvas become visible, the current project API response
  is valid, and temporary browser and database state are removed before success

#### Scenario: Runtime database write
- **WHEN** project startup or interaction writes a database, journal, or configuration below the
  reserved `.org-tools` runtime directory
- **THEN** the development compiler does not invalidate or rebuild application modules for that
  runtime-only change

#### Scenario: Browser diagnostic write
- **WHEN** a local browser smoke tool writes snapshots or logs below the ignored
  `.playwright-cli` directory
- **THEN** the development compiler does not invalidate or rebuild application modules for that
  diagnostic-only change

#### Scenario: Existing project root navigation
- **WHEN** `/` resolves an existing current project during development
- **THEN** the server redirects to its stable UUID route before page rendering and the browser does
  not depend on a streamed client redirect or development overlay timing

#### Scenario: Interactive cold start
- **WHEN** `pnpm dev` starts against an existing or newly created local database
- **THEN** it presents the workspace URL only after root resolution and initial project route and
  API compilation complete, so the first browser load reaches the interactive shell without a
  cold-compilation Fast Refresh race

#### Scenario: Development startup failure
- **WHEN** the server cannot start, initialize SQLite, compile through the documented compiler,
  settle browser routing, render the interactive shell, or answer within the fixed deadline
- **THEN** the command closes the browser, terminates the server child, removes temporary state,
  prints bounded diagnostic output, and exits unsuccessfully
