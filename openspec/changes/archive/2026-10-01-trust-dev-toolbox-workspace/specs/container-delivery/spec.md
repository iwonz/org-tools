## ADDED Requirements

### Requirement: Development toolbox Git trust is scoped to its checkout

The development Compose toolbox SHALL allow Git-backed validation against its bind-mounted checkout
when the container and host UIDs differ. It SHALL trust only the fixed `/workspace` repository path
through process-scoped configuration and SHALL NOT write a global Git configuration, trust arbitrary
directories, or change the production application environment.

#### Scenario: Validate a runner-owned checkout

- **WHEN** a root toolbox command invokes Git against `/workspace` owned by the Linux runner UID
- **THEN** Git enumerates the repository and publication validation proceeds without a dubious-ownership error

#### Scenario: Start the production application

- **WHEN** Compose starts without the development override
- **THEN** the web process receives no development Git trust configuration
