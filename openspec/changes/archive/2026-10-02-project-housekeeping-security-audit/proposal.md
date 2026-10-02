## Why

The repository has accumulated obsolete specification language, a small unused UI module, and
production dependency versions with published security advisories. A focused housekeeping and
security pass is needed to make the maintained source of truth match the authenticated PostgreSQL
product without changing product behavior or weakening its authorization boundary.

## What Changes

- Audit tracked source, generated output boundaries, dependencies, runtime configuration, API
  request handling, authorization, Docker delivery, CI, and documentation for dead or contradictory
  material.
- Upgrade the affected production dependency chain to patched releases and add a repeatable
  production dependency audit to maintained validation.
- Remove only source proven to be unreachable, consolidate duplicated secure UUID generation, and
  retain compatibility for every supported workflow.
- Strengthen repository and image safety checks for credentials, database and backup material,
  generated reports, and obsolete runtime contracts.
- Reconcile canonical OpenSpec capabilities, public documentation, contribution templates, and
  operational guidance with the current authenticated server, PostgreSQL, Backup/Restore, and
  56-frame gallery.
- Preserve the exact State and PostgreSQL schema, all API and UI behavior, permissions, ACL filtering,
  exports, localization, and screenshot coverage. No database migration is required.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-tooling`: Require maintained dependency/security auditing, dead-source hygiene, and
  internally consistent current documentation and gallery contracts.
- `privacy-safety`: Express the current server-authorized trust boundary and require cryptographic
  identifiers plus complete artifact exclusion checks.
- `container-delivery`: Verify patched production dependencies and reject sensitive or generated
  material from both the build context and runtime image.
- `state-transfer`: Describe Backup/Restore as the only complete transfer surface without obsolete
  State or Employee import terminology.
- `organization-views`: Replace obsolete SQLite, live-tab, and browser-only lifecycle wording with
  PostgreSQL document and per-account UI persistence.
- `tag-catalog`: Replace obsolete propagation persistence wording with the current revisioned server
  document and authorized projection contract.
- `organization-editor`: Remove obsolete compatibility-reader language from current Editor state
  requirements.
- `interface-localization`: Align localization coverage with current Backup/Restore and authorized
  Data Download workflows and account-scoped locale synchronization.
- `interface-chrome`: Remove obsolete Employee Import workflow coverage from the current interface
  contract.
- `employee-model`: Replace the obsolete live-tab display-format propagation description with the
  current revisioned server synchronization contract.
- `postgresql-runtime`: Remove the completed one-time SQLite conversion obligation from the current
  PostgreSQL runtime contract while retaining its archived history.

## Impact

The change affects package versions and lock data, validation and publication scripts, a small set of
shared identifier helpers, canonical OpenSpec text, contributor/security documentation, and tests.
It does not change persistent data, routes, API schemas, permissions, visible UI, or deployment
configuration. Production dependencies and the container image are rebuilt and fully revalidated.
