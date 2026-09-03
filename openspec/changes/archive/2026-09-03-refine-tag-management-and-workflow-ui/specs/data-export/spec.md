## ADDED Requirements

### Requirement: Editor PNG preserves Tag catalog colors
Editor PNG preview, copy, and download SHALL paint every Employee Tag with the catalog's neutral,
named, or canonical custom color as a restrained tonal fill and contrast-safe foreground. Alpha
colors SHALL resolve deterministically without DOM or network access. Color rendering MUST preserve
complete labels, localized dates, wrapping, row heights, Unit bounds, and connection geometry.

#### Scenario: Export named and custom Tag colors
- **WHEN** an exported roster contains neutral, named, six-digit, and alpha-bearing custom Tags
- **THEN** the PNG uses the corresponding readable Tag treatments instead of one shared gray fill

#### Scenario: Preserve wrapped colored Tags
- **WHEN** a colored Tag label wraps across multiple lines
- **THEN** its entire chip uses one color pair and existing measured layout remains aligned
