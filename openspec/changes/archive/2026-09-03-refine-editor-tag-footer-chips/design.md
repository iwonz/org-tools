## Context

The footer currently gives each chip an explicit width derived from character count with a large
constant reserve. The same value drives wrapping and PNG painting, so simply removing the width in
CSS would make the live card more compact but would desynchronize footer height, connections,
collision bounds, spatial indexing, and export.

## Goals / Non-Goals

**Goals:**

- Size ordinary footer chips closely to their visible label, separator, count, and fixed insets.
- Keep width and row packing deterministic in SSR, browser rendering, tests, and canvas export.
- Preserve the existing bounded width, ordering, colors, counts, and geometry integration.

**Non-Goals:**

- Changing Tag state, colors, assignments, counts, or catalog behavior.
- Changing Unit width, typography, card actions, or the number of screenshot scenarios.
- Adding runtime font measurement, new dependencies, storage, or network access.

## Decisions

Use a small deterministic glyph-width estimator for the 10 px footer typography. It assigns narrow,
regular, wide, whitespace, digit, and punctuation classes rather than multiplying every label by one
worst-case width. A fixed constant then accounts for the middle-dot/count segment and the same 8 px
inset on both sides. This is more accurate for mixed Latin, Cyrillic, Arabic, Chinese, and numeric
labels while remaining pure and stable before fonts load.

The resulting helper remains the only chip-width input to both row packing and rendering. Live DOM
chips keep the explicit computed width, and PNG painting uses the identical value. The width remains
capped to the available footer width so arbitrary user data cannot expand a Unit beyond its normal
bounds.

Alternative: allow CSS intrinsic width and measure the rendered footer through `ResizeObserver`.
Rejected because initial SSR and font-loading measurements could shift card bounds and introduce a
second geometry commit. Alternative: use `CanvasRenderingContext2D.measureText`. Rejected because
the selected PNG font can differ from the interface font and canvas is unavailable in pure/server
tests.

## Risks / Trade-offs

- [Risk] A deterministic estimator cannot exactly reproduce every font glyph. → Use conservative
  per-class metrics plus a small constant inset, and assert representative Latin, Cyrillic, Arabic,
  and CJK labels without the previous large reserve.
- [Risk] Narrower chips can change row counts and Unit height. → Keep row packing, bounds,
  connections, overlap handling, and PNG export on the same shared helper and cover the result in
  unit and browser tests.
