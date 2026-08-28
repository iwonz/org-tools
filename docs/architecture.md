# Architecture

org-tools is a static Next.js application backed by an in-memory MobX workspace. It has no server
runtime or database. Files are the persistence boundary: a complete workspace is opened from and
saved to strict unversioned JSON. The same state envelope carries scoped Teams, Employees, Teams +
Employees, or Full workspace content. Ordinary JSON can append mapped manual Teams,
Employees, hierarchy, and assignments.

## Workspace layout

- `apps/ui` contains the static application, React components, stores, parsers, exporters, and UI
  tests.
- `packages/types` defines the public state, Employee, Unit, View, and editor contracts.
- `packages/screenshots` contains production-build browser smoke tests and deterministic PNG
  capture.
- `openspec` contains active changes and canonical capability specifications.
- `examples` contains small, explicitly synthetic JSON imports.

The `pnpm spec -- ...` wrapper is the repository entry point for OpenSpec and disables its
development-only anonymous telemetry.

The production build is exported to `apps/ui/out`. It consists only of static HTML, CSS, JavaScript,
fonts, and images that can be hosted on any static file server.

The application has one route, `/`. A client locale provider statically imports the English and
Russian catalogs, deterministically encodes reserved periods in sentence-style UI IDs, and passes
the active namespace-safe catalog to `NextIntlClientProvider`. The typed UI wrapper applies the same
encoding during lookup. There are no locale URL segments, middleware, request configuration, server
negotiation, or catalog fetches. Before the browser locale is resolved, the application renders a
neutral text-free surface so the fallback language cannot flash.

The single-route shell owns a dark collapsible sidebar and a context-only workflow header. The
sidebar keeps the existing Radix product-tab state and order, co-locates language, theme, Import,
and workspace Export actions, and switches between a 240 px labelled panel and a 64 px icon rail.
Narrow layouts use the icon rail through responsive CSS. Collapse state is component-local and is
not added to MobX workspace state, exported files, or browser storage.

## State flow

```text
scoped state JSON ──strict projection + append/replace──┐
ordinary JSON ──nested mapping and atomic append────────┼──> in-memory stores ──> UI and local export
```

`OrgToolsState` is the sole current transfer format. Its `content` discriminator declares Teams,
Employees, Teams + Employees, or Full workspace. A parser verifies the declared scope, exact
structure, UUID identifiers, Employee tag records and dates, references, URLs, avatar bounds, and
graph invariants before any mutation. Partial states contain one canonical Main View and UI shell;
Full workspace can contain every View and UI field. Obsolete and scope-mismatched shapes are
rejected without migration.

`ImportSessionStore` keeps the selected state projection and operation or the ordinary file
collection, mappings, preview, and errors transiently. Preview plans retain normalized Employees,
ordered Team hierarchy, manual assignment references, and separate Live role references. The dialog
flattens that graph into dynamically measured virtual rows without duplicating Employee records.
Recognized state append resolves Employee identity, remaps UUIDs and references, translates imported
layout into a free Main area, and retains custom Views and UI. Partial replace installs a clean
projection; Full workspace always replaces.

Ordinary JSON maps recursive children and inline Employee arrays. These sources create manual Teams
only and always append. Conflicting keys, ambiguous identities, and multiple bosses block the
detached complete candidate. The production state parser validates every candidate before one store
mutation.

The workspace Export dialog snapshots complete state once and runs all four choices through pure state
projection serializers. Every result is parsed through the production state parser before download.

Employee tags use one normalized runtime record with a label and nullable `YYYY-MM-DD` date. Search
documents, Live rules, and option identity project only labels. Shared derived indexes group exact
dated-tag events by ISO day and normalized label alongside birthday indexes, so Calendar cells and
virtualized dialogs do not rescan the Employee catalog during render.

Tag dates stay behind focused calendar popovers. Cards and the Org Editor render every chip with
wrapping. The interactive canvas uses deterministic packing to produce variable Employee row heights
and prefix offsets for virtualization, hit testing, connections, layout, and bounds. Localized PNG
rendering uses a card-consistent neutral chip profile whose shared paint and row-allocation geometry
keeps exported bounds compact and aligned.

The Editor uses one 24-unit document-space coordinate grid. Explicit coordinate-producing commands
snap affected Unit origins in the editor store; opening a workspace does not normalize untouched
legacy coordinates. The canvas derives a power-of-two visible grid interval from the current scale,
then paints it as a constant-cost CSS background aligned to the viewport origin. Visible grid lines
therefore remain legible across zoom levels and always describe valid snap coordinates.

Employee avatar editing is also a local draft pipeline. A bounded file or clipboard Blob is decoded,
optionally downscaled to a temporary 4096-pixel preview, positioned through `react-easy-crop`, and
drawn to a 512-by-512 WebP canvas. Only the validated data URL enters the Employee draft; temporary
object URLs and the original source are not retained.

## Store responsibilities

- The organization store owns the global Employee catalog and canonical Main View.
- The Views store owns custom View documents and their independent editor stores.
- Each editor store owns document commands, canvas selection, layout, viewport, and undo/redo.
- The data-download session owns transient source selection and output settings.
- The import session owns transient file parsing, projection choice, operation, mappings, and previews.
- The workspace Export dialog owns a transient complete-state snapshot and selected download shape.
- The locale provider owns the independent `en` or `ru` UI preference and updates document metadata.

Derived indexes resolve IDs into display models and search documents. Components receive resolved
data through props and shared list components instead of rebuilding indexes during render.

## Persistence and current-schema policy

Workspace state remains in page memory. Opening a valid complete state replaces it atomically;
downloading produces `org-tools-state.json`. UI preferences may be derived from the current session,
but organizational content is not written to browser storage. Theme and locale are the only local
preferences; locale uses the `org-tools-locale` local-storage key and is not part of
`OrgToolsState`. Opening a workspace therefore cannot change the language. The public state
interface deliberately has no version fields: a schema change replaces the previous type, reader,
fixtures, documentation, and tests instead of adding a compatibility or migration layer.
