## ADDED Requirements

### Requirement: Alternate image-export access is reserved to Super Administrator
The permission registry SHALL contain a global `editorImageExport.exportAs` permission. The
immutable Super Administrator bypass SHALL satisfy it, while role grants, direct grants,
Administration commands, Backup input, and PostgreSQL constraints MUST reject storing that
permission for any account or role.

#### Scenario: Super Administrator requests another account's export projection
- **WHEN** a Super Administrator with image-export access selects an active account
- **THEN** the server authorizes an export-only projection using the selected account's exact role, direct grants, Employee relation, Manager relations, and resource policies

#### Scenario: Attempt to grant export-as
- **WHEN** an Administration or Restore request includes `editorImageExport.exportAs` in a role or direct grant
- **THEN** the complete request is rejected without changing access data

### Requirement: Export subjects are active accounts
The export-as API SHALL accept only an active real account as its access subject. Unknown,
disabled, and inaccessible subject identifiers MUST return the same unavailable-resource response,
and the target's own image-export permission MUST NOT affect the acting Super Administrator's
export.

#### Scenario: Select a disabled or guessed account
- **WHEN** the actor submits a disabled or unknown account ID
- **THEN** the response does not distinguish the cases and no projection is returned

#### Scenario: Select a viewer without export permission
- **WHEN** the acting Super Administrator selects an active viewer who cannot independently export images
- **THEN** the output uses that viewer's read model while the action remains authorized and attributed to the Super Administrator
