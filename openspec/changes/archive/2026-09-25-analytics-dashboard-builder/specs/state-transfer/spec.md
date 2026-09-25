## ADDED Requirements

### Requirement: Complete transfer includes analytics configuration
Complete State Export and Import SHALL include valid dashboard definitions and current bounded analytics UI state. Import MUST reject invalid widget unions, dangling View/custom-field/widget references, incompatible filter targets, or limit violations atomically.

#### Scenario: Import dashboards atomically
- **WHEN** a complete current State contains valid dashboards and UI selections
- **THEN** all definitions and interaction state replace the current State together and results calculate locally on demand

