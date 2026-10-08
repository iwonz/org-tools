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
  a bind-mounted checkout owned by the host user. The toolbox gives Git process-scoped trust only to
  its fixed `/workspace` checkout so UID-separated Linux runners can execute repository-aware checks.
  The production service receives neither development exception.
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
session-bound CSRF token. Login has normalized-email and instance rate buckets with a
generic credential failure. Security changes increment a separate revision and revoke or refresh
affected sessions.

All routes receive a same-origin Content Security Policy, frame denial, no-referrer policy,
capability restrictions, MIME sniffing protection, cross-origin opener/resource isolation, and no
framework signature header. Development adds only the script evaluation required by webpack; the
production policy omits it.

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

Editor image export has a separate Super-Administrator-only access-subject boundary. Its subject
list exposes only active account identity summaries, and its CSRF-protected projection endpoint
builds at most one requested View with the selected account's exact role, direct grants, Employee
relationship, Manager relationships, and ACL. The browser derives a self-contained image source
from that projection without installing it in the session store. Preview, Copy, and Save therefore
share one account and revision while the administrator keeps their own session and transient image
settings. Successful alternate projections append a value-free audit event.

Each account UI document also stores image-content preferences as excluded Tag IDs plus the Hide
Staffing Slots flag. The account projection removes missing or unreadable Tag IDs before the client
hydrates them. Both image dialogs reuse the same preferences, intersect exclusions with the
currently selected access subject's Tag catalog, and pass one immutable settings object through
measurement, Preview, Copy, and Save.

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
OCI metadata, SBOM, and provenance. Release Please creates conventional SemVer releases. Because
GitHub suppresses workflow events created by the repository token, a successful Release Please
release explicitly dispatches the Container workflow at the returned SemVer tag. The dispatch uses
workflow-scoped `actions: write`; repository default token permissions remain read-only.

The authenticated Next.js server image is the only production runtime. The repository has no
static-export application or hosted-site deployment; browser validation always exercises the
PostgreSQL-backed server through its same-origin interface.

## Validation architecture

The TypeScript import graph enforces a directed production architecture. `packages/types` is the
application-independent contract owner. `i18n` and `lib` may depend on shared types; server and
stores are separate peers above foundational logic; components may use stores and foundational
logic; API routes use server, `lib`, `i18n`, and shared types. Cycles and reverse edges fail Fast.
Knip separately checks dead files and dependency reachability.

Fast is a non-networked parallel static/unit profile. Changed maps merge-base, staged, unstaged, and
untracked paths to owned runtime, Core browser, screenshot, migration, audit, and image evidence.
Unknown product paths select all Core domains; validation-infrastructure changes select Full. The
planner is explanatory rather than an authorization boundary.

Ordinary CI runs Fast and the dependency audit, then parallel affected build/runtime, Core browser,
screenshot, and image jobs. Nightly, manual, and Release Please Full Regression partitions all
browser scenarios over four independent Compose/PostgreSQL instances, repeats performance timing,
generates the complete gallery twice, proves migration/restart, and inspects the production image.
The stable aggregate job requires every selected evidence job. CI and Container builds use separate
bounded BuildKit write scopes. See `docs/validation.md` for commands and timing methodology.

The package manager's moderate-or-higher advisory audit runs in CI, Full, and Changed when dependency
inputs change. It does not run in every Fast invocation and never enters the standalone runtime.

The audit wrapper currently recognizes one exact, unpatched, development-only OpenSpec dependency
path for `GHSA-vfj7-8cjw-p6xm`. Its code and tests reject production paths, path drift, a published
patched version, and dates on or after 2026-11-05, forcing an explicit upgrade or review instead of
silently suppressing future findings.
