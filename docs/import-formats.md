# State transfer format

Org Tools imports and exports one strict, complete, unversioned JSON value:

```ts
type OrgToolsState = {
  organization: {
    employees: OrganizationEmployee[];
    views: OrgToolsViewDocument[];
  };
  ui: OrgToolsUiState;
};
```

No additional top-level properties are accepted. There is no `kind`, `content`, version, partial
scope, append mode, mapping preview, or arbitrary JSON conversion. Files from older formats are
rejected without migration or mutation.

`organization` contains the complete Employee catalog and structural View documents. `ui` contains
locale, theme, shell state, active section and View, selected and expanded Units, filters, searches,
calendar settings, Data Download settings, and per-View viewport and selection. Transient dialogs,
notifications, and unfinished forms are excluded.

Import is limited to 25 MiB. It parses and validates a detached candidate, shows filename, size, and
Employee, Unit, and View counts, and replaces current state only after explicit confirmation. Export
validates the current live value and downloads `org-tools-state.json` immediately.

CSV, report JSON, templates, and PNGs from Data Download or Editor export are output artifacts, not
state transfer files.
