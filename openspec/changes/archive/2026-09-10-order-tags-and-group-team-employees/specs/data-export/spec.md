## ADDED Requirements

### Requirement: Exported Tag values follow catalog order
JSON Tag arrays, text Tag tokens, Employee image chips, and Unit image footers SHALL retain global catalog order after exclusions. Editor PNG SHALL use the Unit's grouping setting and the same Employee order as the live canvas, without rendering settings controls or group separators.

#### Scenario: Export reordered Tags
- **WHEN** Tags are manually reordered and an output is generated
- **THEN** all retained Tag values use the catalog order and PNG Employee rows match their live Unit sequence
