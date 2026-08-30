# Privacy and data safety

org-tools is designed for sensitive organization planning with a strictly local data path.

## Data boundary

Organization state may travel only between the current browser page and the Org Tools runtime on the
same loopback origin. The local runtime persists projects in SQLite; it does not provide telemetry,
remote logging, accounts, remote upload APIs, background synchronization, or network database
access. Browser smoke tests fail when a core workflow makes a request outside the local application
origin.

The active working copy and import previews are held in browser memory. Explicit Save sends one
validated complete snapshot to the loopback runtime, where SQLite commits it atomically. Closing or
reloading the page discards unsaved organization changes. Organizational data is not stored in
cookies, IndexedDB, session storage, or local storage. Import and Export operate only on the current
project and remain explicit migration and backup actions.

Local storage is used only for the non-sensitive `en` or `ru` locale identifier under
`org-tools-locale`. Project theme and other project UI state use the bounded SQLite `ui_json`
projection and never contain organization records. The locale is never added to a workspace or
project, and opening a project never changes it.

The default runtime directory `.org-tools/` is ignored by Git. A custom database path is allowed,
but database files and `.org-tools/config.json` must never be committed. Stop the server before
copying the SQLite file: rollback-journal mode keeps the durable idle store to one database file,
while copying a live database can produce an inconsistent backup.

## File validation

- Every scoped state JSON is parsed into the sole strict current unversioned contract and its
  declared `content` is verified before any candidate is built.
- Non-state JSON is parsed into a transient mapping session with file, collection, row, and
  field limits.
- All four workspace Export downloads are scoped `OrgToolsState` projections parsed by the production state
  parser before download.
- Obsolete versioned or scope-mismatched state files are rejected without migration; invalid dates and
  conflicting duplicate labels block the complete operation.
- Invalid mapped rows, repeated-key conflicts, unknown parents, cycles, multiple bosses, and
  ambiguous identities block the entire generic append.
- Unknown state fields, keys, references, invalid Live rules, and Live dependency cycles block the
  entire state operation.
- Unknown complete-state fields and obsolete version fields are rejected rather than guessed.
- Spreadsheet-oriented exports neutralize formula-leading values where appropriate.

Employee tag dates and their Calendar indexes remain organization data. Editing, filtering,
grouping, virtualized event dialogs, workspace Export, import, and data download operate in the
browser working copy; only explicit project Save crosses into the loopback runtime. None adds
reminders, remote work, or browser persistence.

## Links and avatars

Profile links accept only `http` and `https`, then open only on an explicit action with `noopener`,
`noreferrer`, and no-referrer behavior. Email links are also explicit actions. Displaying a card,
search result, analytics result, or canvas does not navigate or request either value.

Avatar sources come only from an explicit file selection, an explicit clipboard-read action, or an
image paste inside the Employee form. They accept PNG, JPEG, or WebP up to 25 MiB and 40 megapixels;
ordinary text paste is untouched. Decode, downscale, pan, zoom, crop, and WebP encoding happen in
the page. The saved result is a validated 512-by-512 embedded WebP with the existing 2 MiB decoded
limit. Temporary object URLs are revoked on replacement, cancel, and unmount, and the uncropped
source is never stored. Other media types, malformed encodings, oversized values, and network image
addresses are rejected. The UI falls back to locally rendered initials.

## Safe contributions

Never commit a real workspace, contact list, organization screenshot, filesystem path, credential,
or copied production data. Fixtures use fictional names, the reserved `example.test` domain,
reserved `555-01xx` phone numbers, and local embedded or initial avatars.

Before publication, `pnpm public:check` scans repository files and the production output for
non-portable paths, unexpected non-English source text, unsafe remote media, obsolete fields and
tooling, unsupported media artifacts, caches, and generated declarations. The only source-path
exception for Cyrillic is the reviewed Russian catalog at `apps/ui/messages/ru.json`.

OpenSpec is a development-only dependency and is not included in the production application. Repository
commands invoke it through `pnpm spec -- ...`, which sets its documented telemetry opt-out
environment variables.
