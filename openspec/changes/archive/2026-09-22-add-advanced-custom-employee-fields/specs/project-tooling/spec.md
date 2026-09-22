## ADDED Requirements

### Requirement: Advanced fields and paste arbitration are regression tested
Automated checks SHALL cover exact state parsing, definition and value validation, filters, Template and JSON output, mapped Import, Calendar indexing, accessible switches, custom-option commits, and keyboard paste event ordering while retaining the 20,000 Employee and 4,000 Unit target.

#### Scenario: Run the publication checks
- **WHEN** the full repository validation lifecycle runs
- **THEN** advanced-field workflows and single-paste behavior pass in both server and browser-only runtimes without console, resource, localization, or privacy failures
