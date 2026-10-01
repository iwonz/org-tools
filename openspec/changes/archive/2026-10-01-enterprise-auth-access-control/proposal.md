## Why

Org Tools currently trusts every browser user with one complete organization snapshot and persists it in a loopback SQLite singleton, so it cannot be deployed for a company without exposing all people data and every mutation. The product needs server-enforced identity, role and resource access, durable PostgreSQL storage, encrypted recovery, and a reproducible container release path before it can be used by multiple corporate users.

## What Changes

- **BREAKING** Replace the Pages and loopback SQLite runtimes, `BroadcastChannel`, and whole-state `/api/state` transport with one self-hosted authenticated Next.js server backed by PostgreSQL.
- Add one-time Super Administrator setup, email/password login, Argon2id password storage, opaque server sessions, CSRF/origin enforcement, session revocation, rate limiting, and local administrative password recovery.
- Add one base role per account, additive direct permission grants, scoped Manager access derived from the system View, and immutable Super Administrator access.
- Add field, Tag, Unit, Staffing Slot, and custom View read/write access policies and server-side projections that remove inaccessible values from every UI, API, count, search, export, image, and accessible label.
- Add a Super Administrator area for users, roles, access policies, sessions, and audit events.
- **BREAKING** Remove Employee Import and replace complete State Import/Export with encrypted full Backup and Restore. Keep permission-filtered Data Download and Editor image export as separate capabilities.
- Add checked PostgreSQL migrations, a one-time external SQLite conversion, transactional organization revisions, per-account UI state, authorization-aware server events, and security audit storage.
- Add a mandatory root `.env.example`, safe environment initialization, Docker Compose development and deployment, external PostgreSQL bind storage, a hardened multi-stage image, and documented Compose and Docker Run workflows.
- Remove GitHub Pages publication. Add Release Please SemVer releases and public multi-architecture GHCR images with SBOM and provenance; the first stable release is `v1.0.0`.
- Preserve the prohibition on telemetry, remote organization-data services, remote avatars, and other runtime third-party data transfers.

## Capabilities

### New Capabilities

- `authentication-and-sessions`: bootstrap, accounts, passwords, sessions, reauthentication, recovery, and request protections.
- `authorization-and-access-control`: roles, permission scopes, direct grants, resource policies, authorized projections, and Administration workflows.
- `postgresql-runtime`: PostgreSQL schema, migrations, transactional revisions, server events, audit storage, and SQLite conversion.
- `backup-restore`: encrypted complete backups, detached validation, atomic restore, and recovery safeguards.
- `container-delivery`: environment contract, Compose development/deployment, hardened images, GHCR publication, and SemVer releases.

### Modified Capabilities

- `single-state-runtime`: remove browser/SQLite singleton modes and whole-state transport in favor of one authenticated PostgreSQL server.
- `state-transfer`: remove direct State and Employee import/export and define the remaining user-visible transfer boundaries.
- `interface-chrome`: add setup/login/account/Administration navigation and permission-aware actions; remove Pages parity and old Import/Export actions.
- `privacy-safety`: require server-side least-data projections and prevent unauthorized values from reaching any output surface.
- `project-tooling`: replace host/Pages workflows with containerized development, PostgreSQL CI, release automation, and publication checks.
- `interface-localization`: localize authentication, Administration, access, Backup, and container-facing user guidance in all six catalogs.

## Impact

- Replaces the public `OrgToolsState` browser contract, persistence layer, route surface, startup flow, and cross-tab synchronization.
- Adds PostgreSQL and password/crypto dependencies while removing runtime SQLite and the Pages workspace/workflows.
- Changes every data-consuming store and UI surface to use an authorized server projection and command API.
- Requires a one-time owned SQLite conversion and a fresh authenticated bootstrap; obsolete State files are no longer accepted.
- Adds Dockerfiles, Compose definitions, environment tooling, PostgreSQL integration tests, release workflows, and GHCR artifacts.
- Updates all capability specifications, architecture/privacy/performance/usage/screenshots documentation, six message catalogs, fixtures, browser suites, and the maintained 56-image gallery.

### Privacy and compatibility

The server remains self-hosted and performs no telemetry, remote logging, remote synchronization, remote avatar fetching, or third-party organization-data requests. This is an intentionally incompatible deployment, State, API, and backup-format change; there is no browser runtime or runtime compatibility reader for legacy SQLite or JSON State.

### Non-goals

- Multiple organizations in one installation.
- SSO, MFA, SCIM, email delivery, or email-based password recovery.
- Multiple roles per account or explicit deny grants.
- Direct client access to PostgreSQL or a public organization-data API.
