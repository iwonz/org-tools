## Why

New organizations and explicit Display resets currently use a four-pixel line gap and verbose multiline Employees and Units formats. The maintained defaults should instead show the three primary semantic values together and use five-pixel spacing wherever multiple format blocks exist.

## What Changes

- Set the default Employee display line gap to 5 pixels for Employees, Units, Editor, and Editor export.
- Set the default Employees and Units format to `**{fullName}** {positions} {tags}` on one authored line.
- Apply the new values to blank State creation and per-format Reset behavior.
- Update fixtures, tests, documentation, specifications, and the maintained screenshot gallery.

Existing saved organizations retain their current formats and line gaps. The exact State shape, validation range, imports, exports, localization catalogs, SQLite schema, privacy boundaries, and rendering semantics do not change.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `employee-model`: Change the maintained defaults used for new organizations and Display resets.

## Impact

The Employee display default factory, blank State fixtures, reset expectations, browser coverage, documentation, and screenshots are affected. No runtime dependency, data migration, or network behavior is introduced.
