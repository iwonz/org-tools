## Context

The shell already uses one root background and avoids most horizontal rules, but visual hierarchy is still implemented through several nested surface systems: bordered segmented tabs, a bordered global-action group, rounded workflow wrappers, filled Analytics groups, and bordered Editor tool islands. These patterns compete with one another and make otherwise related content appear fragmented.

The change is cross-cutting because the same visual contract is implemented by shared primitives, workflow-specific containers, browser assertions, and screenshot documentation. It does not alter application state or data flow. The privacy boundary remains entirely in the browser, and no new dependency or network behavior is introduced.

## Goals / Non-Goals

**Goals:**

- Establish one continuous white page in the light theme and one continuous dark neutral page in the dark theme.
- Make navigation, actions, workflow layout, repeated rows, and Analytics sections feel spacious without enclosing decorative surfaces.
- Preserve unambiguous active, hover, focus, error, destructive, and disabled states.
- Keep the Org Editor canvas visually distinct with a neutral gray canvas background.
- Apply the policy through shared primitives wherever possible and verify it across all six workflows.

**Non-Goals:**

- Removing borders from fields, dialogs, popovers, calendar cells, choice cards, focus states, errors, hierarchy guides, or canvas data nodes.
- Changing density, control sizes, information architecture, workflows, data contracts, localization, or persistence.
- Making the dark theme white or removing the existing theme switcher.
- Redesigning the content of Employee, Team, Calendar, import, export, or analytics workflows.

## Decisions

### Use one root surface token and a separate canvas token

The light `shell` token will equal the white `background` token. The dark shell remains equal to the dark background. A separate `canvas` token will represent the Org Editor workspace: a soft neutral gray in light mode and a slightly differentiated dark neutral in dark mode. This makes the canvas distinction explicit instead of recreating a general page island.

Using a dedicated canvas token is preferred over a one-off utility color because screenshots and both themes can validate the intended exception. Keeping the current gray shell everywhere was rejected because it conflicts with the requested white product surface.

### Flatten shared navigation and tab primitives

The shared Tabs list will no longer own a border, fill, clipping, or rounded container. Triggers will be separated by a small gap and remain transparent. Active state will use foreground color and stronger weight; hover uses a transient subtle background and focus retains the existing ring. The application header actions use the same flat spacing model without a shared enclosing boundary.

An underline was rejected because the active product tab has already been explicitly defined without one. A persistent filled active pill was rejected because it recreates the button-like island treatment.

### Remove layout surfaces at workflow boundaries

The shared top-level workflow wrapper becomes a geometry-only container without radius, fill, or clipping semantics. Workflow roots can still own scrolling and layout, but not decorative enclosure. Teams, Employees, Analytics, Calendar, and Download place their content directly on the root surface. Ordinary repeated rows also use the page background rather than card fill.

The existing component can keep its exported name during implementation to avoid unrelated churn, but its data slot and tests will describe a product surface rather than an island. A later mechanical rename is optional and not required for user-visible correctness.

### Retain only semantic boundaries

Borders and owned surfaces remain when they communicate an actual object or interaction boundary: input fields, dialogs, popovers, selectable operation cards, calendar cells, destructive controls, focus/error states, hierarchy guides, and Editor Team nodes. These are not treated as layout islands.

Analytics group fills and outer borders will be removed. Group titles, compact gaps, column alignment, hover/focus rows, and bounded internal scrolling continue to communicate structure. Calendar cells remain bounded because their grid position is semantic.

### Flatten Editor controls but preserve canvas objects

Top-left and bottom-left Editor tool groups lose their enclosing background, border, radius, and backdrop blur. Controls keep accessible hover/focus/open states and their established placement. The canvas uses the dedicated canvas token, while Team nodes, search results, popovers, drag indicators, and selection rectangles keep their necessary surfaces.

### Verify behavior through computed visual assertions

Browser tests will assert that shared tab lists, header action groups, top-level product surfaces, Analytics groups, and Editor tool groups have transparent or root-matching backgrounds and no decorative outer border. The tests will separately assert retained borders for inputs, calendar cells, dialogs, and selectable/destructive cards. Existing workflow and accessibility assertions remain unchanged.

## Risks / Trade-offs

- [Flat controls can become difficult to distinguish] → Preserve spacing, icons, typography, hover/open feedback, focus rings, and accessible labels; verify light and dark screenshots.
- [Removing clipping may expose child overflow] → Keep overflow only where it is functionally required by scrolling or virtualization, not for rounded-corner decoration.
- [A global Tabs change can affect dialogs and Download] → Audit every Tabs usage and validate nested workflows in both locales and narrow viewports.
- [White surfaces can reduce row separation] → Use compact whitespace and hover/focus feedback; retain meaningful object boundaries where rows represent standalone cards.
- [Editor controls may visually blend into the gray canvas] → Keep individual control interaction states and validate sufficient contrast against the dedicated canvas token.

## Migration Plan

1. Update tokens and shared shell/tab/workflow primitives.
2. Flatten workflow-specific rows, Analytics groups, Download overlays, and Editor control groups.
3. Update browser assertions, deterministic screenshots, capability specs, and documentation.
4. Run the complete validation suite and visually review supported widths in both themes and locales.

Rollback is a normal source revert because no persisted data or public contract changes.

## Open Questions

None.
