## REMOVED Requirements

### Requirement: Save offers complete and structured partial documents
**Reason**: Export now downloads one complete workspace immediately without a choice dialog.
**Migration**: Use global Export for `org-tools-state.json` or Download for tabular output.

### Requirement: Partial saves are deterministic current-schema Main subsets
**Reason**: Partial state documents are removed from the public contract.
**Migration**: Transfer only a complete `content: "workspace"` document.
