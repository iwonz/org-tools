# Workspace transfer format

Org Tools transfers organization state through one strict full-workspace JSON contract. Import and
Export run locally in the browser; the selected file and its contents are never sent to a server or
third party.

## Public state contract

```ts
type OrgToolsState = {
  kind: "org-tools-state";
  content: "workspace";
  activeViewId: string;
  employees: WorkspaceEmployee[];
  views: OrgView[];
  ui: UiState;
};
```

The object has exact top-level fields and intentionally has no format or schema version. It contains
the complete Employee catalog, Main and custom Views, Unit hierarchy, assignments, Live rules,
editor documents, layouts, viewports, and workspace UI state.

UUIDs, references, Live dependency graphs, tag dates, required Employee gender values, embedded
avatars, URLs, and UI references are validated strictly. Files with the former `teams`,
`employees`, or `teamsEmployees` scopes, arbitrary JSON, unknown fields, dangling references,
invalid values, or malformed JSON are rejected. Rejection never falls through to a mapping workflow
and never changes the current project.

## Import

Import accepts a JSON file up to 25 MiB. After the native chooser closes, a compact confirmation
shows the filename, size, and Employee, Unit, and View counts. **Replace project** atomically
installs the complete validated candidate, including its theme and workspace UI state. **Choose
another file** retries in the same dialog; **Cancel** leaves the current state untouched.

Import replaces only the current project. It does not change a SQLite project ID, name, or
revision, and it does not bind or replace the browser project file handle. The imported
organization becomes dirty and is made durable only by the next project or file Save.

## Export

**Export** validates the complete live snapshot and immediately downloads
`org-tools-state.json`. There is no format dialog or success banner. The snapshot includes changes
that have not yet been saved to the current SQLite project or browser file.

The separate **Download** module remains available for purpose-built CSV, JSON, text-template, and
PNG outputs. Those outputs are reporting artifacts, not project files and cannot be imported as a
project.

## Current-schema policy

Public Org Tools files intentionally contain no format or schema version. When the public state
schema changes, the repository replaces the former type, reader, fixtures, documentation, and tests
instead of retaining compatibility branches.
