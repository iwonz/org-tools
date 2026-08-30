## REMOVED Requirements

### Requirement: Employee import is atomic and non-relational
**Reason**: Arbitrary JSON Employee and combined import are removed.
**Migration**: Import a complete Org Tools workspace.

### Requirement: Duplicate identities are not overwritten
**Reason**: Mapping and append identity resolution no longer exist in Import.
**Migration**: Resolve identities before producing a complete workspace file.

### Requirement: Generic JSON supports nested Team graphs
**Reason**: Generic JSON graph mapping is removed.
**Migration**: Use the strict complete workspace shape.

### Requirement: JSON collections can be mapped to organization data
**Reason**: Import no longer accepts or maps arbitrary collections.
**Migration**: Use `content: "workspace"`.

### Requirement: Generic Team mapping uses the structured hierarchy preview
**Reason**: Mapping previews are removed with generic Import.
**Migration**: Review the compact complete-workspace summary.

### Requirement: Ordinary Employee import normalizes gender
**Reason**: Ordinary Employee mapping is removed.
**Migration**: Every Employee in the complete workspace must already contain a valid normalized
gender.
