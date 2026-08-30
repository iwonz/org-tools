## 1. Reproduce and diagnose

- [x] 1.1 Reproduce the reported React render-phase update in the development runtime and capture the first actionable application stack frame.
- [x] 1.2 Audit render paths, computed values, reactions, and store access around the failing scenario for equivalent state mutations.

## 2. Runtime correction

- [x] 2.1 Move the invalid mutation to an explicit action, event boundary, hydration step, or post-commit effect without changing state semantics.
- [x] 2.2 Add focused regression coverage for the corrected state/render ownership boundary.

## 3. Browser diagnostic enforcement

- [x] 3.1 Add a shared bounded collector for console warnings/errors, uncaught page errors, failed application requests, and failing same-origin resources.
- [x] 3.2 Apply strict diagnostic assertions to the development probe and both production browser runtimes.
- [x] 3.3 Exercise every maintained workflow, theme, locale, menu, dialog, Import/Export path, and representative organization mutation without unexpected diagnostics.

## 4. Documentation and delivery validation

- [x] 4.1 Update browser-testing and contributor documentation with the console-clean invariant and actionable failure policy.
- [x] 4.2 Run format, lint, typecheck, unit, development probe, both builds, both browser suites, screenshot generation and review, deterministic screenshot verification, public check, strict OpenSpec validation, and diff check.
- [x] 4.3 Synchronize the canonical specification and archive the completed OpenSpec change with no active changes remaining.
