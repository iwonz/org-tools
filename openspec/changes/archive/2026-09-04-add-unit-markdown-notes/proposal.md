## Why

Units currently carry structure, membership, and layout but have no place for durable contextual
documentation. A View-local Markdown note lets people keep rationale, responsibilities, and planning
details beside the Unit without crowding the organization canvas.

## What Changes

- Add a bounded Markdown note to every Unit in every organization View.
- Add a quiet Unit-card note action that appears on hover or focus when empty and remains visibly
  active when content exists.
- Add a Preview-first dialog with a draft Markdown editor, safe local rendering, explicit Save, and
  unsaved-close confirmation.
- Preserve notes through View cloning, cross-View Unit Copy/Paste, Undo/Redo, complete State
  Import/Export, automatic SQLite persistence, and live-tab synchronization.
- Keep Unit notes out of Editor PNG and Employee-oriented JSON/Template output.
- Add two deterministic screenshot scenarios for the note Preview and Editor surfaces.
- **BREAKING**: require `noteMarkdown` on every `OrgEditorUnit`; former State files without this
  exact field are rejected. Convert only the configured local SQLite state once, offline and with a
  timestamped backup, without adding a runtime compatibility reader or changing the SQL schema.

## Capabilities

### New Capabilities

- `unit-markdown-notes`: View-local Unit note lifecycle, safe Markdown rendering, interaction, and
  bounds.

### Modified Capabilities

- `organization-editor`: Unit cards expose the note action while canvas geometry and PNG output stay
  unchanged.
- `organization-views`: View cloning, cross-View clipboard, and View-local history preserve notes.
- `single-state-runtime`: note saves use the existing atomic automatic-write and live-tab paths.
- `state-transfer`: the exact complete State contract requires and transfers Unit notes.
- `interface-localization`: note UI and accessibility copy exist in all six bundled locales.
- `privacy-safety`: Markdown cannot execute HTML or fetch images, and links require explicit safe
  navigation.
- `project-tooling`: browser coverage and the deterministic gallery expand from 52 to 54 frames.

## Impact

- Affects shared Unit types and strict parsing, Editor stores and card UI, State fixtures, both
  runtimes, browser tests, screenshot automation, and product documentation.
- Adds browser-safe `react-markdown` and `remark-gfm` dependencies, loaded only when the note dialog
  is used.
- Does not add an API route, database table, browser persistence, remote request, note search, or
  note token in Employee output.
