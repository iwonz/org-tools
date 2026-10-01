## REMOVED Requirements

### Requirement: Locale is detected and persisted locally
**Reason**: Locale is now per-account server UI state rather than complete local State metadata.
**Migration**: Keep browser detection for setup/login and first account use, then persist an authenticated account's selected locale in PostgreSQL.

### Requirement: Employee transfer is completely localized
**Reason**: Employee Import is removed.
**Migration**: Remove its message keys and localize replacement authentication, Administration, and Backup workflows.

## ADDED Requirements

### Requirement: Locale is available before and after authentication
Setup and Login SHALL use a valid browser preference or supported browser language and fall back to
English without persisting credentials or organization data in browser storage. After authentication,
the selected locale SHALL persist in per-account UI state and update the current session without a
route or reload.

#### Scenario: Open Login in Arabic
- **WHEN** an unauthenticated browser prefers Arabic
- **THEN** Login renders in Arabic RTL without reading organization data or writing an organization snapshot

#### Scenario: Restore an account locale
- **WHEN** an authenticated account has a saved supported locale
- **THEN** that locale overrides browser detection and renders its authorized application projection

### Requirement: Security and deployment workflows are completely localized
All six catalogs SHALL include complete Setup, Login, forced-password, account-menu, Users, Roles,
Access, Audit, Backup, Restore, permission, policy, session, PostgreSQL readiness, and validation copy.
Raw security, parser, filesystem, database, and crypto errors MUST NOT render.

#### Scenario: Exercise Administration in every locale
- **WHEN** browser coverage opens representative authentication and Administration workflows in each supported locale
- **THEN** every visible label, status, error, accessibility name, plural, date, and destructive warning is localized

