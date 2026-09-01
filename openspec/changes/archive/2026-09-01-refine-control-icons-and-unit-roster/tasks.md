## 1. Control and roster implementation

- [x] 1.1 Move contextual header-action and Editor Arrange and hierarchy icons before their visible labels while preserving responsive and accessible behavior.
- [x] 1.2 Audit text-bearing buttons, tabs, and button-like controls, retaining only semantic trailing affordances after their labels.
- [x] 1.3 Flatten direct and descendant Employees into one selected-Unit virtualized roster without changing ordering, filtering, drag, or card actions.
- [x] 1.4 Remove the obsolete Employee-list section API, section-row virtualization code, and descendant-section translation.

## 2. Tests and documentation

- [x] 2.1 Update browser coverage for leading thematic icons, preserved trailing affordances, responsive icon-only actions, and both Editor hierarchy states.
- [x] 2.2 Cover the contiguous selected-Unit roster, total and filtered counts, absence of section headings, and retained card behavior.
- [x] 2.3 Update architecture, usage, screenshot catalog, manifest, and capability deltas for the new conventions.
- [x] 2.4 Regenerate and visually inspect all 43 screenshots twice and confirm deterministic hashes.

## 3. Validation and delivery

- [x] 3.1 Run format, lint, typecheck, unit, skill, MCP, dev, server/Pages build, browser, Pages/public, strict OpenSpec, and diff checks.
- [x] 3.2 Synchronize capability deltas, archive the change, commit, fast-forward merge to main, push, remove the merged branch, and verify clean synchronized refs with no active changes.
- [x] 3.3 Publish GitHub Pages from clean synchronized main, wait for the workflow, and verify the public browser-only load, Import, edit, Export, MCP isolation, local-only networking, and console diagnostics.
