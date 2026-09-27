## 1. Exact contracts and persistence

- [x] 1.1 Remove every public Analytics type, exact organization/UI State field, active-tab value, default, parser, and graph validation path.
- [x] 1.2 Remove Analytics store observability, load/capture/save/reconciliation operations, and View/custom-field deletion guards while preserving remaining dependencies.
- [x] 1.3 Update State fixtures, transfer coverage, BroadcastChannel coverage, and strict rejection tests for the new exact shape.

## 2. Product and runtime removal

- [x] 2.1 Remove the Analytics navigation destination, shell content, components, styles, and all Analytics-only localization keys from six catalogs.
- [x] 2.2 Delete the Analytics Worker, client, query engine, caches, chart/render/export libraries, and their unit and browser tests.
- [x] 2.3 Remove `recharts`, `react-is`, and `html-to-image`, update the lockfile, and verify remaining source and bundles contain no product Analytics code.

## 3. Documentation and gallery

- [x] 3.1 Update README, architecture, usage, performance, privacy, screenshots, and public-safety guidance for five product surfaces without weakening the generic no-analytics-SDK guarantee.
- [x] 3.2 Remove the three Analytics scenarios, PNGs, manifest entries, and browser helpers; update deterministic gallery expectations from 59 to 56.
- [x] 3.3 Regenerate the 56-frame gallery twice, compare hashes, and visually inspect every PNG.

## 4. Owned State migration

- [x] 4.1 Stop the owned runtime and create a timestamped ignored backup of the complete SQLite family at revision 34191.
- [x] 4.2 Convert a detached candidate and the owned row by removing both Analytics paths, mapping an Analytics active tab to Employees, and incrementing revision once.
- [x] 4.3 Validate the detached candidate and stored row with the production parser, compare every unaffected value, and prove normal startup.

## 5. Verification and delivery

- [x] 5.1 Run format, lint, typecheck, unit tests, development check, production build, both browser suites, Pages build/check, public-safety scan, strict OpenSpec validation, and diff checks.
- [x] 5.2 Synchronize and archive the OpenSpec change, validate no active changes, and commit the complete implementation.
- [x] 5.3 Integrate current origin/main, merge and push main, delete the completed branch, and verify clean synchronized refs.
