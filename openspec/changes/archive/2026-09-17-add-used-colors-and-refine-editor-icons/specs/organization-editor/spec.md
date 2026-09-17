## ADDED Requirements

### Requirement: Editor contributes every configured canvas color to the shared palette

The organization-wide Used colors palette SHALL include each View's distributed and undistributed
settings, open-position backgrounds, Text base, range, and fill colors, Sticker base, range, and
background colors, and Arrow strokes. Collection SHALL include inactive Views in stable View,
Unit, open-position, canvas-element, and format-run order without cloning or serializing full State.
Closed shared pickers MUST NOT trigger collection work on ordinary Editor renders.

#### Scenario: Reuse an inactive View color

- **WHEN** an inactive View contains a unique Text, Sticker, Arrow, distribution, or open-position color
- **THEN** opening any shared picker exposes that exact color and alpha for reuse

#### Scenario: Preserve Editor performance

- **WHEN** the maintained large Editor renders while no shared color picker is open
- **THEN** Used colors derivation does not scan Views or cause canvas-element or Unit re-renders

#### Scenario: Apply a used color to an Editor property

- **WHEN** a Used colors swatch is selected for Text, Sticker, Arrow, distribution, or an open position and Apply is activated
- **THEN** the existing owning View operation commits once and Undo restores its complete prior value

### Requirement: Editor tool glyphs distinguish Arrow and Image creation

The Editor tools surface SHALL render Arrow as one cubic Bezier stroke with an undecorated start and
a filled triangular arrowhead at its end. Image SHALL use a rounded-square photo glyph. These glyphs
SHALL retain the existing localized tool names, button geometry, active state, and creation behavior,
and SHALL remain excluded from Editor PNG.

#### Scenario: Inspect the tool surface

- **WHEN** the bottom Editor toolbar renders
- **THEN** Arrow shows one control-point-free Bezier curve ending in a filled triangle and Image shows a rounded photo boundary

#### Scenario: Activate refined tool icons

- **WHEN** a user activates Arrow or Image through its icon or accessible name
- **THEN** the same Arrow creation or local Image selection workflow begins without a geometry or State-format change
