# privacy-safety Specification

## Purpose
Define the browser data boundary, publication safeguards, and explicit external navigation rules.
## Requirements
### Requirement: Organization data remains local
The application SHALL not transmit workspace state, generic JSON rows, state projections, detached
candidates, mapping previews, Employee tag dates, calendar events, avatar sources or crop results,
search terms, analytics, or exports, SHALL make no background external requests, and SHALL keep
organization data out of cookies, IndexedDB, session storage, and local storage. It MAY persist only
bounded non-sensitive UI preferences such as theme and locale in local storage.

#### Scenario: Core workflow network audit
- **WHEN** a user selects and maps JSON, appends or replaces a state projection, edits tag dates, opens calendar dialogs, exports workspace state, searches, analyzes, downloads tabular data, and changes locale
- **THEN** browser requests are limited to the locally served application assets

#### Scenario: Locale preference persistence
- **WHEN** a user selects an interface locale
- **THEN** local storage contains only the locale identifier and no organization data, import rows, candidates, or tag dates

#### Scenario: Cancel transient operation
- **WHEN** a user cancels native file selection, mapping, state projection, destructive replacement, tag-date edit, workspace Export dialog, avatar source, or crop
- **THEN** browser persistence and the in-memory organization state receive none of the canceled data

#### Scenario: Candidate validation failure
- **WHEN** any append or replace candidate fails strict validation
- **THEN** the current in-memory workspace remains unchanged and no candidate data is persisted or transmitted

### Requirement: Public artifacts use general safety checks
The repository SHALL validate tracked and generated artifacts for portable paths, secrets,
unexpected language, unsupported media, generated caches, and obsolete public contracts through
general project rules.

#### Scenario: Publication scan
- **WHEN** the public-safety check scans tracked files and the production build
- **THEN** a general artifact or contract violation causes a failing exit code without embedding project-origin-specific policy

### Requirement: Import previews remain transient and local
The application SHALL derive hierarchy rows and Employee cards only from the selected in-memory
import session, SHALL make no external request for preview content, and SHALL discard preview UI
state when the source or dialog is cleared.

#### Scenario: Render preview cards
- **WHEN** a selected JSON file contains embedded avatars, contact fields, tags, Teams, and assignments
- **THEN** preview rendering stays in the current page and contact values are non-interactive text

#### Scenario: Cancel preview
- **WHEN** the user cancels a hierarchical preview
- **THEN** normalized rows, collapse state, and candidate data are discarded without persistence or mutation

### Requirement: External contact actions are explicit
The application SHALL open persisted profile links and mail links only after a user action with referrer protections.

#### Scenario: Profile navigation
- **WHEN** a user activates a valid Employee profile link
- **THEN** it opens separately with `noopener`, `noreferrer`, and no referrer
