## 1. Current public contracts

- [x] 1.1 Replace numbered state/import types with unversioned `OrgToolsState` and `OrgToolsImport`, remove version fields and migrations, and update strict parsers and store APIs
- [x] 1.2 Update all current serializers, examples, fixtures, performance generation, and localized errors to the unversioned exact shapes
- [x] 1.3 Add contract tests proving current round trips, obsolete versioned rejection, exact-field validation, and atomic failure

## 2. Policy and validation

- [x] 2.1 Update OpenSpec context and architecture, privacy, usage, import-format, and screenshot documentation with the current-schema-only policy
- [x] 2.2 Update browser and screenshot coverage to use unversioned documents and remove migration-specific assertions
- [x] 2.3 Run format, lint, typecheck, unit tests, build, browser smoke, screenshots, strict OpenSpec validation, and `public:check`
