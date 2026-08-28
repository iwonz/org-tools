## Why

The repository already produces a deterministic synthetic screenshot set, but the README hides it
behind a documentation link and mixes the first-run path with contributor details. A concise visual
demo should let visitors understand the product first, inspect full-size screenshots, and start the
application locally without reading the internal documentation.

## What Changes

- Replace the README introduction with a short, outcome-focused product summary.
- Add a compact screenshot gallery whose previews link to full-size deterministic PNGs for the
  hosting platform's image viewer.
- Reduce local setup to the required Node.js, pnpm, install, and development commands.
- Keep detailed contributor, privacy, architecture, and screenshot-generation guidance in the
  existing linked documents rather than duplicating it in the README.
- Do not change the browser application, organization state, exports, imports, persistence, network
  behavior, dependencies, or screenshot fixture data.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-tooling`: Require the publication-ready README to provide a concise product overview,
  linked full-size screenshot gallery, and minimal local-start instructions backed by the
  deterministic synthetic PNG set.

## Impact

- Affected files: `README.md`, the project-tooling capability specification, and screenshot
  documentation if the public gallery contract needs clarification.
- Privacy: no new data path; only existing obviously synthetic local screenshots are published.
- Compatibility: no runtime, API, state-file, export, or import compatibility impact.
- Non-goals: adding an interactive application demo, JavaScript to the README, remote image hosting,
  video, telemetry, or additional package dependencies.
