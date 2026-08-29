## MODIFIED Requirements

### Requirement: Navigation states are explicit and responsive
Product destinations SHALL retain their accessible Radix tab behavior and order inside a vertical
sidebar. The sidebar SHALL initialize in compact mode, SHALL remain transient rather than persisted,
and SHALL also own language, theme, Import, and workspace Export so the content header contains no
application menu or global actions. Expanded mode SHALL show an icon and visible label for each
destination or action; compact mode SHALL show only icons while preserving accessible names and hover
tooltips. The active destination SHALL use stronger foreground and a tonal surface, pointer hover
SHALL use a low-opacity tonal wash, pressed state SHALL remain visually responsive, and keyboard
focus SHALL remain explicitly visible without layout shift or a pointer-state border. Compact rows
SHALL center their icons within the rail with equal inline space. The desktop collapse control SHALL
use a 40 px square footprint near the panel's left edge, equal inline space around its 20 px icon,
and the same fixed icon axis as navigation and action rows in both sidebar modes. It SHALL keep its icon
distinguishable from its background in every interaction state and SHALL NOT span the expanded
sidebar width. The shell SHALL NOT render a decorative Org Tools glyph or a visible Org Tools title.
Theme and language menu items SHALL NOT translate or otherwise shift their content when highlighted,
focused, selected, or pressed. Collapsing or expanding SHALL animate only the sidebar's right edge
and clipped label visibility; navigation and action icons SHALL keep one horizontal coordinate, and
neither icons nor the toggle SHALL discretely jump between alignment modes.

#### Scenario: Initial desktop sidebar
- **WHEN** the application first renders at a desktop width
- **THEN** the sidebar is a 64 px compact icon rail
- **AND** the transient mode has not been written to workspace data or browser storage

#### Scenario: Active product tab
- **WHEN** one of the six product tabs is active in either theme
- **THEN** its stronger foreground and tonal surface distinguish it from inactive destinations
  without a border, inset hairline, saturated button treatment, or reliance on font weight alone

#### Scenario: Nested navigation
- **WHEN** a nested tab group renders in Download, a dialog, or another workflow
- **THEN** it uses the same borderless tonal active, hover, disabled, and keyboard-focus language at
  the appropriate compact size

#### Scenario: Expanded and compact sidebar
- **WHEN** a desktop user toggles the sidebar mode
- **THEN** the shell switches between a labelled navigation panel and an icon-only rail without
  changing the current product workflow or organization data
- **AND** compact icons expose localized accessible names and pointer tooltips
- **AND** every compact icon is visually centered with equal left and right row space

#### Scenario: Stable sidebar menus and collapse control
- **WHEN** a pointer highlights the collapse control or a theme or language menu item
- **THEN** the collapse icon remains visible on the same horizontal icon axis as product navigation
  without rendering an Org Tools title
- **AND** the collapse control remains a left-aligned 40 px square in the expanded sidebar
- **AND** menu-item content keeps the same position before, during, and after interaction

#### Scenario: Continuous sidebar collapse
- **WHEN** a desktop user collapses or expands the sidebar without reduced motion
- **THEN** the right edge moves monotonically between 240 and 64 px while row icons keep their
  horizontal coordinate and labels clip and fade within the changing width
- **AND** the collapse icon keeps the same horizontal coordinate throughout the transition

#### Scenario: Responsive shell containment
- **WHEN** the application renders at 390, 1024, or 1280 px wide
- **THEN** the sidebar and global actions remain reachable, narrow layouts preserve an icon-only
  rail, the content workspace keeps usable width, and the page has no horizontal overflow
