## ADDED Requirements

### Requirement: Alternate export projection is minimal and audited
The server SHALL return only active-subject summaries and a requested View's authorized image input
through same-origin no-store endpoints. Projection creation MUST require the acting session,
image-export permission, reserved export-as permission, JSON content type, CSRF, exact Origin, and
Fetch Metadata protections, and MUST record a value-free audit event.

#### Scenario: Inspect an alternate export response
- **WHEN** a Super Administrator requests another account's projection
- **THEN** the payload omits hidden fields, Tags, Employees, Units, Slots, Canvas attachments, target UI state, grants, policies, sessions, and administrative records

#### Scenario: Call the endpoint without reserved access
- **WHEN** a non-Super-Administrator or invalid mutation request calls either export-as endpoint
- **THEN** the server returns the standard protected-resource response and records the denial without hidden values

#### Scenario: Record a successful projection
- **WHEN** the server constructs an alternate projection
- **THEN** audit identifies the actor, subject, View, and optional root Unit while the current session remains unchanged
