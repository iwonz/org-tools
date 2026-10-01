## REMOVED Requirements

### Requirement: Organization data remains local
**Reason**: The loopback/browser-only trust boundary is replaced by a self-hosted authenticated server.
**Migration**: Keep data inside the operator's server, PostgreSQL, browser session, explicit encrypted Backup, and permission-filtered output without third-party transfer.

### Requirement: Employee transfer candidates remain local and transient
**Reason**: Employee Import is removed.
**Migration**: No candidate or mapping data exists; ordinary forms remain transient until an authorized command succeeds.

### Requirement: Public browser workspace cannot upload organization data
**Reason**: The public Pages workspace is removed.
**Migration**: The public artifact is a container image whose runtime talks only to its configured self-hosted PostgreSQL and same-origin clients.

### Requirement: Employee Import definitions remain transient until Apply
**Reason**: Employee Import is removed.
**Migration**: Custom field definitions are created only through authorized model commands.

## ADDED Requirements

### Requirement: Organization data stays within the self-hosted trust boundary
Organization, authentication, access, audit, Backup, search, and export data SHALL travel only among
the user's browser, the same-origin Org Tools server, its configured PostgreSQL database, and explicit
operator-controlled files. Runtime code SHALL NOT send it to telemetry, remote logging, remote
synchronization, remote avatar, analytics, or third-party storage services.

#### Scenario: Use the complete product
- **WHEN** users authenticate, edit, search, filter, render, download, back up, or restore data
- **THEN** no organization or credential value is sent to a third-party network destination

### Requirement: Least-data delivery is a privacy boundary
The server SHALL omit every inaccessible field, resource, relationship, count, option, event, label,
and derived value before responding. Errors, logs, audit, server events, and timing-sensitive
identifier responses SHALL not reveal the existence or value of inaccessible data.

#### Scenario: Compare UI and direct API access
- **WHEN** an account lacks access to a value
- **THEN** the value is absent from both rendered surfaces and direct network responses rather than merely hidden by CSS or client logic

