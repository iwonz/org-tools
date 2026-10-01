## Why

Administration is a privileged account workflow, but it currently occupies the same sidebar space
as everyday organization destinations. Its role and permission editors also expose internal
identifiers, while several authentication and Administration surfaces have inconsistent alignment
and dialog spacing.

## What Changes

- Move the Super-Administrator-only Administration destination from product navigation into the
  account menu and order sidebar footer controls as account, theme, then language.
- Align Administration tabs to the logical start and add a thematic icon to every tab.
- Restore standard horizontal dialog padding for account password changes and center the Login and
  Setup heading block without changing field alignment.
- Replace raw permission and scope identifiers with exhaustive localized user-facing labels in
  editable and read-only Administration surfaces.
- Update browser coverage, the 56-image gallery, documentation, and all six locale catalogs.
- Preserve authorization, State, PostgreSQL, API payloads, audit identifiers, and permission values.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `interface-chrome`: Move Administration into the account menu, reorder sidebar footer controls,
  align and illustrate Administration tabs, and correct authentication/dialog spacing.
- `interface-localization`: Require complete localized permission and scope labels without exposing
  internal identifiers in Administration.
- `authorization-and-access-control`: Present the permission registry through understandable labels
  while preserving its exact server-enforced identifiers and scopes.

## Impact

The authenticated shell, account menu, authentication form, Administration UI, localization
catalogs, browser tests, screenshots, and user documentation are affected. No database migration,
State conversion, dependency, API compatibility, authorization, privacy, or external network change
is introduced.
