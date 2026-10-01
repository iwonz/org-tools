## MODIFIED Requirements

### Requirement: Per-account UI state remains bounded and separate
The server SHALL persist locale, theme, shell, active workflow, searches, filters, Download settings,
active View, viewport, selection, and distribution mode per account with the same bounded shapes as before.
Transient overlays, drafts, clipboard, generated output, invalid input, history, and export sessions
MUST NOT persist. Malformed or inexact UI payloads MUST return the standard invalid-input response
without writing data.

#### Scenario: Two accounts use different UI state
- **WHEN** two accounts change locale, active View, filters, or viewport independently
- **THEN** each account restores only its own bounded UI state while organization data remains shared

#### Scenario: Reject malformed UI state
- **WHEN** an authenticated account submits a UI object outside the exact production schema
- **THEN** the server returns an invalid-input response and preserves the prior per-account UI state
