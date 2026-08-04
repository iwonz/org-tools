# org-tools

`org-tools` is a private-by-design organization workspace that runs entirely in the browser. Build
Units, place Employees on an organization canvas, explore local analytics and birthdays, and export
the result without a server account.

## What it does

- Opens directly into an empty Org Editor with Units, Employees, Analytics, Calendar, and Download.
- Keeps a canonical Main View and independent custom Views.
- Supports Static and Live Units, Unit-scoped positions, tags, drag and drop, and undo/redo.
- Exports Teams, Employees, their combined Main View, or the complete workspace in one strict
  unversioned state envelope.
- Imports recognized state projections through explicit append or replace operations.
- Maps arbitrary JSON to Employees, nested manual Units, assignments, positions, and bosses.
- Downloads local CSV, JSON, templates, and a canvas PNG.

Organization data stays in page memory. The application has no server database, account system,
telemetry, background synchronization, or remote avatar loading. See [Privacy](docs/privacy.md) for
the complete boundary.

## Use the application

1. Run `pnpm install` and `pnpm dev`.
2. Open the local address shown in the terminal.
3. Create Units and Employees, or choose **Import** to select a saved state or map a JSON
   collection.
4. Choose **Export** to download a scoped state or the complete `org-tools-state.json` workspace.

Sample import files are available in [`examples/`](examples/). The full workflow is documented in
[Usage](docs/usage.md), and the current state and mapping contracts are documented in
[Import formats](docs/import-formats.md).

## Development

Requires Node.js 20 or newer and pnpm 10.33.2.

```sh
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm build
pnpm spec:validate
pnpm public:check
```

Browser smoke tests require Chromium installed by Playwright:

```sh
pnpm --filter @org-tools/screenshots exec playwright install chromium
pnpm test:browser
```

Read [Contributing](CONTRIBUTING.md) before proposing a change. Architecture, performance, and
screenshot documentation live in [`docs/`](docs/).

## Screenshots

The deterministic PNG gallery is described in [Screenshots](docs/screenshots.md). Regenerate it
with `pnpm screenshots:generate` after a user-visible change.

## License

MIT. See [LICENSE](LICENSE).
