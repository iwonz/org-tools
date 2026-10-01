## 1. Development container permissions

- [x] 1.1 Add the minimal development-only capability needed for Next.js to generate ignored type metadata across host UID ownership boundaries.
- [x] 1.2 Add a regression test that protects the development exception and the unchanged production hardening contract.
- [x] 1.3 Update architecture documentation with the development-only permission boundary.

## 2. Verification and delivery

- [x] 2.1 Run formatting, lint, type checking, unit tests, strict OpenSpec validation, and diff checks.
- [x] 2.2 Prove the real Compose development readiness and Chromium probe complete with a clean generated metadata state.
- [x] 2.3 Run production build, browser tests, publication checks, and production image inspection.
- [x] 2.4 Generate the 56-image gallery twice, compare deterministic hashes, and visually inspect the maintained output.
- [x] 2.5 Synchronize and archive the OpenSpec change, integrate and publish it, then verify clean synchronized refs and no active changes.
