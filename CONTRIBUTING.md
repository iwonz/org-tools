# Contributing

Thank you for improving org-tools. Contributions must preserve its browser-and-loopback privacy
boundary, synthetic public data, English public artifacts, and accessible component conventions.

## Prepare a change

1. Install Node.js 22.13 or newer and the pnpm version declared in `package.json`.
2. Run `pnpm install --frozen-lockfile`.
3. Fetch `origin`, switch to `main`, update it without rewriting history, and verify that the
   worktree is clean, local `main` matches `origin/main`, and no unrelated OpenSpec change is active.
4. Create `change/<short-kebab-name>`, then create the matching OpenSpec change with
   `pnpm spec -- new change <short-kebab-name>`.
5. Complete and read the proposal, design, capability deltas, and task list before implementation.
   Keep them current as implementation decisions change.

Generated Codex workflows are available under `.codex/skills/` for proposing, applying, syncing,
and archiving OpenSpec changes. Run every OpenSpec command through `pnpm spec -- ...`; the wrapper
disables the CLI's anonymous telemetry for this repository.

## Implementation rules

- Keep each change focused and update user or architecture documentation with the code.
- Reuse shared Employee and Unit components, derived indexes, and store operations.
- Persist organizational state only through the prepared-statement SQLite repository behind the
  loopback same-origin API. Keep Import and Export entirely local.
- Use synthetic fixtures with reserved domains and phone ranges. Do not submit real names, contact
  details, local filesystem paths, access tokens, or exported organization data.
- Avoid adding dependencies unless they materially reduce complexity. Explain new runtime
  dependencies in the OpenSpec design.
- Add tests for behavior changes and accessible names for user controls.

## Complete the change

Finish every task and run the complete validation cycle:

```sh
pnpm format
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm dev:check
pnpm build
pnpm test:browser
pnpm screenshots:generate
pnpm pages:build
pnpm pages:check
pnpm public:check
pnpm spec:validate
git diff --check
```

Inspect every generated PNG, regenerate the gallery, and compare hashes to confirm deterministic
output. Formatting is an explicit mutation, so review its diff. Synchronize completed delta specs,
archive the OpenSpec change, validate strictly again, and confirm `pnpm spec -- list --json` reports
no active changes.

## Integrate and publish

Create meaningful commits that keep the implementation, tests, documentation, generated screenshots,
canonical specs, and archived change together. Update `main` from `origin/main`, merge the short-lived
branch, and push `main` without rewriting shared history. Delete the merged change branch and its
remote counterpart if one was published.

Delivery is complete only when `HEAD`, local `main`, and `origin/main` agree, the worktree is clean,
no change-branch commit remains unique, and OpenSpec has no active changes. Do not delete unknown or
unmerged work. If publication was explicitly forbidden or an external service blocks it, preserve
the safest clean local state and report the exact remaining integration.

The GitHub Pages site is a generated static showcase, not the SQLite application. It contains only
reviewed English copy and synthetic gallery PNGs. After the change is merged and pushed, an
authorized maintainer may run `pnpm pages:publish` from clean synchronized `main`; the command
configures the Actions publishing source and manually dispatches the least-privilege Pages workflow.
