## MODIFIED Requirements

### Requirement: Navigation reflects account access
The responsive sidebar SHALL preserve its compact and expanded geometry and current workflow order,
remove State Import/Export, and add an account menu. Administration SHALL appear only for a Super
Administrator inside that account menu and SHALL NOT occupy a product-navigation item. Workflow
actions SHALL render only when their command is permitted. Editor SHALL retain its full-height
canvas behavior. The sidebar footer SHALL order account, theme, and language controls from top to
bottom.

#### Scenario: Render an Employee account
- **WHEN** an authenticated Employee opens the shell
- **THEN** only readable destinations and permitted actions appear and Administration is absent from both product navigation and the account menu

#### Scenario: Render a Super Administrator
- **WHEN** a Super Administrator opens the account menu
- **THEN** a localized Administration action opens Users, Roles, Access, Audit, and Backup without adding Administration to product navigation

#### Scenario: Restore an inaccessible Administration tab
- **WHEN** an account without Super Administrator access restores `administration` as its active UI tab
- **THEN** the shell selects the first readable product destination and does not request Administration data

## ADDED Requirements

### Requirement: Administration and authentication surfaces use consistent alignment
Administration SHALL align its icon-bearing tab list to logical start while preserving horizontal
overflow. The account password dialog SHALL use standard horizontal body padding. Login and Setup
SHALL center their icon, title, and description while preserving logical-start field and error
alignment.

#### Scenario: Open Administration in LTR and RTL
- **WHEN** a Super Administrator opens Administration in an LTR or RTL locale
- **THEN** the tabs align to logical start, show a thematic leading icon, and remain horizontally reachable at narrow widths

#### Scenario: Change the current password
- **WHEN** an account opens the password dialog on desktop or mobile
- **THEN** every field has the standard dialog body inset and remains keyboard accessible

#### Scenario: Open Login or Setup
- **WHEN** an unauthenticated installation renders Login or Setup
- **THEN** the heading group is centered while labels, inputs, errors, and entered values remain aligned to logical start
