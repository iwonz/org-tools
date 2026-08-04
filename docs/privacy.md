# Privacy and data safety

org-tools is designed for sensitive organization planning without a server-side data path.

## Data boundary

Organization state, imported rows, search terms, analytics, previews, and exports are processed in
the current browser page. The application does not provide telemetry, remote logging, accounts,
upload APIs, background synchronization, or a server database. Browser smoke tests fail when a core
workflow makes a request outside the local application origin.

State and import preview rows are held in memory. They enter only when the user explicitly selects a file and leave only when
the user explicitly downloads, copies, or exports content. Closing or reloading the page discards
unsaved organization changes. Organizational data is not stored in cookies, IndexedDB, session
storage, or local storage.

Local storage is used only for bounded, non-sensitive UI preferences: the theme and the `en` or
`ru` locale identifier under `org-tools-locale`. Locale access is best-effort, and a browser that
blocks local storage continues in memory. The locale is never added to a workspace file, and opening
a workspace never changes it.

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
grouping, virtualized event dialogs, workspace Export, import, and data download all operate inside the current page and
do not add reminders, background work, or browser persistence.

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

OpenSpec is a development-only dependency and is not included in the static application. Repository
commands invoke it through `pnpm spec -- ...`, which sets its documented telemetry opt-out
environment variables.
