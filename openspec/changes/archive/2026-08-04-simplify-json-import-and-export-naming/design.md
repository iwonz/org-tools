## Context

The header currently opens an empty import dialog that contains its own CSV/JSON picker, while the neighboring Save action downloads scoped `OrgToolsState` documents. A separate final Export tab prepares CSV, JSON, templates, and images. This creates two meanings for Export and retains a CSV-import path that is no longer wanted. The wordmark also uses two clipped gradients despite the requested monochrome identity.

## Goals / Non-Goals

**Goals:**

- Start import with the native file chooser and open configuration only after a file exists.
- Make every imported file JSON while preserving strict state detection and generic JSON mapping.
- Distinguish workspace Export from the final Download data surface in both locales.
- Render one monochrome, theme-adaptive wordmark.
- Remove obsolete CSV-import code and documentation without changing CSV output.

**Non-Goals:**

- Change `OrgToolsState`, its scoped projections, filenames, or import merge semantics.
- Remove CSV, JSON, template, or PNG output.
- Rename persisted `activeTab: "export"`, editor-form Save actions, or Org Editor image Export.
- Add dependencies, storage, server processing, or external requests.

## Decisions

- The shell owns a visually hidden `input[type=file]`. Activating Import clears and clicks it; cancellation produces no state or dialog. A selected `File` becomes the dialog's initial source and is cleared when the dialog closes. This is preferable to programmatically reopening the existing empty dialog because it gives one direct user action and supports native picker accessibility.
- The picker advertises `.json,application/json`, and every selected file is parsed through `JSON.parse` regardless of MIME reliability. Malformed JSON, strict claimed-state failures, and size failures are displayed in the post-selection dialog, which retains Choose another file. There is no content sniffing or CSV fallback.
- `ImportSessionStore` remains the transient owner of bytes, parsing, mapping, preview, and detached candidate validation. `ImportDialog` receives an initial `File` and loads it once per selection; closing resets the store. This preserves failure atomicity and keeps organization data inside the page.
- CSV parser functions, the CSV document discriminator, flat parent-key mapping, CSV fixtures, and their tests are removed. Generic JSON retains collection selection, nested `children`, inline `employees`, manual-Team semantics, identity matching, and append-only candidate validation. PapaParse remains only for CSV serialization in the Download surface.
- Separate translation keys distinguish the header Export action and state-export dialog from generic Save buttons, and distinguish the final Download tab from Org Editor Export. Download-specific copy uses localized Download terminology, while image Export retains its existing localized terminology. Internal store value `export` remains stable.
- The wordmark becomes a single text node using `text-foreground`; its `role="img"`, `aria-label="Org Tools"`, typography, and no-shadow contract remain. This avoids theme-specific hard-coded colors and removes all gradient styling.
- Documentation, OpenSpec context, smoke helpers, and deterministic screenshots change with the behavior. Import stays bounded at 25 MiB and scales as before because JSON normalization and preview algorithms are unchanged.

## Risks / Trade-offs

- [A browser may allow selecting a non-JSON extension despite `accept`] → Always parse as JSON and show the owned localized parse error without falling back.
- [A file selection effect can load the same `File` more than once under React development behavior] → Key loading by the selected File identity and reset the native input so deliberate reselection remains possible.
- [Renaming Export only visually can accidentally affect Org Editor export copy] → Introduce surface-specific translation keys and browser assertions for both workflows.
- [Removing flat CSV mapping drops a supported hierarchy workflow] → Treat this as the declared breaking change, remove every public CSV-import example, and document nested JSON equivalents.

## Migration Plan

Ship the chooser, JSON-only parser, renamed UI, message catalogs, removed fixtures, documentation, and tests atomically. Users convert import sources to JSON; no saved workspace or exported file migration is required. Rollback restores the removed CSV path and prior labels.

## Open Questions

None.
