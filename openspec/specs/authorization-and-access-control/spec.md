# authorization-and-access-control Specification

## Purpose
Define server-enforced roles, additive permission grants, Manager scopes, resource policies,
least-data authorized projections, and Super Administrator invariants.
## Requirements
### Requirement: Effective access combines one role and additive direct grants
Every account SHALL have exactly one role and MAY have direct grants. A grant SHALL contain one
registered permission and a scope allowed by that permission. Direct grants SHALL only add access.
The immutable Super Administrator role SHALL bypass permission and resource-policy evaluation, and
the last active Super Administrator SHALL NOT be disabled, demoted, or made unlinked by an invalid
transition.

#### Scenario: Evaluate a custom account
- **WHEN** an account has a role grant and an additional direct grant
- **THEN** its effective permission set is their union with invalid scopes excluded by validation

#### Scenario: Protect the final administrator
- **WHEN** a command would remove the last active Super Administrator
- **THEN** the complete command is rejected and an audit event records the denial

### Requirement: Permissions cover all protected product mutations
The permission registry SHALL separately represent Employee read/create/update/delete/assignment
and model update; Tag create/update/delete/assignment; Unit read/create/update/delete/reparent/boss;
system Editor read/layout; custom View read/create/update/delete; Staffing Slot create/update/delete;
Calendar read; Data Download; Editor Image Export; Backup create; and Backup restore. Global
catalog, Backup, Employee create/delete, model, and View-create permissions SHALL accept only `all`.
Editor-system read, custom View read/update/delete, Calendar read, Data Download, and Editor Image
Export SHALL also accept only `all`, because their records are already reduced by scoped Employee,
Unit, and resource access before those surfaces consume them.
User, role, access-administration, and audit management SHALL remain Super-Administrator-only.

#### Scenario: Reject an invalid scoped grant
- **WHEN** a role or direct grant assigns a relationship scope to a global-only permission
- **THEN** the grant is rejected atomically

### Requirement: Manager scope follows only system-View leadership
`managedDirect` and `managedSubtree` SHALL derive from boss assignments in the system View and SHALL
be intersected with the account's granted permissions. A boss assignment SHALL NOT change the
account role. Branch mutations SHALL authorize every source and destination against the graph before
the mutation, deduplicating overlapping branches.

#### Scenario: Manager has no managed Unit
- **WHEN** an account with the Manager role manages no system Unit
- **THEN** its Manager-scoped mutations are denied while its read access remains available

#### Scenario: Reparent a branch safely
- **WHEN** a Manager attempts to reparent a Unit whose source or destination lies outside the managed subtree
- **THEN** the entire reparent command is rejected without changing structure or scope

### Requirement: Resource policies constrain fields and resources
Built-in and custom Employee fields, Tags, Units, Staffing Slots, and custom Views SHALL have
validated read and write audiences composed of authenticated access, roles, accounts, and relationship
clauses. Permission and policy SHALL both allow a non-Super-Administrator operation. Unit policies
SHALL inherit to descendants, descendants SHALL NOT widen their parent, and Staffing Slots SHALL
inherit and MAY narrow their Unit policy.

#### Scenario: Narrow an inherited Unit policy
- **WHEN** an authorized Unit editor saves a child policy contained by its parent policy
- **THEN** the child and its inherited resources use the narrower audience

#### Scenario: Attempt to widen a child
- **WHEN** a submitted child or Staffing Slot policy includes an audience outside its inherited parent
- **THEN** the policy update is rejected and no access changes

### Requirement: Defaults are safe and deterministic
Built-in Employee fields and existing Tags SHALL initially be readable by authenticated users.
Existing custom fields and custom Views SHALL initially be Super-Administrator-only. Existing Units
SHALL initially be readable by authenticated users and writable through an effective Manager
relationship. New Unit and Slot policies SHALL inherit their parent; new custom Views SHALL initially
include their creator and Super Administrators.

#### Scenario: Convert existing organization access
- **WHEN** the immediately preceding organization is converted
- **THEN** every field, Tag, Unit, Slot, and View receives exactly the documented default policy

