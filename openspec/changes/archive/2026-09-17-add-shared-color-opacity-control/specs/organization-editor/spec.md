## ADDED Requirements

### Requirement: Editor color controls and renderers preserve real alpha
Every Editor control backed by the shared color dropdown SHALL provide the same independent opacity
draft and explicit Apply or Cancel workflow as the Tag catalog. Canonical eight-digit colors SHALL
retain their actual alpha in Text foreground and fill, Sticker foreground, surface, and border,
Arrow stroke and markers, distribution rows, open-position backgrounds, Tag-bearing DOM surfaces,
and matching full-View or Unit/subtree PNG. Foreground text on semantic surfaces SHALL remain opaque
and readable after the fill is composited against maintained light or dark backgrounds. Selection
and drop feedback SHALL retain precedence over a persistent open-position background.

#### Scenario: Apply an Editor tool color
- **WHEN** a user drafts a color and opacity for Text, Sticker, or Arrow and activates Apply
- **THEN** one history command stores the canonical value and the resting DOM plus PNG use the same actual alpha

#### Scenario: Apply a View presentation color
- **WHEN** a user applies a transparent distribution or open-position color
- **THEN** one View operation stores it, live rows show real transparency, and light-palette PNG composites the same source color and alpha

#### Scenario: Cancel an Editor color draft
- **WHEN** a user changes color or opacity and cancels, presses Escape, clicks outside, or leaves invalid input
- **THEN** no View history, persistence, or synchronization write occurs and the preceding rendered color remains

#### Scenario: Override a transparent vacancy during interaction
- **WHEN** a transparent open position becomes selected or accepts an Employee drop target
- **THEN** the existing primary or signal feedback replaces its persistent fill without changing row geometry

#### Scenario: Retain existing State
- **WHEN** current State contains semantic, six-digit, or eight-digit Editor colors
- **THEN** strict parsing accepts the unchanged shape and opening or canceling a picker does not rewrite those values
