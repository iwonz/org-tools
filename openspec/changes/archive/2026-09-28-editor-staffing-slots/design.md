## Context

Open positions are currently embedded in each manual Editor Unit and are also represented in selection, canvas-anchor, clipboard, row-layout, PNG, strict-State, and screenshot contracts. Live Units erase them. The entity also carries a presentation color and supports conversion into an Employee. The replacement must preserve View isolation and geometry while changing the exact State shape and Unit summaries.

## Goals / Non-Goals

**Goals:**

- Define a small View-local Staffing Slot record with optional name and shared Tags.
- Allow slots in manual and Live Units and move one or many slots between Units atomically.
- Count Employees and slots independently for direct and descendant Unit summaries.
- Keep DOM, canvas geometry, anchors, virtualization, and PNG output aligned.
- Convert the owned previous SQLite state once while retaining a database-family backup.

**Non-Goals:**

- Slots do not become global catalog records, Employee assignments, Unit positions, or filled/closed records.
- Slots do not enter Units, Calendar, filters, Employee transfer, JSON, or Template output.
- No runtime compatibility reader or schema-version field is added.

## Decisions

### Store slots inside their owning Unit

`OrgEditorUnit.staffingSlots` contains `{ id, name, tags }`. Ownership supplies the Unit relationship without a second reference that can dangle. `name` is a normalized nullable string; the localized Staffing Slot label is presentation-only. Slot UUIDs remain unique inside a View.

### Replace every discriminant and anchor reference

Selection and anchor owners use `type: "staffingSlot"` with `staffingSlotId`. Unit/View copy generates new slot IDs and remaps internal anchors. Deleting a slot detaches anchors at their resolved coordinates. Moving a slot updates its owner Unit in selections and anchors, so attached elements continue to follow the same logical slot.

### Use one slot-only drag command

Dragging an unselected slot moves only that slot. Dragging a selected slot moves all selected slots, even when they originate in multiple Units. Employee selections are excluded. Source and target Units, selections, anchors, timestamps, layout, and history update in one command; a same-owner drop is a no-op. Any manual or Live Unit can be a target.

### Derive one combined Unit summary

The summary traversal retains a Set of Employee IDs so descendant Employee counts remain distinct. Slot totals are integer sums because a slot has exactly one owner. A Unit with children renders total counts first and direct counts second; a leaf renders one direct line. The fixed Unit header reserves two-line space in DOM and PNG, and a leaf centers its one line in that space.

### Preserve vacancy geometry without configurable color

Slots retain the shared employee-row geometry, neutral placeholder avatar, dashed outline, complete Tag chips, sorting, virtualization, collapse behavior, and side anchors. The custom background color, used-color contribution, replacement picker, and slot-specific Employee drop target are removed.

### Replace State once

The parser accepts only `staffingSlots` and the new reference discriminants. The external converter maps old titles to names, preserves UUIDs and Tags, drops background colors, rewrites selections and anchors, and increments the SQLite revision once. The converter and database artifacts remain ignored and uncommitted.

## Risks / Trade-offs

- **Exact State replacement can strand the owned runtime** → Stop it, back up the full database family, validate a detached candidate and installed row with the production parser, and prove normal startup before integration.
- **Multi-slot movement can leave dangling references** → Perform Unit ownership, selections, and every canvas attachment rewrite inside one store command and validate the full graph in tests.
- **Two summary lines can desynchronize geometry** → Centralize header height and summary lines, and use the same data in DOM bounds, hit testing, layout, full-View PNG, and scoped PNG.
- **Live Unit derivation can erase slots** → Keep slots in the persisted Unit and replace only derived Employee membership when building display Units.

## Migration Plan

1. Confirm the configured database is the immediately previous valid shape and record revision and slot count without exposing organization content.
2. Stop the owned runtime and create a timestamped ignored backup of the SQLite database family.
3. Convert a detached copy, mapping Unit records plus nested selections and anchor owners, then validate through the production parser.
4. Atomically install the converted JSON row, incrementing revision once, validate the committed row, and start/probe the ordinary runtime.
5. If any check fails, restore the backup before publication. Runtime code never reads the preceding shape.

## Open Questions

None.
