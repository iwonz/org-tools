# org-tools

`org-tools` is a private organization editor for Units, Employees, visual structure, Analytics,
Calendar, and local data downloads.

[Open Org Tools on GitHub Pages](https://iwonz.github.io/org-tools/) — the complete browser-only
application. Its organization state exists only in memory, can synchronize between currently open
tabs, and enters through complete-state or mapped Employee Import and leaves through direct
complete-state Export. It has no backend, accounts, telemetry, remote logging, or background
requests.

## Screenshots

| Import | State Export |
| :---: | :---: |
| [![State import confirmation](docs/screenshots/demo-import.png)](docs/screenshots/demo-import.png) | [![Direct state export](docs/screenshots/demo-export.png)](docs/screenshots/demo-export.png) |
| Theme | Language |
| [![Dark theme dialog](docs/screenshots/demo-theme.png)](docs/screenshots/demo-theme.png) | [![Six-language selector](docs/screenshots/demo-language.png)](docs/screenshots/demo-language.png) |
| Teams | Employees |
| [![Populated Teams](docs/screenshots/demo-teams.png)](docs/screenshots/demo-teams.png) | [![Searchable Employee catalog](docs/screenshots/demo-employees.png)](docs/screenshots/demo-employees.png) |
| Editor | Analytics |
| [![Visual organization Editor](docs/screenshots/demo-editor.png)](docs/screenshots/demo-editor.png) | [![Organization Analytics](docs/screenshots/demo-analytics.png)](docs/screenshots/demo-analytics.png) |
| Calendar | Data Download |
| [![Employee Calendar](docs/screenshots/demo-calendar.png)](docs/screenshots/demo-calendar.png) | [![Configured data Download](docs/screenshots/demo-download.png)](docs/screenshots/demo-download.png) |

The [complete visual capability catalog](docs/screenshots.md) documents all 46 maintained scenarios.

Employee birthdays use complete `DD.MM.YYYY` values. Year `1900` explicitly means that only the
recurring day and month are known.

Employees have stable UUIDs, a configurable model of typed or derived custom fields, and a shared
Tag catalog with named presets and arbitrary HEX colors rendered as filled surfaces without
decorative marker dots. Custom fields participate in forms, filters, Employee Import,
structured JSON, and Template output. The Calendar uses locale-aware weeks, weekend tones, a
compact dated-Tag rail, and direct Today navigation when browsing another month.

The complete interface is bundled in English, Simplified Chinese, Russian, Spanish, French, and
Modern Standard Arabic. New in-memory states follow the first supported browser language, Arabic
mirrors the application shell through RTL, and language plus theme are selected in compact modal
dialogs. No font or translation asset is loaded from the network.

Data Download and Editor JSON export use one drag-sortable field list: scalar Employee fields,
Units, and Tags appear in their exact output order. Editor Image export keeps a compact inline
preview with localized boss text and no secondary image viewer.
Analytics includes known birth-year distributions plus average, youngest, and oldest age summaries
for the whole catalog, men, and women; unknown `1900` years are excluded.
Template formats in Data Download and Editor export accept `@` to insert documented `{token}` values
at the caret. If a local SQLite database cannot open, explicit recovery preserves its file family as
a timestamped backup before creating a blank current-schema database.

## Run locally

The durable runtime requires Node.js 22.13 or newer and pnpm 11.24.0.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000). Every organization or durable interface
change is written automatically to the singleton SQLite state; there is no Save action. The default
database is `.org-tools/org-tools.sqlite3`. Override it with `ORG_TOOLS_DB_PATH`, or copy
`.org-tools/config.example.json` to `.org-tools/config.json` and set `databasePath`. Stop the server
before copying the SQLite file.

Use `pnpm pages:dev` for the in-memory static runtime. `pnpm pages:build` exports it to ignored
`pages-out`, and `pnpm pages:check` verifies the `/org-tools` base path and absence of API or SQLite
code. Publishing remains an explicit maintainer action through `pnpm pages:publish`.

More: [Usage](docs/usage.md) · [Architecture](docs/architecture.md) ·
[Privacy](docs/privacy.md) · [Performance](docs/performance.md) ·
[Contributing](CONTRIBUTING.md) · [License](LICENSE)
