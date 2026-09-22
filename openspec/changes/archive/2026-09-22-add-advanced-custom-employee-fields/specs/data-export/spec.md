## ADDED Requirements

### Requirement: Advanced custom fields retain their output structure
Structured JSON SHALL export multi-option values as label arrays and Composite values as ordered arrays of typed objects named by their configured subfields. Template output SHALL render multi-option labels in stored order and Composite records as deterministic JSON text. Missing advanced values SHALL emit null in JSON and empty text in Template output.

#### Scenario: Export advanced values
- **WHEN** selected Employees contain multi-option and Composite values
- **THEN** preview, Copy, Download, and Editor JSON use the same complete typed representation
