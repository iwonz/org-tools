## Context

Blank-canvas primary-button gestures currently clear Editor selection during pointer-down and only then enter the shared pan state. Distribution paths are derived from exactly one selected Employee, so they disappear before the user can reveal an off-screen target. Distribution mode already supports bounded multi-Unit toggles, but the context menu passes only selected IDs even though the Editor has a cycle-safe descendant traversal. The cross-View clipboard is already transient and shared by Editor stores; paste arbitration currently checks an operating-system image before that clipboard and therefore cannot know which source was copied last.

## Goals / Non-Goals

**Goals:**

- Classify a blank-canvas primary gesture before clearing selection.
- Offer direct and descendant-closure scopes through one accessible context submenu.
- Make keyboard paste follow the last actual clipboard owner without placing organization content in the operating-system clipboard.
- Preserve one write per completed viewport gesture, one paste per gesture, and current large-View bounds.

**Non-Goals:**

- Persist clipboard payloads or tokens, synchronize them between tabs, or make Editor structures portable to other applications.
- Change the exact State shape, Unit document, history model, distribution PNG rules, or image validation.
- Add automatic viewport movement to a distribution target.

## Decisions

### Defer blank-canvas deselection until pointer release

Primary-button blank-canvas pan state will record that a short click may clear selection. Pointer release compares the existing drag threshold: a short gesture clears selection after committing the no-op viewport, while a real pan keeps selection. Middle-button pan and cancellation never clear selection. This preserves ordinary blank-click behavior without adding another interaction mode.

### Derive distribution scopes once per open Unit menu

The direct scope is the context menu's selected Unit IDs. The recursive scope is their cycle-safe descendant union filtered back into active View order. Both feed the existing checked/mixed/unchecked reducer and update `distributionModeUnitIds` once. A reusable submenu follows the established Tag submenu placement, pointer, keyboard, focus, Escape, and RTL behavior.

### Stamp transient Editor clipboard ownership

Every successful structural copy creates a UUID token beside the transient clipboard payload. Keyboard `copy` overrides the system clipboard with an opaque marker containing only that token in a web custom format plus a plain-text compatibility representation. Context-menu Copy attempts the same asynchronous marker write and retains its existing in-memory behavior if permission is denied.

Paste compares the marker token with the current shared Editor clipboard. A match pastes the structure even if an older image representation is present. Without a match, a supported image is inserted; explicit foreign text or another token performs no structural paste. If the browser emits no paste event, the existing delayed structural fallback remains the only available signal. A paste event always consumes its pending request so a late event cannot duplicate fallback output.

### Keep the clipboard marker local and content-free

The token is created in current-tab memory, cleared with the existing clipboard on complete State load, and never enters State, SQLite, BroadcastChannel, logs, URLs, exports, or network traffic. The marker cannot reconstruct a Unit, Employee, or canvas element without the matching in-memory payload.

## Risks / Trade-offs

- **Custom clipboard formats may be unavailable or permission may be denied** → include a fixed plain-text marker fallback and leave context-menu in-memory Paste functional when all system writes fail.
- **A stale or foreign marker could be pasted** → require exact equality with the current clipboard UUID and otherwise treat it as unsupported external content.
- **Recursive scope can include overlapping selected branches** → traverse with a visited set and restore View order before one bounded update.
- **Submenu focus could close the parent menu** → reuse the existing submenu containment and delayed pointer-close pattern, generalized for both submenu types.

## Migration Plan

No persistent contract changes. Deploy code, locale, documentation, specification, test, and screenshot updates together. Rollback restores the previous interaction logic without transforming State or SQLite.

## Open Questions

None.
