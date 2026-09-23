## Why

Employee display formats currently discard intentional blank rows, truncate long text, and use
fixed spacing that cannot be tuned per destination. The Employee model also mixes Employee-owned
and Unit-context tokens, while `isBoss` still depends on a separate image-export label instead of
the existing conditional grammar.

## What Changes

- Add explicit blank rows, word and character wrapping, and a 0-24 pixel line-gap setting for each
  Employee, Unit, Editor, and Editor-image display format.
- Keep Editor DOM geometry and Editor PNG layout aligned for wrapped text, semantic Tag and
  assignment groups, blank rows, hit testing, anchors, and Unit bounds.
- Separate Employee-owned and Unit-context built-in tokens in the Employee model and expose only
  resolvable Employee tokens to custom Template fields.
- Make `isBoss` a condition-only boolean token, remove the separate image-export boss label, and
  put the localized manager text directly in new-organization default ternaries.
- **BREAKING**: add required `organization.employeeDisplayLineGaps` to the exact State contract;
  obsolete State is rejected and the owned SQLite snapshot is converted once offline.
- Keep all rendering, persistence, conversion, and synchronization local. No remote requests,
  telemetry, or organization-data transmission are introduced.
- Do not add runtime compatibility for old State or automatically rewrite saved formats after
  they have the new State shape.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `employee-model`: Define wrapped rich display rows, per-format line gaps, contextual field
  grouping, and condition-only `isBoss` behavior.
- `organization-editor`: Keep Editor DOM and PNG geometry equal for the new line layout.
- `single-state-runtime`: Require and persist the four line-gap values in the strict State.
- `state-transfer`: Round-trip the new exact organization field and reject obsolete transfers.
- `interface-localization`: Localize the new controls, field groups, and default boss literal while
  removing obsolete boss-label copy.

## Impact

The change affects shared Employee display rendering, Employee model controls, Editor layout and
Canvas export, image-export settings, MobX state, strict parsing, SQLite persistence, state transfer,
BroadcastChannel synchronization, all six message catalogs, browser coverage, screenshots, and
architecture, usage, performance, privacy, and screenshot documentation. The configured owned
SQLite database requires one timestamped backup and one offline current-shape conversion.
