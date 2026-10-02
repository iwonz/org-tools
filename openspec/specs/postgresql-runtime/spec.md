# postgresql-runtime Specification

## Purpose
Define PostgreSQL persistence, checked migrations, application and owner role separation,
revisioned transactions, readiness, and normalized security records.
## Requirements
### Requirement: PostgreSQL stores organization and normalized security state
The server SHALL persist one validated organization JSONB document with organization and security
revisions, plus normalized Employee identities, accounts, roles, grants, policies, sessions,
per-account UI state, rate buckets, audit events, and migration checksums. The browser SHALL NOT
connect to PostgreSQL or receive the complete document.

#### Scenario: Restart the server
- **WHEN** the PostgreSQL and application containers restart normally
- **THEN** organization, account, access, audit, and per-account UI data reopen without browser persistence

### Requirement: Schema migrations are explicit, checked, and exclusive
Numbered SQL migrations SHALL have recorded SHA-256 checksums and SHALL be applied by a dedicated
migration command under a PostgreSQL advisory lock. The application process SHALL NOT apply DDL and
SHALL refuse startup for pending, missing, reordered, or changed applied migrations.

#### Scenario: Initialize an empty database
- **WHEN** the migration job connects to an empty supported PostgreSQL database
- **THEN** it creates the exact schema, application role grants, and checksum records before app readiness

#### Scenario: Detect a changed migration
- **WHEN** an applied migration file no longer matches its stored checksum
- **THEN** migration and application startup fail without modifying schema or data

### Requirement: Organization commands use optimistic transactional revisions
Every organization mutation SHALL lock the singleton document row, require the expected organization
and security revisions, validate the complete result, update the Employee identity index and related
security records, and commit atomically. A mismatch or validation failure SHALL make no change unless
the candidate is already the current business document or a Super Administrator request proves with
a canonical SHA-256 business-document hash that the locked document is still its committed baseline.
Timestamp-only differences and JSON object key order MUST NOT create a false conflict. A real
concurrent business or security change MUST still conflict.

#### Scenario: Race two mutations
- **WHEN** two clients submit different commands using the same revision and the second client's committed business document no longer matches the locked document
- **THEN** one may commit and the other receives the current revision without a partial mutation

#### Scenario: Retry an equivalent cross-tab write
- **WHEN** a stale command matches the current business document apart from update timestamps or proves the same canonical committed baseline
- **THEN** the server returns or commits the validated result without overwriting a different concurrent business change

### Requirement: Clients converge through authorized events
The server SHALL publish account-specific authorized patches or refetch instructions after commits.
Security changes SHALL increment the security revision, invalidate bounded projection caches, and
prevent reuse of events or projections produced for another account or revision. An interrupted event
stream SHALL cancel its timer and close at most once.

#### Scenario: Revoke visibility in another tab
- **WHEN** an administrator narrows access while an affected account has an open session
- **THEN** the open client drops stale data through refetch or logout before another mutation can use it

#### Scenario: Abort an event stream
- **WHEN** the browser cancels an event stream while its asynchronous poll is completing
- **THEN** the server stops polling without a duplicate close or unhandled runtime error

### Requirement: Audit events are complete and secret-safe
The server SHALL append audit events for authentication outcomes, denied access, organization
commands, security changes, Backup, Restore, and recovery with actor, time, action, target
identifiers, result, and correlation ID.
Passwords, hashes, cookies, session tokens, CSRF values, setup tokens, hidden field values, and Backup
passphrases MUST NOT be recorded.

#### Scenario: Audit a denied command
- **WHEN** an authenticated account submits a known command without effective access
- **THEN** the denial is recorded without the protected data or request secrets
