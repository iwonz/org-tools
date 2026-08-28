## 1. Shared visual system

- [x] 1.1 Define paired light/dark color, typography, radius, focus, and surface tokens and apply the
  bundled UI font without changing export font options.
- [x] 1.2 Update shared button, field, tab, card, dialog, product-surface, and empty-state primitives
  with consistent hierarchy and interaction states.
- [x] 1.3 Refresh the unified header, active navigation, responsive overflow, global actions, and
  semantic status feedback.

## 2. Product workflows

- [x] 2.1 Apply full-bleed working surfaces, tonal split-pane grouping, scan-friendly contiguous
  rows, and action hierarchy to Teams, Employees, and Download.
- [x] 2.2 Apply borderless tonal section grouping and compact table hierarchy to Analytics without changing
  sorting, drill-down, virtualization, or row caps.
- [x] 2.3 Apply the shared workflow treatment to Calendar while preserving adaptive month geometry,
  day actions, event clouds, and narrow overflow behavior.
- [x] 2.4 Refresh Editor toolbars, canvas contrast, nodes, selections, and overlays without changing
  document state, coordinates, drag behavior, or PNG geometry.

## 3. Documentation and regression coverage

- [x] 3.1 Update usage, screenshot, architecture, privacy, and performance documentation where the
  new visual hierarchy changes documented behavior or verification language.
- [x] 3.2 Replace flat-chrome browser assertions with responsive tonal hierarchy, explicit
  navigation, pane-grouping, dialog, repeated-row, light-theme, and dark-theme coverage.
- [x] 3.3 Regenerate and inspect every affected deterministic gallery screenshot for hierarchy,
  density, localization, synthetic data, and visual regressions.

## 4. Validation

- [x] 4.1 Run formatting checks, lint, typecheck, and unit tests and resolve every regression.
- [x] 4.2 Run the production build and complete browser smoke suite, including responsive and Russian
  scenarios.
- [x] 4.3 Run strict OpenSpec validation after all task checkboxes are complete.
- [x] 4.4 Run the publication-safety scan against the completed production build.

## 5. Interaction and typography refinement

- [x] 5.1 Enforce the bundled Inter UI font across native controls, placeholders, portals, and
  code-like UI surfaces while preserving explicit image-export font previews.
- [x] 5.2 Add paired light/dark signal, depth, and motion tokens with reduced-motion behavior while
  retaining graphite primary actions and semantic status colors.
- [x] 5.3 Remove decorative button borders and simplify selectable controls so each resting,
  selected, hover, active, and focus state has one dominant visual cue.
- [x] 5.4 Replace boxed tab states and coarse hover fills with signal rails, restrained tonal washes,
  pressed feedback, and consistent menu/list interaction states.
- [x] 5.5 Extend documentation and browser assertions for computed typography, border budgeting,
  active rails, pressed feedback, and reduced-motion behavior.
- [x] 5.6 Add geometry-stable transient hairlines to hover and pressed states for buttons, tabs,
  selectable cards, and dense rows without restoring permanent decorative borders.

## 6. Refinement validation

- [x] 6.1 Run formatting checks, lint, typecheck, and unit tests and resolve every regression.
- [x] 6.2 Run the production build, complete browser smoke suite, and regenerated screenshot gallery;
  inspect every affected visual state in light and dark themes.
- [x] 6.3 Run the publication-safety scan and strict OpenSpec validation after all refinement tasks
  are complete.

## 7. Reference-aligned application shell

- [x] 7.1 Replace the horizontal product menu with a dark collapsible sidebar containing the six
  product destinations plus language, theme, Import, and workspace Export actions.
- [x] 7.2 Implement expanded icon-and-label and compact icon-only modes with localized accessible
  names, hover tooltips, stable active workflow state, and compact narrow-viewport behavior.
- [x] 7.3 Remove decorative hover, active, and selected borders or inset hairlines from shared
  controls, nested tabs, menus, selectable cards, and dense rows while preserving keyboard focus
  and semantic field, calendar, preview, canvas, drag, error, and destructive boundaries.
- [x] 7.4 Update English documentation, localized sidebar copy, and browser assertions for the new
  shell, borderless pointer states, responsive containment, and reduced-motion behavior.

## 8. Sidebar validation

- [x] 8.1 Run formatting, lint, typecheck, and unit tests and resolve every regression.
- [x] 8.2 Run the production build, full browser smoke suite, and regenerated screenshot gallery;
  inspect expanded, compact, light, dark, dialog, and dense-workflow states.
- [x] 8.3 Run the publication-safety scan, strict OpenSpec validation, and final diff checks after all
  sidebar tasks are complete.

## 9. Final interaction and geometry refinement

- [x] 9.1 Remove added hover elevation and the decorative Org Tools glyph, keep theme and language
  menu-row geometry stable, and refine the sidebar collapse control and compact icon centering in
  every responsive mode with a continuous, jump-free right-edge transition.
- [x] 9.2 Implement one adaptive visible Editor grid derived from the shared document-space snap
  step, viewport scale, and viewport origin.
- [x] 9.3 Snap every explicit coordinate-producing Editor operation, including drag, add, import,
  paste, overlap avoidance, subtree relayout, and full arrangement, and add focused geometry tests.
- [x] 9.4 Unify Analytics group, header, and row-viewport backgrounds and update usage, architecture,
  performance, screenshot, and browser assertions for the refined behavior.

## 10. Final refinement validation

- [x] 10.1 Run formatting checks, lint, typecheck, and unit tests and resolve every regression.
- [x] 10.2 Run the production build, full browser smoke suite, and regenerated screenshot gallery;
  inspect sidebar pointer states, menu geometry, adaptive Editor grid, and Analytics in light and
  dark themes.
- [x] 10.3 Run the publication-safety scan, strict OpenSpec validation, and final diff checks after
  all refinement tasks are complete.

## 11. Utilitarian interaction palette

- [x] 11.1 Replace the violet light/dark signal, interaction surfaces, shell cast, and sidebar active
  tone with a restrained steel-blue and low-chroma blue-gray token set while retaining graphite
  primary actions and semantic destructive and event colors.
- [x] 11.2 Update interface documentation and browser assertions, regenerate the screenshot gallery,
  and inspect representative selected, focus, light, and dark states for residual violet UI chrome.
- [x] 11.3 Run formatting, lint, typecheck, unit, production browser, publication-safety, strict
  OpenSpec, and final diff validation for the palette refinement.

## 12. Stable pressed geometry and shadow budget

- [x] 12.1 Remove pressed scaling, rotation, and translation from shared buttons, tabs, checkboxes,
  close controls, and menu rows; use tone and foreground contrast without changing geometry.
- [x] 12.2 Remove decorative shadows from ordinary controls, selected rows, cards, shell chrome,
  Editor nodes and toolbars, retaining only restrained depth on true overlay layers.
- [x] 12.3 Remove the visible Org Tools sidebar title and align the collapse row, padding, icon size,
  and icon coordinate with navigation and action items in expanded and compact modes.
- [x] 12.4 Update documentation and browser assertions, regenerate and inspect the screenshot
  gallery, then run formatting, lint, typecheck, unit, production browser, publication-safety,
  strict OpenSpec, and final diff validation.
