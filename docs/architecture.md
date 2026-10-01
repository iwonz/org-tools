# Architecture

Org Tools is one Next.js standalone application backed by PostgreSQL.

- `apps/ui` owns UI, same-origin API routes, authentication, authorization, persistence, and SQL
  migrations.
- `packages/types` owns exact organization, UI, account, role, permission, ACL, projection, and
  command contracts.
- `packages/screenshots` owns authenticated production browser tests and the deterministic gallery.
- `compose.yaml` runs PostgreSQL, the owner-credential migration job, backup directory preparation,
  and the restricted non-root web image. `compose.dev.yaml` adds hot reload and a toolbox. The app's
  Next.js output and dependencies use disposable project-scoped volumes so its development lock and
  loaders cannot collide with toolbox installs/builds or another Compose project; toolbox production
  output remains in the checkout for validation. The development app retains the base drop-all
  capability policy and adds back only `DAC_OVERRIDE` so Next.js can create ignored type metadata in
  a bind-mounted checkout owned by the host user. The production service receives no added capability.
- Browser validation reaches Compose services through a local loopback proxy. The proxy owns normal
  HTTP sockets and both ends of upgraded HMR connections, so success and failure cleanup release the
  listening handle deterministically instead of leaving CI processes alive.

## Persistence and concurrency

The organization document remains JSONB because Editor operations replace connected structures
atomically. Accounts, roles, grants, sessions, policies, Employee identity, audit, rate limits, UI
state, and server events are normalized tables. Employee identities are updated in the same
transaction as the organization document.

Numbered SQL migrations carry checksums and run under a PostgreSQL advisory lock. The web process
checks schema readiness but never migrates. Organization commands lock the singleton document with
`SELECT … FOR UPDATE`, require expected organization and security revisions, and publish a bounded
server event after commit. Revision conflicts return the current revisions and make the client
refetch. Per-account UI writes never serialize organization data.

## Authentication

The first account is created once using `ORG_TOOLS_SETUP_TOKEN`. Passwords use Argon2id with an
individual salt (`64 MiB`, `t=3`, `p=1`). Sessions use random 256-bit opaque tokens; PostgreSQL
stores only SHA-256 digests. Idle expiry is eight hours and absolute expiry is 24 hours. Production
uses `__Host-id` with Secure, HttpOnly, SameSite=Strict and Path=/; localhost development uses a
non-Secure development cookie.

Mutations require JSON, exact configured Origin, `Sec-Fetch-Site: same-origin`, and a
session-bound rotating CSRF token. Login has normalized-email and instance rate buckets with a
generic credential failure. Security changes increment a separate revision and revoke or refresh
affected sessions.

## Authorization and projection

An account has one role plus additive direct grants. Grants pair a permission with `self`,
`managedDirect`, `managedSubtree`, or `all`; the registry rejects invalid combinations. Super
Administrator bypass is server-only. Manager relationships derive only from boss assignments in
the system View and are checked against the pre-mutation tree.

Resource policies provide read and write audiences for Employee fields, Tags, Units, staffing
slots, and Views. Unit policy inheritance may narrow a parent but cannot widen it. A restrictive
unreadable Tag removes tagged Employees, except the user's own card remains with hidden data
removed. Custom fields and custom Views are closed by default; existing built-ins, Tags, system
View, Units, and staffing slots start authenticated unless narrowed.

The projection engine filters the organization before serialization and uses a bounded cache keyed
by organization revision, security revision, and account. IDs and values that are unavailable are
absent from objects, arrays, search inputs, counts, Calendar, Data Download, and PNG sources.
Template fields are resolved on the server from the complete document; hidden inputs and template
source are not exposed unless the account may edit the model.

The client hydrates a strict local store from this projection. Non-Super-Administrator writes use
`organization.patch`: the server parses a full projected candidate, restores hidden source values,
then applies permission and ACL checks. Super Administrator replacement follows the same parser and
revision transaction.

## Event flow

`GET /api/session` returns account, effective grants, authorized projection, per-account UI, CSRF,
and revisions. `/api/commands` handles typed document commands, `/api/ui` handles UI state, and
`/api/events` sends revision-only SSE notifications. The browser refetches the authorized
projection after organization or security events. There is no `BroadcastChannel`, browser
organization persistence, or shared `/api/state`.

## Backup and delivery

Backup snapshots organization and security tables except sessions, CSRF, setup token, and rate
limits. JSON is validated, gzip compressed, and encrypted with AES-256-GCM using an Argon2id key.
Restore validates a detached graph, takes an exclusive maintenance lock, writes an external
encrypted recovery backup, replaces all data in one transaction, and revokes sessions.

The production image uses Next standalone output, bundled assets, a read-only root filesystem,
dropped Linux capabilities, and UID/GID `10001:10001`. GHCR publishes amd64 and arm64 manifests,
OCI metadata, SBOM, and provenance. Release Please creates conventional SemVer releases.
