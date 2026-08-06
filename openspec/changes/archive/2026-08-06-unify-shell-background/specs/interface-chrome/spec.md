## MODIFIED Requirements

### Requirement: Application chrome is separated without decorative rules
The application SHALL use one borderless 56 px header, a continuous theme-aware neutral shell
background, spacing, background grouping, and control layout instead of decorative horizontal rules
in the main shell, status bands, product surface headers, and local section headers. The header
SHALL contain a horizontally containable product-tab region on the left and a fixed global-action
region on the right. The root shell, transparent header, and all six top-level product surfaces
SHALL share the shell background, while meaningful cards, fields, dialogs, popovers, calendar cells,
and interactive controls retain their own bounded surface treatment.

#### Scenario: Populated product surface
- **WHEN** a populated product surface renders below the unified app header
- **THEN** the header and surface share one continuous shell background without a separate tab row, white header strip, shadow, or horizontal divider line

#### Scenario: Status band
- **WHEN** an error or informational status appears
- **THEN** its owned background and text treatment distinguish it without a bottom rule

#### Scenario: Responsive header containment
- **WHEN** the application renders at 390, 1024, or 1280 px wide
- **THEN** global actions remain reachable, tab overflow remains inside its navigation region, and the page has no horizontal overflow

#### Scenario: Meaningful surface contrast
- **WHEN** the continuous shell renders in light or dark theme
- **THEN** cards, fields, dialogs, popovers, calendar cells, and interactive controls remain visually distinct from the shell without adding a header separator
