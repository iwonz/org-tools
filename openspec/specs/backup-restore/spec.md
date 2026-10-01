# backup-restore Specification

## Purpose
TBD - created by archiving change enterprise-auth-access-control. Update Purpose after archive.
## Requirements
### Requirement: Complete Backup is encrypted and reauthenticated
An account with Backup-create permission SHALL re-enter its current password before the server
serializes organization, accounts, password hashes, roles, grants, policies, UI states, and audit.
Sessions, CSRF values, setup token, and rate-limit state SHALL be excluded. The compressed payload
SHALL be encrypted with AES-256-GCM using a per-backup Argon2id passphrase key and an authenticated
current-format header.

#### Scenario: Create a valid Backup
- **WHEN** an authorized account supplies its current password and a compliant Backup passphrase
- **THEN** the server returns one encrypted artifact without persisting the passphrase or plaintext payload

#### Scenario: Fail reauthentication
- **WHEN** the current account password is incorrect
- **THEN** no Backup is produced and the attempt is audited without secret values

### Requirement: Restore validates a detached complete candidate
An account with Restore permission SHALL reauthenticate and provide the Backup passphrase. The server
SHALL authenticate, decrypt, decompress, and strictly parse the complete candidate outside live
state, validate every reference and at least one active Super Administrator, and reject obsolete or
unknown formats without changing current data.

#### Scenario: Reject a modified Backup
- **WHEN** any authenticated header or ciphertext byte has changed
- **THEN** Restore reports a bounded error and leaves database and sessions unchanged

#### Scenario: Reject an unsafe candidate
- **WHEN** a decrypted candidate has an invalid graph or no active Super Administrator
- **THEN** Restore is rejected before maintenance lock or replacement

### Requirement: Restore replaces data atomically with recovery protection
Before replacement, Restore SHALL obtain a maintenance lock and write a timestamped encrypted recovery
Backup of current restorable data to the configured external backup directory. It SHALL replace all
restorable tables in one transaction. Failure SHALL preserve current data and sessions; success SHALL
revoke every session and require login.

#### Scenario: Complete Restore
- **WHEN** candidate validation, recovery Backup, and transactional replacement all succeed
- **THEN** restored data becomes current and every existing session is unusable

#### Scenario: Fail during replacement
- **WHEN** recovery writing or any database replacement step fails
- **THEN** the original database remains current and no existing session is revoked

### Requirement: User exports remain distinct from Backup
Data Download and Editor Image Export SHALL require their independent permissions and SHALL operate
only on the account's authorized projection. They SHALL NOT include accounts, roles, policies,
password hashes, audit, or hidden organization values.

#### Scenario: Download permitted organization data
- **WHEN** an account with Data Download permission exports selected records
- **THEN** output retains existing format behavior using only values visible to that account

