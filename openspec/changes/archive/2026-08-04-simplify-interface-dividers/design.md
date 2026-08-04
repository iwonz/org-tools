## Context

The interface currently applies one-pixel rules at multiple nested levels: the app shell, surface
headers, dialog header/footer primitives, local sections, and virtualized rows. Many of those rules
repeat a boundary already communicated by spacing, background, an enclosing card, or an interaction
state. Because Dialog and AlertDialog primitives are shared, the cleanup must be systematic rather
than a collection of one-off overrides.

## Goals / Non-Goals

**Goals:**

- Establish one observable policy for decorative versus meaningful borders.
- Remove decorative horizontal and row rules across every product surface and overlay.
- Preserve scroll behavior, virtualization measurements, focus treatment, responsive layout, and
  all organization workflows.
- Keep meaningfully bounded controls, cards, dialogs, calendar cells, split panes, and hierarchy
  guides readable in both themes.

**Non-Goals:**

- Redesign the color palette, density, typography, control sizes, or product navigation.
- Remove all borders or flatten interactive and destructive states.
- Change state, import, export, localization, persistence, or network behavior.

## Decisions

### Remove dialog rules in shared primitives

DialogHeader, DialogFooter, AlertDialogHeader, and AlertDialogFooter lose their border classes at
the primitive layer so every modal follows the same policy. Existing padding and opaque backgrounds
keep headings and fixed actions legible next to scrollable content. This is preferred to per-dialog
overrides, which would leave inconsistent surfaces and future regressions.

### Replace rules with existing layout signals

Shell and surface headers keep their height, padding, and background. List rows keep their padding,
hover and focus feedback. Local sections receive spacing where removal would otherwise collapse two
groups. Import mode remains visually separate through its heading, whitespace, responsive
selectable cards, selected state, and destructive state rather than a top rule.

### Preserve meaningful boundaries

Outer dialog and card outlines, form controls, calendar cells, selectable cards, vertical split-pane
borders, tree hierarchy guides, focus rings, error treatment, and destructive treatment remain.
These borders communicate hit areas, independent regions, or relationships rather than decorating
document flow.

### Keep virtualization geometry stable

Virtual rows retain their declared or measured height after border removal. No data shape, key,
estimate, or scroll-container ownership changes. Browser checks cover large import previews and
representative filter/tag lists to catch measurement or reachability regressions.

## Risks / Trade-offs

- [Long dialog actions blend into content] → Keep footer padding and background, then inspect scrolled Import, Export, and Employee dialogs at desktop and narrow widths.
- [Lists lose scanability] → Retain aligned columns, whitespace, hover/focus backgrounds, and enclosing viewport boundaries.
- [Broad primitive edits affect every modal] → Add assertions against shared data-slot markers and inspect representative normal and destructive dialogs in both themes.
- [Calendar or import gains page overflow] → Preserve existing container dimensions and rerun maintained 1280×720 and 390 px viewport checks.

## Migration Plan

Apply shared primitive changes first, then surface and row cleanup, update assertions and gallery
images, and validate the production build. Rollback is the normal version-control revert; no stored
data or file migration exists.

## Open Questions

None.
