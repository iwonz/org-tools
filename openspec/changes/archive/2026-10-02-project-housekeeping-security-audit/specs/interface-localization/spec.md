## MODIFIED Requirements

### Requirement: Users can switch locale without routing
The application SHALL provide a language sidebar action immediately before theme that opens a
compact modal with all six choices. Each row SHALL show a localized language name and its autonym
with native-radio semantics and a selected indicator. Selection SHALL immediately update metadata
and direction, persist in the authenticated account UI state, notify the account's other open
clients through authorized UI events, and close the modal without route navigation or reload.

#### Scenario: Open language settings
- **WHEN** a user activates Language in compact or expanded sidebar mode
- **THEN** focus moves into a localized modal containing all six language choices

#### Scenario: Runtime switch
- **WHEN** a user chooses another language
- **THEN** open copy, accessibility names, document metadata, direction, state, and preference update
  in place, the modal closes, focus returns safely, and other open clients converge through the
  account-scoped event stream

### Requirement: Refined core workflows are completely localized
All six bundled locales SHALL provide matching non-empty visible and accessibility copy for Setup,
Login, password change, Administration, Backup/Restore, Data Download and Template tokens, Format
guidance, Calendar groups, Gender, Birthday, Tag selection, Employee fields, and Unit validation.
Stable server error codes MUST resolve through the catalog; raw filesystem, SQL, parser, permission,
or credential values MUST NOT be rendered.

#### Scenario: Recover in Russian
- **WHEN** the Russian runtime opens Backup/Restore and a stable recovery error occurs
- **THEN** every warning, action, accessible name, and failure message is Russian without exposing an internal error

#### Scenario: Use current workflows in English
- **WHEN** the English runtime opens token suggestions, Format guidance, Calendar, Employee form, and Administration
- **THEN** all owned labels, descriptions, options, errors, and accessibility names are English

#### Scenario: Preserve machine and user values
- **WHEN** any locale displays a token, filename, Tag, Unit, or Employee value
- **THEN** the machine token and user-authored value remain verbatim while surrounding product copy is localized

## ADDED Requirements

### Requirement: Refined Tag and access workflows are localized
All six bundled catalogs SHALL provide matching non-empty visible, validation, tooltip, empty-state,
and accessibility copy for Tag color and membership actions, access policies, role permissions, and
authorized Data Download selection. Technical tokens, permission IDs, and canonical colors remain
internal or verbatim only where they are data rather than user-facing labels.

#### Scenario: Audit refined workflows
- **WHEN** localization validation opens Tag actions, membership details, access policies, and Data Download in every locale
- **THEN** owned copy uses the active catalog without fallback keys, raw permission IDs, or unexpected English

## REMOVED Requirements

### Requirement: Refined Tag and mapping workflows are localized
**Reason**: Source-driven Employee Import and its mapping UI were removed when complete transfer moved to encrypted Backup/Restore.

**Migration**: Current Tag, access-policy, and authorized Data Download localization is specified by `Refined Tag and access workflows are localized`.
