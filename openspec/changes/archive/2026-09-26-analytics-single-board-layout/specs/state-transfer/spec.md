## MODIFIED Requirements

### Requirement: Complete transfer includes analytics configuration
Complete State Export and Import SHALL include the exact singleton Analytics configuration and current bounded Analytics UI state. Import MUST reject dashboard collections, panels, filter widgets, invalid tab membership, dangling View/custom-field/filter/widget references, incompatible targets, or limit violations atomically.

#### Scenario: Import singleton Analytics atomically
- **WHEN** a complete current State contains valid filters, optional tabs, widgets, and UI selections
- **THEN** all Analytics definitions and interaction state replace the current State together and results calculate locally on demand
