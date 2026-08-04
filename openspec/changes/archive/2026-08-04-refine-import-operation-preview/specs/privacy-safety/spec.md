## ADDED Requirements

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

### Requirement: Public artifacts use general safety checks
The repository SHALL validate tracked and generated artifacts for portable paths, secrets,
unexpected language, unsupported media, generated caches, and obsolete public contracts through
general project rules.

#### Scenario: Publication scan
- **WHEN** the public-safety check scans tracked files and the production build
- **THEN** a general artifact or contract violation causes a failing exit code without embedding project-origin-specific policy
