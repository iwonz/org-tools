## 1. Compose isolation

- [x] 1.1 Add project-scoped Next.js output and dependency volumes only to the development app service.
- [x] 1.2 Verify fresh ephemeral PostgreSQL startup and two concurrent Compose projects without lock collisions.
- [x] 1.3 Keep post-start host path validation compatible with the non-root Backup directory.

## 2. Validation and delivery

- [x] 2.1 Run format, lint, typecheck, unit tests, development probe, build, public safety, strict OpenSpec validation, and `git diff --check`.
- [x] 2.2 Synchronize and archive the change, integrate it into `main`, update the release PR, and confirm CI.
