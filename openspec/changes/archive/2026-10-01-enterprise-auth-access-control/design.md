## Context

Org Tools has two trusted-client runtimes. The Next.js server stores one complete `OrgToolsState`
JSON value in SQLite and sends it to every client through `/api/state`; the static Pages runtime
holds the same value in memory and synchronizes tabs with `BroadcastChannel`. Every browser can
therefore read and replace every organization value. This design replaces that trust model with a
self-hosted, single-organization server that authenticates each request, projects only authorized
data, and persists organization and security data in PostgreSQL.

The change is deliberately incompatible. The browser runtime, Pages deployment, SQLite repository,
whole-state API, Employee Import, and legacy State transfer format are removed together. The owned
SQLite snapshot is converted once outside runtime after a timestamped backup. No compatibility
reader or background migration remains in the product.

The runtime remains private by deployment and behavior: it contacts no third-party data service,
loads no remote assets, and emits no telemetry or remote logs. A reverse proxy may terminate TLS,
but it is deployment infrastructure rather than an application dependency.

## Goals / Non-Goals

**Goals:**

- Authenticate users with a one-time bootstrap and email/password sessions.
- Enforce permissions, relationship scopes, and resource policies before data reaches a client.
- Preserve established Employee, Unit, View, Editor, Calendar, Download, and PNG behavior for the
  subset of data each account may access.
- Persist organization and security state transactionally in PostgreSQL and synchronize clients
  with authorized server events.
- Provide encrypted complete Backup/Restore and permission-filtered user exports.
- Make Docker Compose the complete development and deployment path and keep all database data
  outside the checkout.
- Publish reproducible public multi-platform GHCR images and SemVer GitHub releases.

**Non-Goals:**

- Multiple organizations in one installation.
- SSO, MFA, SCIM, email delivery, or email-based password recovery.
- Multiple base roles, explicit deny rules, PostgreSQL access from browsers, or a public data API.
- Runtime migration of legacy SQLite or State JSON.
- Bundled TLS termination.

## Decisions

### 1. Server trust boundary and authorized projection

The browser no longer receives `OrgToolsState`. The server owns an `OrganizationDocument` JSONB
value and normalized security tables. A bootstrap response contains the current account, effective
grants, per-account UI state, organization/security revisions, a session-bound CSRF token, and an
`AuthorizedOrganizationProjection` whose inaccessible properties and resources have been removed.

Every mutation is a member of a closed discriminated command union. The registry for each command
declares its permission, valid scope, policy target, validator, and mutation function. Unknown
commands and unknown properties fail closed. Commands execute under a PostgreSQL transaction after
authentication, CSRF/origin validation, permission evaluation, and policy evaluation. The server
locks the organization row and compares `expectedRevision`; conflicts make no change and return the
current revision so the client can discard its optimistic change and refetch.

This is preferred to client-side filtering or a signed whole-state document because neither can
prevent direct API reads, altered requests, hidden-value inference, or stale privilege use.

### 2. Accounts, passwords, and sessions

The first account is created only while no account exists and only when the submitted setup token
matches `ORG_TOOLS_SETUP_TOKEN` in constant time. It receives the immutable Super Administrator
role. The endpoint is unavailable after bootstrap. Subsequent accounts are created by a Super
Administrator and receive a generated temporary password.

Account email uses trim, NFKC normalization, and locale-independent lowercase comparison. A
normalized Employee identity index mirrors Employee IDs and nonempty emails from the organization
document in the same transaction. It supplies unique constraints and stable account links without
normalizing the entire Editor document into relational tables. Non-Super-Administrator accounts
must link to exactly one indexed Employee; a linked Employee cannot be deleted and their email can
only change through an atomic Administration command.

Passwords contain 15 through 128 Unicode code points and use Argon2id with 64 MiB memory, three
iterations, and parallelism one. The encoded hash stores its parameters and is upgraded after a
successful login when policy changes. Login and setup messages do not distinguish nonexistent
accounts. PostgreSQL-backed identifier and instance buckets bound repeated failures.

Sessions use a random 256-bit opaque token; only its SHA-256 digest is stored. Idle and absolute
expirations are eight and twenty-four hours. Production uses a `__Host-` Secure, HttpOnly,
SameSite=Strict cookie; localhost development uses a separate non-Secure cookie name. State-changing
JSON requests require the session-bound CSRF token, exact configured origin, and same-origin Fetch
Metadata. There is no CORS policy. Password, role, account-status, and restore operations revoke the
affected sessions as specified by their commands.

