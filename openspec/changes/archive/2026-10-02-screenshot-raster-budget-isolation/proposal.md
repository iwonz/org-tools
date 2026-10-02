## Why

The strict main gallery exposed a false determinism failure in `demo-teams.png`: 242 one-channel antialiasing pixels and 24 pixels inside the explicitly marked boss-marker raster region shared one 256-pixel allowance. Each category stayed within its established bound, but their unrelated aggregate exceeded it by ten pixels.

## What Changes

- Account for ordinary bounded antialiasing and explicitly scoped raster noise independently.
- Keep both existing 256-pixel limits and the three-channel-delta threshold unchanged.
- Continue rejecting any large delta outside a declared raster-noise region.
- Add regression coverage for combined noise that is valid in each category and for independent budget overflow.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-tooling`: clarify that ordinary antialiasing and declared raster-noise regions have independent bounded budgets while complete passes still produce exact matching output files.

## Impact

Only the screenshot pixel comparator, its tests, validation documentation, and the project-tooling specification change. Runtime behavior, State, PostgreSQL, UI, localization, and screenshot visuals do not change.
