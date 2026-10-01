## 1. Permission and database contract

- [x] 1.1 Add the reserved export-as permission, exhaustive localized label mapping, assignable-permission filtering, and server validation tests.
- [x] 1.2 Add and verify the forward-only PostgreSQL migration for the permission domain and unassignable grant constraint.

## 2. Export-subject server boundary

- [x] 2.1 Add strict public request/response types and the active export-subject listing endpoint.
- [x] 2.2 Add the CSRF-protected alternate projection endpoint with exact target access, View scoping, unavailable-resource behavior, and audit events.
- [x] 2.3 Cover role, direct-grant, relation, ACL, inactive-ID, minimal-payload, revision, and audit behavior with server tests.

## 3. Isolated export source

- [x] 3.1 Extract reusable authorized-projection hydration and implement one derived Editor image-export source for current and alternate projections.
- [x] 3.2 Thread context-local resolved Template values through custom-field and Employee-display evaluation without replacing the active session cache.
- [x] 3.3 Test filtered Live Units, summaries, Tags, Staffing Slots, Canvas attachments, format tokens, and distribution intersection.

## 4. Image-export interface

- [x] 4.1 Add the shared searchable Export-as selector/controller with self default, bounded revision cache, cancellation, and localized states.
- [x] 4.2 Integrate the selected source into full-View and scoped Unit Preview, Copy, and Save while leaving JSON and Template export unchanged.
- [x] 4.3 Add browser coverage for Super Administrator visibility, ordinary-user denial, reset, unavailable resources, session isolation, both PNG surfaces, locales, and RTL.

## 5. Documentation and screenshots

- [x] 5.1 Update architecture, privacy, performance, usage, screenshot documentation, and all six message catalogs.
- [x] 5.2 Update the maintained Editor image-export frame while preserving the 56-PNG gallery contract and visually inspect changed output.

## 6. Validation and delivery

- [x] 6.1 Run formatting, lint, typecheck, unit tests, development check, production build, browser tests, public check, strict OpenSpec validation, and diff checks through Docker Compose.
- [x] 6.2 Apply migration `0003` to the configured PostgreSQL instance, prove schema readiness and restart, and inspect the production image for data or credential leaks.
- [x] 6.3 Generate the 56-PNG gallery twice, compare SHA-256 hashes, and inspect every frame.
- [x] 6.4 Sync and archive the OpenSpec change, integrate fresh origin/main, push main, verify release and GHCR state, remove the change branch, and confirm clean matching refs.