### 3. Permission and policy model

An account has one role plus additive direct grants. A grant is a permission and one permitted
scope: `self`, `managedDirect`, `managedSubtree`, or `all`. A code-owned permission registry rejects
scopes that do not make sense for a global operation. Super Administrator bypasses permissions and
policies; its role cannot be edited and the last active holder cannot be demoted or disabled.

Manager relationships are derived only from boss assignments in the system View. They never assign
a role automatically. A Manager without a managed Unit has no scoped writes, while an Employee who
is a boss remains read-only. Reparenting and bulk commands authorize the complete source and target
sets against the pre-mutation graph, preventing a command from granting itself a wider scope.

Resource policies contain read and write audiences made from all-authenticated, role IDs, account
IDs, and relationship clauses. Permission and policy must both allow an operation. Unit policies
inherit downward and descendants may narrow but not widen the parent. Staffing Slots inherit their
Unit and may narrow it. View, Tag, built-in/custom field, Unit, and Slot policies share one validated
policy representation and reference index.

Built-in Employee fields start readable by authenticated accounts. Existing custom fields and
custom Views start Super-Administrator-only. Existing Tags start visible to authenticated accounts;
Tags may later hide themselves and optionally hide tagged Employees from viewers who cannot read
the Tag. The current Employee always retains a self card, with hidden values removed. Existing Units
start readable by authenticated accounts and writable through Manager relationship plus permission.

The projection engine applies visibility before indexes, search, filter options, counts, Calendar,
Download, Editor layout, hit testing, accessible names, and PNG input are built. Template fields are
resolved on the server from complete values, then only the authorized rendered result is exposed.
This avoids sending hidden dependencies to the browser.

### 4. PostgreSQL document and security schema

The PostgreSQL schema contains forward-only checked SQL migrations and these logical groups:

- singleton organization document, revision, security revision, and bootstrap UI state;
- Employee identity index;
- accounts, roles, role grants, direct grants, and resource policies;
- session digests, per-account UI state, login-rate buckets, and append-only audit events;
- migration names and SHA-256 checksums.

The organization remains one validated JSONB document because its View-local Editor graphs and
canvas structures are already optimized and tested as an atomic graph. Authentication, identity,
policy, session, and audit data are normalized because they require uniqueness, bounded lookup,
independent lifecycle, and secure server querying.

The `pg` driver is used directly. A dedicated migration command obtains a PostgreSQL advisory lock,
checks every applied checksum, applies pending migrations transactionally where PostgreSQL permits,
creates or updates the non-superuser application role, and grants only required schema/DML access.
The application process never applies DDL and refuses startup for an unexpected schema.

The projection cache is bounded and keyed by organization revision, security revision, account ID,
locale, and relevant View. Security changes increment the security revision and invalidate affected
entries. Server-Sent Events contain only already-authorized changes or a refetch instruction; a
security change never reuses a patch created for another account.

### 5. Backup, Restore, and transfer boundaries

Complete State Import/Export becomes full Backup/Restore. Employee Import is removed. Data Download
and Editor image export remain separate operations against the current authorized projection.

A complete backup serializes the organization document and normalized accounts, password hashes,
roles, grants, policies, UI states, and audit records. It excludes sessions, CSRF values, setup token,
and rate-limit buckets. The canonical payload is compressed, then encrypted with AES-256-GCM using
an Argon2id-derived per-backup passphrase key. The authenticated header identifies the current backup
contract and contains the salt, nonce, and KDF parameters; no backward parser is retained.

Backup and Restore require current-password reauthentication. Restore decrypts and parses a detached
candidate, validates every graph and at least one active Super Administrator, then takes a maintenance
lock. It first writes an encrypted timestamped recovery backup to the configured external backup
directory and atomically replaces all restorable tables. Failure leaves the database and sessions
unchanged; success revokes every session.

### 6. Container and environment contract

The committed `.env.example` contains names and placeholders only. `./bin/org-tools env init`
creates a missing mode-0600 `.env`, random 256-bit credentials, and absolute storage directories
under `$HOME/.org-tools`. It refuses to overwrite a file, rejects paths inside the checkout, and does
not evaluate environment values as shell source.

