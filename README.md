# org-tools

`org-tools` is a private organization editor that runs either as a browser file workspace or as a
local multi-project SQLite application.

[Open Org Tools in the browser](https://iwonz.github.io/org-tools/) — the complete browser-only app,
with local JSON Open/Save and no backend.

- Build Units, manage Employees, and arrange them on a visual canvas.
- Search the organization, explore analytics, and track birthdays and dated tags.
- Import and export complete workspace JSON, or download tables, templates, and canvas PNGs.
- Keep organization data in an explicitly selected local file or in the loopback-only SQLite
  runtime—there is no account, telemetry, remote service, or background synchronization.

## Screenshots

Click a preview to open the full-size image.

| Import | Workspace Export |
| :---: | :---: |
| [![Workspace import confirmation](docs/screenshots/demo-import.png)](docs/screenshots/demo-import.png) | [![Direct workspace export](docs/screenshots/demo-export.png)](docs/screenshots/demo-export.png) |
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

The local multi-project runtime requires Node.js 22.13 or newer and pnpm 10.33.2.

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
project routing and API startup, and stops it. `pnpm pages:dev` starts the browser-only variant;
`pnpm pages:build` exports it to ignored `pages-out`, and `pnpm pages:check` verifies the `/org-tools`
base path and absence of backend code. An authenticated maintainer can publish the already merged,
clean, synchronized `main` with `pnpm pages:publish`.

On Chromium browsers, **Open workspace**, **Save**, **Save As**, and optional autosave use the File
System Access API. Other browsers use a standard workspace-file upload and download; their workspace lasts only
for the current tab and autosave is unavailable. The public state contract is identical in both
modes. See [Usage](docs/usage.md) for the complete workflow and compatibility details.
