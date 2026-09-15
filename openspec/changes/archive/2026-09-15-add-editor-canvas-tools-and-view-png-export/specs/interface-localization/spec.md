## ADDED Requirements

### Requirement: Canvas tools and View Image export are completely localized
The product SHALL provide complete non-empty entries with identical placeholders in all six locale
catalogs for every visible or accessible canvas-tool name, property, alignment, layer, marker,
status, validation error, image-limit message, dimension label, density label, clamp warning, and
Copy/Save action. Tool buttons, icon-only controls, anchors, transform handles, color controls, and
export actions SHALL expose localized accessible names and keyboard focus without placing translated
copy in source code.

#### Scenario: Use canvas tools in every locale
- **WHEN** each supported locale opens the tools surface, contextual properties, image error, and full-View export dialog
- **THEN** all visible and assistive copy is localized, non-empty, placeholder-compatible, and free of fallback keys
