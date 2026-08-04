# Contributing

Thank you for improving org-tools. Contributions must preserve its browser-only privacy boundary,
synthetic public data, English public artifacts, and accessible component conventions.

## Prepare a change

1. Install Node.js 20 or newer and the pnpm version declared in `package.json`.
2. Run `pnpm install --frozen-lockfile`.
3. Create an OpenSpec change with `pnpm spec -- new change <short-kebab-name>`.
4. Complete the proposal, design, capability deltas, and task list before implementation.
5. Run `pnpm spec:validate` and keep the artifacts current as implementation decisions change.

Generated Codex workflows are available under `.codex/skills/` for proposing, applying, syncing,
and archiving OpenSpec changes. Run every OpenSpec command through `pnpm spec -- ...`; the wrapper
disables the CLI's anonymous telemetry for this repository.

## Implementation rules

- Keep each change focused and update user or architecture documentation with the code.
- Reuse shared Employee and Unit components, derived indexes, and store operations.
- Keep organizational state in memory and perform import/export entirely in the browser.
- Use synthetic fixtures with reserved domains and phone ranges. Do not submit real names, contact
  details, local filesystem paths, access tokens, or exported organization data.
- Avoid adding dependencies unless they materially reduce complexity. Explain new runtime
  dependencies in the OpenSpec design.
- Add tests for behavior changes and accessible names for user controls.

## Validation

Before opening a pull request, run:

```sh
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build
pnpm spec:validate
pnpm public:check
pnpm test:browser
```

Run `pnpm screenshots:generate` for visible UI changes and inspect every PNG. Formatting is an
explicit mutation: use `pnpm format`, then review its diff.

## Pull requests

Describe the user-visible result, link the OpenSpec change, summarize privacy and performance
effects, and list the checks you ran. A maintainer will sync completed capability specs and archive
the change before release.
