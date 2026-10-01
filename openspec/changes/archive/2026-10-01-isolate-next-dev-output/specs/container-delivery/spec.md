## ADDED Requirements

### Requirement: Development runtime output is isolated per Compose project
The development app service SHALL store its Next.js output and dependencies in disposable
Compose-project-scoped volumes rather than sharing writable runtime directories with the toolbox.
The toolbox SHALL retain separate checkout build output for production validation. Development
runtime output SHALL NOT contain durable organization data and SHALL NOT be used as PostgreSQL or
Backup storage.

#### Scenario: Run concurrent development projects
- **WHEN** two Compose projects use the same checkout or a toolbox install/build runs beside the development app
- **THEN** each development server owns its lock, dependencies, and output without restarting or corrupting the other process

#### Scenario: Remove development resources
- **WHEN** the supported teardown runs with volume removal
- **THEN** the disposable Next.js output is removed while external PostgreSQL and Backup paths remain intact

#### Scenario: Validate the Backup bind after startup
- **WHEN** the preparation service has assigned the Backup directory to the non-root runtime user
- **THEN** the host wrapper can traverse and canonicalize the configured directory without listing or reading mode-0600 Backup files
