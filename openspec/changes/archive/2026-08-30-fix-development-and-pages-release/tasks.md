## 1. Development startup

- [x] 1.1 Move pnpm overrides to supported workspace configuration and make root development
  commands warning-free.
- [x] 1.2 Add a bounded isolated `dev:check` probe covering root redirect, project rendering, and
  project API startup with guaranteed cleanup.

## 2. Public showcase

- [x] 2.1 Build the ignored static Pages artifact deterministically from the complete synthetic
  screenshot manifest with accurate local-runtime messaging.
- [x] 2.2 Extend publication safety to validate Pages files, links, screenshot parity, and the absence
  of scripts, remote resources, secrets, local paths, and organization storage.
- [x] 2.3 Add the least-privilege manually dispatched GitHub Pages workflow and guarded
  `pages:publish` command.

## 3. Documentation and automation

- [x] 3.1 Update README, architecture, privacy, usage, screenshots, contributor guidance, AGENTS,
  and command documentation for development checks and the static Pages boundary.
- [x] 3.2 Extend CI to run the development probe and build the validated Pages artifact.

## 4. Validation and delivery

- [x] 4.1 Run format, lint, typecheck, unit tests, dev smoke, production build, browser tests,
  deterministic screenshot regeneration and visual review, Pages build, public checks, strict
  OpenSpec validation, and diff checks.
- [x] 4.2 Synchronize capability specs and confirm that the completed change is ready for archival.
- [x] 4.3 Verify the guarded Pages publication preconditions and the post-merge deployment procedure.