### Requirement: Restrictive Tags can hide Employees without hiding self
The application SHALL support `hideEmployeesWhenUnread` on a Tag policy. If an account cannot read any such assigned Tag,
the tagged Employee SHALL be absent from that account's projection. The account's own Employee SHALL
remain present while the unread Tag and other unread fields are omitted.

#### Scenario: View another restricted Employee
- **WHEN** an Employee has an unread restrictive Tag and is not the current account's Employee
- **THEN** the Employee, assignments, counts, search results, events, and output records are absent

#### Scenario: View self with a restricted Tag
- **WHEN** the current account's Employee has an unread restrictive Tag
- **THEN** the self card remains while the Tag and its derived values are absent

### Requirement: Authorized projections contain no inaccessible information
The server SHALL apply access before building API objects, search indexes, filters, counts, Calendar
events, Editor geometry, accessible names, Data Download, or PNG input. Inaccessible properties SHALL
be omitted rather than set to null. Template values MAY use complete server data but SHALL expose
only their rendered authorized result. Unknown and inaccessible identifiers SHALL use
non-enumerating responses.

#### Scenario: Request an inaccessible resource directly
- **WHEN** an account requests a guessed inaccessible identifier through any route or command
- **THEN** the response does not reveal whether the identifier exists and no hidden value enters logs or payloads

#### Scenario: Render an authorized image
- **WHEN** an account exports an Editor image
- **THEN** layout and drawing receive only visible Units, Employees, Slots, fields, Tags, counts, and labels

### Requirement: Administration exposes users, roles, access, and audit safely
Only a Super Administrator SHALL see or use Administration. Users SHALL support creation, linking,
role assignment, direct grants, temporary reset, session revoke, deactivation, promotion, and
demotion. Roles SHALL expose valid grants and effective access through localized user-facing
permission and scope labels while retaining exact internal identifiers. Access SHALL edit supported
resource policies. Audit SHALL provide indexed filters and bounded pagination without secret values.

#### Scenario: Ordinary account opens Administration
- **WHEN** a non-Super-Administrator navigates to or directly calls an Administration route
- **THEN** no Administration metadata or organization security data is returned

#### Scenario: Update a resource policy
- **WHEN** an authorized resource editor saves a policy within its inherited boundary
- **THEN** the policy, security revision, affected projections, sessions, and audit update atomically

#### Scenario: Submit a localized grant
- **WHEN** a Super Administrator selects localized permission and scope labels and saves a role or direct grant
- **THEN** the server receives and validates the unchanged `Permission` and `PermissionScope` identifiers

### Requirement: Alternate image-export access is reserved to Super Administrator
The permission registry SHALL contain a global `editorImageExport.exportAs` permission. The
immutable Super Administrator bypass SHALL satisfy it, while role grants, direct grants,
Administration commands, Backup input, and PostgreSQL constraints MUST reject storing that
permission for any account or role.

#### Scenario: Super Administrator requests another account's export projection
- **WHEN** a Super Administrator with image-export access selects an active account
- **THEN** the server authorizes an export-only projection using the selected account's exact role, direct grants, Employee relation, Manager relations, and resource policies

#### Scenario: Attempt to grant export-as
- **WHEN** an Administration or Restore request includes `editorImageExport.exportAs` in a role or direct grant
- **THEN** the complete request is rejected without changing access data

### Requirement: Export subjects are active accounts
The export-as API SHALL accept only an active real account as its access subject. Unknown,
disabled, and inaccessible subject identifiers MUST return the same unavailable-resource response,
and the target's own image-export permission MUST NOT affect the acting Super Administrator's
export.

#### Scenario: Select a disabled or guessed account
- **WHEN** the actor submits a disabled or unknown account ID
- **THEN** the response does not distinguish the cases and no projection is returned

#### Scenario: Select a viewer without export permission
- **WHEN** the acting Super Administrator selects an active viewer who cannot independently export images
- **THEN** the output uses that viewer's read model while the action remains authorized and attributed to the Super Administrator

### Requirement: Administration grants have deterministic order
Administration account and role read models SHALL return permission grants ordered by permission and scope so equivalent PostgreSQL contents produce the same API and visual presentation across clean instances.

#### Scenario: Equivalent grant sets from clean databases
- **WHEN** two clean instances contain the same role or account grant set
- **THEN** their Administration responses and rendered grant order are identical
