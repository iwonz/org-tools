# single-state-runtime Specification

## Purpose
Define the strict singleton state contract, automatic SQLite persistence, private state API, and live-tab convergence.
## Requirements
### Requirement: One authenticated server owns current organization data
Org Tools SHALL have one self-hosted server runtime backed by PostgreSQL. Organization data SHALL be
mutated only through authenticated commands, durable UI SHALL be account-specific, and clients SHALL
receive only authorized projections. No browser snapshot, Pages runtime, SQLite runtime,
`BroadcastChannel`, or whole-state API SHALL remain.

#### Scenario: Open an authenticated tab
- **WHEN** an account with a valid session opens the application
- **THEN** the server returns its current authorized projection and per-account UI state without exposing a complete State

#### Scenario: Open without a session
- **WHEN** a caller without a valid session opens an initialized installation
- **THEN** only localized Login and nonsecret bootstrap status are available

### Requirement: Per-account UI state remains bounded and separate
The server SHALL persist locale, theme, shell, active workflow, searches, filters, Download settings,
active View, viewport, selection, and distribution mode per account with the same bounded shapes as before.
Transient overlays, drafts, clipboard, generated output, invalid input, history, and export sessions
MUST NOT persist.

#### Scenario: Two accounts use different UI state
- **WHEN** two accounts change locale, active View, filters, or viewport independently
- **THEN** each account restores only its own bounded UI state while organization data remains shared
