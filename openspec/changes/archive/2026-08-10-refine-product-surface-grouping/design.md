## Context

The product shell has a coherent top-level tab island, but nested Radix tab groups still use the
older padded-pill default and Download overrides it again. Teams and Download retain vertical pane
rules that no longer match the borderless shell. Employee lists intentionally removed row rules but
still leave four pixels of shell background between every card. Analytics sections retained their
content sizing and borderless rows while losing the background surfaces needed to scan six groups.

The implementation must preserve localization, keyboard semantics, virtualization, responsive
containment, and the 20,000 Employee / 4,000 Unit interaction target.

## Goals / Non-Goals

**Goals:**

- Establish one segmented-switcher style for every Radix tab list and trigger.
- Remove decorative panel separators from Teams and Download without changing their grid layout.
- Make Employee lists continuous and move their count directly below search.
- Restore subtle, borderless Analytics group surfaces without reintroducing rule-heavy cards.
- Preserve virtualized list measurements and accessible tab/search behavior.

**Non-Goals:**

- Changing product navigation order, tab values, search/filter logic, or Download behavior.
- Adding separators, shadows, new colors, dependencies, storage, or network activity.
- Changing organization state, import/export contracts, or Employee data.

## Decisions

### Make the shared Tabs primitive the switcher source of truth

`TabsList` owns one rounded boundary, a quiet surface, zero gap, and clipping. `TabsTrigger` owns a
transparent square segment with a flat accent fill when selected. Component-specific classes may
change width, grid layout, label size, or height, but do not recreate a different visual treatment.
The top-level product tabs use the same exported class foundations with only header-specific sizing.

Keeping per-feature switcher classes was rejected because it would continue visual drift and make
future fixes require auditing every call site.

### Remove pane rules without replacing them with decorative substitutes

The existing CSS grid columns, independent headers, search controls, and content backgrounds already
communicate the two panes. Removing `border-r` is sufficient; no shadow, divider, or colored gutter
is added.

### Render list Employee cards as contiguous virtual rows

The virtualizer gap becomes zero and the normal list variant loses individual corner rounding.
Compact cards used in previews and nested pickers retain their current shape. Existing row padding,
content hierarchy, and actions remain unchanged. This removes empty strips without adding row rules.

### Keep counts inside the search column

The populated Employees header becomes a search column plus the Create action. Total and match
counts render as a small line directly below the search control. Existing demo identifiers and
reactive count logic remain stable for browser tests and accessibility inspection.

### Give Analytics groups a quiet card surface

Each content-sized Analytics section receives `bg-card`, rounded outer corners, and 12 px internal
padding with no border or shadow. The explicit section height adds the vertical padding so the table
viewport still exposes the same number of 42 px rows and virtualization behavior remains unchanged.
Sticky table headers use the card surface instead of the shell surface.

## Risks / Trade-offs

- [Contiguous Employee rows could merge visually] -> Preserve generous row padding, identity
  hierarchy, card background, and action placement while avoiding decorative rules.
- [Global tab defaults could break specialized grids] -> Keep layout classes mergeable and cover
  Download plus representative dialog switchers in browser tests.
- [Analytics padding could reduce virtualized space] -> Add padding to the computed outer height so
  the internal visible-row cap remains identical.
- [Removing pane rules could weaken separation] -> Retain the existing two-column geometry,
  independent headers, and distinct content groupings.
