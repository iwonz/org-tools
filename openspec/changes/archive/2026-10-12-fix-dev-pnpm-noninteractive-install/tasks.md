## 1. Development startup repair

- [x] 1.1 Mark the development application as non-interactive and add focused Compose regression
  coverage without changing the production service.
- [x] 1.2 Document automatic reconciliation of stale disposable dependency volumes in the relevant
  architecture and development guidance.

## 2. Validation and delivery

- [x] 2.1 Re-run `pnpm dev` against the stale volume that reproduced the failure, confirm readiness,
  and run focused tests plus Changed validation, browser smoke, build, public safety, strict OpenSpec
  validation, and diff checks selected for the change.
- [x] 2.2 Sync the delta specification, archive the completed change, validate the archive strictly,
  commit the result, integrate fresh `origin/main`, merge and push `main` without force, remove the
  merged branch, and confirm the expected GitHub workflows started.
