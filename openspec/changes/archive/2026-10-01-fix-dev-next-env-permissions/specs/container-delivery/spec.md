## ADDED Requirements

### Requirement: Development metadata generation uses a constrained permission exception

The development Compose app SHALL be able to create framework-generated, ignored type metadata in a
bind-mounted checkout owned by a different host UID. It SHALL retain the base service's drop-all
capability policy and add back only the filesystem ownership bypass required for that development
write. The production Compose app SHALL remain non-root, read-only, and without added capabilities.

#### Scenario: Start development on a Linux runner

- **WHEN** the checkout is owned by the runner user and the development app starts in Docker Compose
- **THEN** Next.js generates its ignored type metadata, the readiness endpoint succeeds, and the Chromium probe completes

#### Scenario: Start the production Compose application

- **WHEN** Compose starts without the development override
- **THEN** the application runs as its non-root runtime user with a read-only root filesystem and no added Linux capability
