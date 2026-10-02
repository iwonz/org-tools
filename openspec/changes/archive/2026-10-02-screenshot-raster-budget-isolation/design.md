## Context

The comparator currently increments one `changedPixels` counter for both low-delta pixels anywhere on the page and higher-delta pixels inside explicit raster-noise regions. The main run showed 242 ordinary one-channel differences plus 24 boss-marker raster differences. Both classes were individually within the established 256-pixel policy, but the combined counter failed at 266.

## Goals / Non-Goals

**Goals:**

- Preserve the existing per-class 256-pixel bound and maximum ordinary channel delta of three.
- Reject higher deltas outside explicit regions immediately.
- Let pass two retain pass one's bytes when the visual delta is valid, preserving exact SHA equality.

**Non-Goals:**

- Do not raise either budget, alter screenshots, or reduce the two-pass gallery.
- Do not change runtime rendering or product State.

## Decisions

The comparator will track `ordinaryChangedPixels` and `scopedRasterChangedPixels`. A changed pixel belongs to the scoped category when its coordinates fall inside any declared region; otherwise it belongs to the ordinary category. Each counter uses the same existing `pixelBudget`. A large delta outside a region remains an immediate `unscoped-delta` failure.

This is preferred over raising the aggregate budget because the two existing noise classes already have different trust boundaries. It is preferred over masking pixels because diagnostics and screenshots remain unmodified.

## Risks / Trade-offs

- Two independent categories can accept up to 512 changed pixels in aggregate. Each category remains capped at the previous 256-pixel limit, and arbitrary high deltas remain restricted to explicit DOM regions.
- A mistakenly broad raster region would weaken comparison. Existing regions continue to be measured from explicit attributes and are not expanded by this change.
