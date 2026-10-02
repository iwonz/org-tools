# authentication-and-sessions Specification

## Purpose
Define first-account setup, Employee-linked account identity, password policy, bounded sessions,
request-forgery protection, rate limiting, and local administrator recovery.
## Requirements
### Requirement: Initial setup creates the first Super Administrator once
An installation with no accounts SHALL expose only the setup workflow. Setup SHALL require the
configured token, a valid unique email, and a valid password, SHALL create an active Super
Administrator atomically, and SHALL become unavailable after the first account exists. The token
MUST NOT appear in a URL, response, audit value, or log.

#### Scenario: Complete initial setup
- **WHEN** the database has no account and a user submits the matching setup token and valid credentials
- **THEN** exactly one active Super Administrator is created and the setup endpoint is disabled

#### Scenario: Reject later setup
- **WHEN** any account already exists and a caller submits the setup endpoint
- **THEN** the request reveals no setup state and creates no account

### Requirement: Accounts use unique Employee-linked email identities
Account email SHALL be normalized by trim, NFKC, and locale-independent case folding. Every active
non-Super-Administrator account SHALL link to exactly one Employee with that unique normalized
email, and an Employee SHALL link to at most one account. Only a Super Administrator MAY remain
unlinked. Linked Employee email changes SHALL use one reauthenticated Administration transaction,
and linked Employees SHALL NOT be deleted.

#### Scenario: Create a linked account
- **WHEN** a Super Administrator creates an account for an unlinked Employee with a unique email
- **THEN** the account stores the stable Employee link and receives a generated temporary password

#### Scenario: Prevent identity divergence
- **WHEN** an ordinary Employee edit, import, or delete would change a linked identity
- **THEN** the operation is rejected without changing the Employee or account

### Requirement: Password lifecycle uses bounded Argon2id credentials
Passwords SHALL contain 15 through 128 Unicode code points and SHALL be stored with a unique salt
using Argon2id at 64 MiB memory, three iterations, and parallelism one. Encoded parameters SHALL be
retained and upgraded after a successful login when policy increases. Temporary passwords SHALL
require replacement before the product is available. Login errors SHALL NOT distinguish unknown
accounts from incorrect passwords.

#### Scenario: Use a temporary password
- **WHEN** a newly created or reset account signs in with its temporary password
- **THEN** only the password-change workflow is available until a compliant new password is stored

#### Scenario: Reject an invalid password
- **WHEN** setup, reset, or password change receives a password outside the length bounds
- **THEN** no credential or session changes and a localized validation error is returned

### Requirement: Server sessions are opaque, bounded, and revocable
Authentication SHALL issue a cryptographically random 256-bit opaque token and persist only its
SHA-256 digest. Sessions SHALL expire after eight idle hours or twenty-four absolute hours and SHALL
be revoked on deactivation, administrative reset, successful Restore, or an explicit revoke action.
Production cookies SHALL be Secure, HttpOnly, SameSite Strict, host-only, and rooted at `/`.

#### Scenario: Resume a valid session
- **WHEN** a request presents a nonexpired session cookie
- **THEN** the server authenticates the associated active account without exposing the token to JavaScript

#### Scenario: Use a revoked session
- **WHEN** a request presents a revoked, expired, unknown, or deactivated-account session
- **THEN** no organization data is returned and the client enters Login

### Requirement: State-changing requests resist forgery and guessing
Every state-changing request SHALL require JSON, the session-bound CSRF token, exact configured
origin, and acceptable Fetch Metadata. CORS SHALL remain disabled. Setup and login SHALL use bounded
identifier and installation failure buckets and constant-shape errors. Security secrets MUST NOT be
written to audit or operational logs.

#### Scenario: Reject a forged command
- **WHEN** an authenticated command lacks a valid CSRF token or exact origin evidence
- **THEN** the server rejects it before authorization or mutation

#### Scenario: Bound repeated login failures
- **WHEN** repeated incorrect credentials exceed either configured bucket
- **THEN** further attempts are temporarily rate-limited without revealing account existence

### Requirement: Administrative recovery is local and audited
A local interactive command SHALL reset an active Super Administrator password through PostgreSQL,
require a TTY, revoke that account's sessions, require password replacement, and append an audit
event. It SHALL NOT print stored hashes, session values, or database credentials.

#### Scenario: Recover a Super Administrator
- **WHEN** an operator runs the recovery command in a TTY and identifies an active Super Administrator
- **THEN** a new temporary password is shown once and all prior sessions become unusable
