# org-tools

`org-tools` is a private organization editor that runs entirely in the browser.

- Build Units, manage Employees, and arrange them on a visual canvas.
- Search the organization, explore analytics, and track birthdays and dated tags.
- Import JSON and export workspace files, tables, templates, or a canvas PNG.
- Keep organization data in page memory—there is no account, server database, or telemetry.

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

See the [screenshot guide](docs/screenshots.md) for scenario intent and deterministic generation.

## Run locally

Requires Node.js 20 or newer and pnpm 10.33.2.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

More: [Usage](docs/usage.md) · [Privacy](docs/privacy.md) · [Contributing](CONTRIBUTING.md) ·
[License](LICENSE)
