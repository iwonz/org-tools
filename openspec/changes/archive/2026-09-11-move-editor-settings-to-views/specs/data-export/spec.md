## MODIFIED Requirements

### Requirement: Exported Tag values follow catalog order
JSON Tag arrays, text Tag tokens, Employee image chips, and visible Unit image footers SHALL retain global catalog order after exclusions. Editor PNG SHALL use the source View's grouping and Tag cloud settings and the same Employee order and footer geometry as the live canvas, without rendering settings controls, group separators, or distribution overlays.

#### Scenario: Export reordered Tags
- **WHEN** Tags are manually reordered and an output is generated
- **THEN** all retained Tag values use the catalog order and PNG Employee rows match their live Unit sequence

#### Scenario: Export with a hidden Tag cloud
- **WHEN** the source View disables Show Tag cloud
- **THEN** PNG omits Unit footers and reserves no footer height while Employee Tag chips and report data remain available