`compose.yaml` defines PostgreSQL, storage preparation, migration, and application services.
PostgreSQL 18 mounts `${ORG_TOOLS_POSTGRES_DATA_PATH}` as a bind at `/var/lib/postgresql`; no named or
anonymous database volume is allowed. The application receives only the application credentials,
runs as a non-root user with dropped capabilities and a read-only filesystem, and writes only to
tmpfs and the external backup bind. It binds to host loopback by default. A development override
builds the source image, enables hot reload, and provides a toolbox so Node, pnpm, tests, OpenSpec,
and formatting all execute through Compose.

The production Dockerfile builds Next.js standalone output in stages and copies only runtime code,
static assets, migrations, and required local fonts. `.dockerignore` excludes environment files,
database families, backups, fixtures, VCS data, caches, and generated reports. A Docker Run wrapper
parses only allowlisted `.env` keys and reproduces the Compose topology without sourcing the file.

### 7. Release and publication

Release Please owns the root Node version and CHANGELOG through a release PR. The initial change uses
`Release-As: 1.0.0`. Main publishes `edge` and a commit tag; a completed release publishes full,
minor, major, and `latest` tags for `linux/amd64` and `linux/arm64`. GitHub Actions uses minimal token
permissions, pinned actions, OCI metadata, an SBOM, and GitHub provenance attestation. Pull requests
build and test the image without pushing it. The obsolete Pages workflow and workspace are deleted.

### 8. Client migration

MobX continues to own derived client interaction state, but it loads an authorized projection and
emits commands instead of serializing the entire document. UI state is saved per account. The shell
has logged-out Setup/Login states, a forced-password state, an account menu, and Super-Administrator
Administration tabs for Users, Roles, Access, and Audit. Unauthorized destinations and actions are
absent, while the server remains the authoritative enforcement point.

## Risks / Trade-offs

- **[Cross-cutting authorization omission]** → Centralize command metadata and projection builders;
  add deny-by-default contract tests that enumerate every route, permission, field, and output.
- **[Projection cost at 20,000 Employees]** → Reuse normalized indexes after policy filtering,
  cache by data/security revision, bound cache size, and retain virtualization and spatial culling.
- **[Stale permissions in open tabs]** → Increment security revision transactionally, send a refetch
  event, and reject commands evaluated against an obsolete security revision.
- **[Partial Restore or migration]** → Validate detached data, use PostgreSQL transactions and locks,
  create an external recovery backup, and leave the old database active on any failure.
- **[Credential or database material enters Git]** → Generate paths outside the checkout, ignore and
  Docker-ignore secrets/data, reject in-tree paths, scan tracked files/build context/image layers,
  and use ephemeral CI databases.
- **[Bind-mount ownership differs by host]** → A one-shot storage preparation service creates and
  verifies permissions; startup fails with an actionable diagnostic rather than falling back.
- **[Reverse-proxy misconfiguration]** → Validate every request against the configured public origin,
  bind host loopback by default, and document that production HTTPS termination is external.
- **[Release automation publishes an unverified image]** → Stable tags depend on the completed
  Release Please result and passing CI; `latest` never follows `main` directly.
- **[Large one-time product break]** → Preserve the current SQLite family, compare all converted
  business values with production parsers, and retain rollback by stopping PostgreSQL and restoring
  the untouched SQLite backup until the new deployment is accepted.

## Migration Plan

1. Build and verify the PostgreSQL schema, authenticated API, projection engine, client flows, and
   container stack against synthetic data.
2. Stop the owned SQLite runtime and copy every database sidecar to a timestamped external backup.
3. Run an ignored one-time converter that accepts only the immediately preceding exact State,
   writes an empty PostgreSQL target, builds default roles/policies/indexes, and increments the
   organization revision once.
4. Validate source and target with production parsers; compare Employee, Tag, Unit, View, Slot,
   canvas, display, locale, and UI values and record the comparison.
5. Start the normal Compose stack, create the first Super Administrator through the setup token,
   verify restart and authenticated workflows, and retain the SQLite backup outside the repository.
6. Remove the converter and all runtime SQLite/Pages compatibility, complete the OpenSpec lifecycle,
   merge main, then merge the generated `v1.0.0` release PR and verify public GHCR artifacts.

Rollback before acceptance stops the Compose application and database and restarts the preserved
SQLite checkout/database family. After new authorized mutations are accepted, rollback is performed
through an encrypted PostgreSQL backup rather than attempting to merge data back into SQLite.

## Open Questions

None. Product, security, deployment, release, migration, and compatibility decisions are fixed by
the approved plan.
