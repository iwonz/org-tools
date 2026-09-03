## Context

Tag definitions currently store `null` or one of eight semantic names. The Tag catalog uses a
Radix Select whose options preview the same filled surface rendered in Employee, Editor, Calendar,
and catalog contexts. Supporting arbitrary colors therefore crosses the public state validator,
shared presentation, six-language UI, and deterministic browser coverage.

## Goals / Non-Goals

**Goals:**

- Keep a compact dropdown and quick localized named presets.
- Put a native full-spectrum color input above the preset list.
- Store arbitrary colors in one strict, portable representation.
- Preserve readable tonal fills across light, dark, hover, and active states.
- Keep state updates atomic and local-only.

**Non-Goals:**

- Gradients, alpha editing, color histories, remote palettes, or eyedropper-specific APIs.
- Per-Employee Tag colors or changes to Tag assignment identity.
- A state version, migration layer, or compatibility reader.

## Decisions

### Persist semantic names or canonical HEX

`EmployeeTagColor` becomes the existing semantic-name union plus a `#${string}` TypeScript shape.
The production parser is authoritative and accepts custom values only when they match lowercase
`#[0-9a-f]{6}`. The editor normalizes native picker output to that representation before saving.
Named preset selection continues to store the semantic name, so supplied choices remain readable
and can retain curated theme-specific styling.

Alternatives considered were converting every preset to HEX, which makes state less expressive,
and storing RGB objects, which adds unnecessary structure and invalid combinations.

### Use one Popover rather than nesting an input in Select

The color control becomes a button-triggered Radix Popover. Its top palette section contains an
embedded saturation/value field, a hue range, and the current canonical HEX value; below it,
ordinary keyboard-focusable buttons select No color or a named preset. The picker is implemented
locally without a runtime dependency. This preserves dropdown behavior while avoiding unsupported
interactive content inside a Select listbox. Escape/outside click closes the surface, and each
preset selection applies to the draft and closes it.

### Derive arbitrary tonal surfaces locally

Named colors retain curated Tailwind classes. A custom HEX value supplies CSS custom properties for
fill, hover, active, and foreground. A pure color helper parses RGB, blends low-opacity tones
against theme-independent targets, and chooses a sufficiently contrasting foreground. The values
are applied inline only to Tag surfaces; no dynamic Tailwind class generation or network resource
is needed.

The same helper is used by every Tag-bearing surface, so a catalog change immediately changes the
resolved rendering everywhere without copying color values into assignments.

### Validate before every state boundary

The existing strict state parser validates the expanded color domain during Import, SQLite load,
API writes, and live-tab exchange. Invalid, uppercase, short, alpha, or malformed HEX input rejects
the complete candidate without mutating memory or storage. Normal UI selection can only produce a
canonical value.

## Risks / Trade-offs

- **Native picker appearance varies by browser** → retain a stable surrounding control, explicit
  HEX text, localized label, and named presets; test behavior rather than OS picker chrome.
- **Arbitrary colors can have weak contrast** → never render raw color as both fill and text;
  calculate separate restrained fills and foregrounds and verify contrast-oriented helper cases.
- **CSS color behavior could diverge between themes** → produce explicit light/dark custom
  properties and let the document theme choose them through shared CSS.
- **State contract becomes stricter for custom values** → emit only lowercase six-digit HEX and
  reject every noncanonical representation atomically.
