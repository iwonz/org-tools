## 1. Package-manager startup

- [x] 1.1 Pin pnpm 11.24.0 consistently for Corepack, local commands, and GitHub automation without
  weakening package-manager validation or rewriting dependency resolution.
- [x] 1.2 Verify Corepack selection, frozen dependency installation, `pnpm dev`, and the bounded
  Chromium development probe; document the supported setup.

## 2. Project terminology

- [x] 2.1 Replace user-visible workspace/working-area copy with Project terminology in both locales
  while preserving message IDs, filenames, code identifiers, and the public workspace contract.
- [x] 2.2 Update localization and browser tests, usage documentation, and every affected screenshot
  expectation; verify both locales and browser fallback/recovery states.

## 3. Validation and delivery

- [x] 3.1 Run format, lint, typecheck, unit, both production builds, both browser suites, two
  deterministic 48-frame screenshot generations, Pages/public checks, strict OpenSpec validation,
  and diff checks.
- [x] 3.2 Synchronize the three canonical specs, archive the completed change, create one meaningful
  commit, fast-forward it into local `main`, remove the merged change branch, and leave no active
  OpenSpec change or uncommitted work. Do not push or publish without a separate explicit request.
