## Why

A successful local download is already confirmed by the browser, so the additional `File downloaded`
label adds noise and can leave stale status copy visible in the interface.

## What Changes

- Complete workspace Export downloads without showing a global success notice.
- Complete Download-tab file saves without showing an inline success label.
- Keep localized errors and clipboard-copy confirmations unchanged.
- Remove the now-unused English and Russian `File downloaded` message.
- Preserve download contents, filenames, dialogs, and all public data contracts.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `structured-save`: successful workspace downloads close silently without a global success notice.
- `data-export`: successful file downloads do not create an inline status label, while copy feedback
  remains available.

## Impact

The change affects the workspace Export completion callback, the Download-tab local status state,
both bundled message catalogs, browser assertions, and usage documentation. It adds no dependency,
network behavior, persistence, or schema change.
