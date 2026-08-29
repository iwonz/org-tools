# Screenshots

The public demo is a curated product narrative, not the full browser regression catalog. Its exact
ten-scenario contract lives in `docs/screenshot-demo.json`; generation and publication checks fail
when the manifest, files, README links, or this guide diverge.

Playwright captures the static production build in Chromium at 1440 by 1000, UTC, with a fixed
clock, reduced motion, disabled animations, and loaded local fonts. Every workflow uses the same
obviously synthetic workspace. The default locale and color scheme are English and light; the
language and theme frames intentionally display Russian and dark mode respectively.

## Core workflow gallery

| Import | Workspace Export |
| :---: | :---: |
| [![Recognized workspace import](screenshots/demo-import.png)](screenshots/demo-import.png) | [![Content-scoped workspace export](screenshots/demo-export.png)](screenshots/demo-export.png) |
| Theme | Language |
| [![Dark theme menu](screenshots/demo-theme.png)](screenshots/demo-theme.png) | [![Russian language menu](screenshots/demo-language.png)](screenshots/demo-language.png) |
| Teams | Employees |
| [![Populated Teams workspace](screenshots/demo-teams.png)](screenshots/demo-teams.png) | [![Searchable Employee catalog](screenshots/demo-employees.png)](screenshots/demo-employees.png) |
| Editor | Analytics |
| [![Visual organization Editor](screenshots/demo-editor.png)](screenshots/demo-editor.png) | [![Organization Analytics](screenshots/demo-analytics.png)](screenshots/demo-analytics.png) |
| Calendar | Data Download |
| [![Employee Calendar](screenshots/demo-calendar.png)](screenshots/demo-calendar.png) | [![Configured data Download](screenshots/demo-download.png)](screenshots/demo-download.png) |

## Scenario intent

| Scenario | Required visible state |
| --- | --- |
| Import | A recognized workspace, scoped content choices, append or replace operation, and structured preview. |
| Workspace Export | Local workspace formats and the content included by each scope. |
| Theme | The populated dark Editor, expanded sidebar, and open theme menu. |
| Language | The populated Russian Editor, expanded sidebar, and open language menu. |
| Teams | A selected Unit in a populated hierarchy with its Employee roster and actions. |
| Employees | The searchable catalog, total count, filters, tags, and Employee actions. |
| Editor | Populated Unit cards on the adaptive snap grid with the canvas tool groups. |
| Analytics | Organization totals and distribution groups from the synthetic workspace. |
| Calendar | The current month, clear today state, birthdays, and dated-tag cloud. |
| Data Download | A non-empty selection followed by format, field, row-mode, and preview settings. |

Secondary avatar, tag-date, empty-state, mapping, responsive, accessibility, import-rejection, file
download, and Editor image-export behavior stays covered by `pnpm test:browser`. These detailed
regressions do not need separate public images.

## Regenerate and review

Install the matching browser once, then generate the production build and the exact gallery:

```sh
pnpm --filter @org-tools/screenshots exec playwright install chromium
pnpm screenshots:generate
```

Inspect all ten images at full size. Confirm that dialogs are contained, menus are open in the theme
and language frames, populated surfaces are legible, the Download preview is non-empty, and neither
light nor dark chrome has clipping or unintended overlays. Reject any image containing real
organization data, a local filesystem path, a browser notification, a nondeterministic timestamp,
or an external image.

Regenerate immediately and compare hashes for every image. An unchanged codebase must produce the
same bytes. The generator removes only PNG files directly inside the dedicated screenshot directory,
writes the manifest set, and fails if any expected file is missing or stale file remains.

`pnpm test:browser` runs the non-visual smoke suite against the same production server. It verifies
blank startup, populated workflows, English and Russian copy, light and dark themes, expanded and
compact responsive sidebar geometry, keyboard and focus behavior, hover and pressed geometry,
adaptive Editor snapping, Analytics and Calendar layout, Import validation and mapping, local avatar
handling, workspace projections, Download formats, actual browser downloads, and same-origin-only
requests.
