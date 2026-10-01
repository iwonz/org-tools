## MODIFIED Requirements

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
