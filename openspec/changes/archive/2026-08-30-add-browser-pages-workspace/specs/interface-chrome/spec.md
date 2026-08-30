## MODIFIED Requirements

### Requirement: Navigation states are explicit and responsive
Product destinations SHALL retain their accessible Radix tab behavior and order inside a vertical
sidebar. The sidebar SHALL initialize in compact mode, SHALL remain transient rather than persisted,
and SHALL also own persistence selection, language, theme, Import, and workspace Export. SQLite mode
SHALL render the project switcher; browser mode SHALL render an equivalent single-file workspace
control. The content header SHALL contain only current workflow context and explicit Save status and
action. Expanded mode SHALL show icons and visible labels; compact mode SHALL show only icons while
preserving accessible names and hover tooltips. Active, hover, pressed, and focus states SHALL keep
the existing borderless stable-geometry visual system. Compact rows and the collapse control SHALL
keep the existing fixed icon axis and equal inline spacing. Persistence, theme, and language menu
items SHALL NOT translate or otherwise shift content during interaction.

#### Scenario: Initial desktop sidebar
- **WHEN** either runtime first renders at desktop width
- **THEN** the sidebar is a 64 px compact icon rail and its transient mode is not persisted

#### Scenario: SQLite persistence control
- **WHEN** the local server runtime renders the sidebar persistence item
- **THEN** project selection, management, and the shared Autosave checkbox remain available

#### Scenario: Browser persistence control
- **WHEN** the static Pages runtime renders the sidebar persistence item
- **THEN** filename, New, Open, Save As, and the shared Autosave checkbox replace project-only
  controls with the same geometry and accessible behavior

#### Scenario: Explicit Save feedback
- **WHEN** organization data is clean, dirty, saving, saved, failed, paused, or unbound
- **THEN** the header communicates the state without resizing the workflow title or adding a border,
  decorative shadow, or saturated accent

#### Scenario: Responsive shell containment
- **WHEN** either runtime renders at 390, 1024, or 1280 px wide
- **THEN** the sidebar persistence control, Save action, and global actions remain reachable without
  horizontal overflow

## ADDED Requirements

### Requirement: Autosave is explicit and consistent
The SQLite project popover and browser file popover SHALL expose the same accessible Autosave
checkbox, SHALL default it to off, and SHALL keep manual Save available regardless of the choice.

#### Scenario: Toggle Autosave
- **WHEN** the user changes the checkbox
- **THEN** only the bounded preference changes immediately and the control does not shift or resize
