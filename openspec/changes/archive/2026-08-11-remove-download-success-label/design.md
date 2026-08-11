## Context

Two local save paths set the same translated `File downloaded` status after the browser starts a
download: the header workspace Export flow creates a global notice, and the Download workflow adds
an inline footer label. The browser download UI already communicates success. Clipboard operations
use the same local status slot in Download and still benefit from explicit confirmation.

## Goals / Non-Goals

**Goals:**

- Make successful file downloads visually silent in both local export flows.
- Clear a prior inline copy status when the user subsequently downloads a file.
- Keep error and clipboard feedback intact.
- Remove unused translations while preserving EN/RU catalog parity.

**Non-Goals:**

- Changing file contents, names, formats, or download timing.
- Removing image/text save messages from the separate Org Editor export dialog.
- Changing import notices, errors, or browser download behavior.

## Decisions

The workspace Export callback will continue clearing any global error but will no longer create a
notice. The Download workflow will set its local status to `null` after a successful save, ensuring a
previous copy confirmation cannot remain visible. The shared `File downloaded` localization entry
will be deleted from both catalogs because no runtime caller remains.

Removing all export status infrastructure was rejected because clipboard copy confirmation and
localized failure feedback still use it.

## Risks / Trade-offs

- [Users no longer see in-app save confirmation] -> The native browser download remains the source
  of confirmation, and browser tests continue to assert the actual downloaded filename.
- [A stale copy label could survive a later save] -> Explicitly clear the Download status when the
  save starts successfully.
