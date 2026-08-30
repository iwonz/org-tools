# org-tools

`org-tools` is a private local organization editor with durable SQLite project workspaces.

[Open the public product showcase](https://iwonz.github.io/org-tools/) — documentation and 46
synthetic screenshots only; functional workspaces run locally.

- Build Units, manage Employees, and arrange them on a visual canvas.
- Search the organization, explore analytics, and track birthdays and dated tags.
- Import JSON and export workspace files, tables, templates, or a canvas PNG.
- Keep organization data on this computer through a loopback-only Next.js runtime—there is no
  account, remote service, telemetry, or background synchronization.

## Screenshots

Click a preview to open the full-size image.

| Import | Workspace Export |
| :---: | :---: |
| [![Recognized workspace import](docs/screenshots/demo-import.png)](docs/screenshots/demo-import.png) | [![Content-scoped workspace export](docs/screenshots/demo-export.png)](docs/screenshots/demo-export.png) |
| Theme | Language |
| [![Dark theme menu](docs/screenshots/demo-theme.png)](docs/screenshots/demo-theme.png) | [![Russian language menu](docs/screenshots/demo-language.png)](docs/screenshots/demo-language.png) |
| Teams | Employees |
| [![Populated Teams workspace](docs/screenshots/demo-teams.png)](docs/screenshots/demo-teams.png) | [![Searchable Employee catalog](docs/screenshots/demo-employees.png)](docs/screenshots/demo-employees.png) |
| Editor | Analytics |
| [![Visual organization Editor](docs/screenshots/demo-editor.png)](docs/screenshots/demo-editor.png) | [![Organization Analytics](docs/screenshots/demo-analytics.png)](docs/screenshots/demo-analytics.png) |
| Calendar | Data Download |
| [![Employee Calendar](docs/screenshots/demo-calendar.png)](docs/screenshots/demo-calendar.png) | [![Configured data Download](docs/screenshots/demo-download.png)](docs/screenshots/demo-download.png) |

See the [complete visual capability catalog](docs/screenshots.md) for every secondary workflow,
open panel, and deterministic generation rule.

## Run locally

Requires Node.js 22.13 or newer and pnpm 10.33.2. Arbitrary static hosting is no longer supported
because project writes require the local Next.js runtime.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). The default database is
`.org-tools/org-tools.sqlite3`; override it with `ORG_TOOLS_DB_PATH` or copy
`.org-tools/config.example.json` to `.org-tools/config.json` and set `databasePath`. Relative paths
resolve from the repository root. Stop Org Tools before copying the SQLite file as a backup. Import
an older `org-tools-state.json` once into the first project, then use **Save** for durable changes.

More: [Usage](docs/usage.md) · [Privacy](docs/privacy.md) · [Contributing](CONTRIBUTING.md) ·
[License](LICENSE)

## Development and Pages

`pnpm dev:check` starts the real development server with an isolated temporary database, verifies
project routing and API startup, and stops it. `pnpm pages:build` creates the ignored static showcase
in `pages-out`; `pnpm pages:check` validates it. An authenticated maintainer can publish the already
merged, clean, synchronized `main` with `pnpm pages:publish`.

GitHub Pages cannot host the working application: project writes require the loopback Next.js server
and local SQLite file. The Pages artifact has no editor, forms, telemetry, remote assets, or
organization-data path.
