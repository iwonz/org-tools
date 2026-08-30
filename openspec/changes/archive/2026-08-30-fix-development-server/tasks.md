## 1. Reliable development startup

- [x] 1.1 Make the documented SQLite development command use explicit webpack on loopback and
  exclude the reserved `.org-tools` runtime and `.playwright-cli` diagnostic directories from
  module watching, and warm its routes before presenting the workspace as ready.
- [x] 1.2 Extend the isolated development probe to validate the root-to-project browser navigation,
  interactive shell, Editor canvas, API response, bounded diagnostics, and complete cleanup.

## 2. Documentation and verification

- [x] 2.1 Update development documentation to describe the compiler choice, Chromium-backed probe,
  and actionable prerequisites without changing product or workspace behavior.
- [x] 2.2 Verify the failing Turbopack first-load case is replaced by a successful clean `pnpm dev`
  browser load and that failure paths remain explicit.

## 3. Validation and delivery

- [x] 3.1 Run format, lint, typecheck, unit, dev check, both builds, both browser suites, deterministic
  screenshot verification, Pages/public checks, strict OpenSpec validation, and diff checks.
- [x] 3.2 Synchronize and archive the change, commit it meaningfully, fast-forward into `main`, push
  GitHub, publish Pages, verify the deployed browser application, and remove the merged branch.
