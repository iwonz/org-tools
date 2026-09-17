## ADDED Requirements

### Requirement: Shared color picker exposes configured organization colors

The shared color dropdown SHALL expose one compact Used colors section containing every distinct
non-null color configured in global Tags or any organization View, including inactive Views. The
section SHALL derive only from durable in-memory organization data, SHALL NOT persist color history,
and SHALL exclude transient drafts, clipboard content, and native Image-export color controls.

Colors SHALL be deduplicated by resolved RGBA in deterministic first-use order. Equivalent named and
custom colors SHALL appear once, while distinct alpha values, including zero alpha, SHALL remain
separate. The section SHALL render all values without an arbitrary count limit inside the existing
bounded Popover.

#### Scenario: Open a picker with colors across Views

- **WHEN** global Tags and active or inactive Views contain configured colors
- **THEN** every distinct rendered RGBA appears once in stable order in the Used colors section

#### Scenario: Distinguish opacity values

- **WHEN** durable fields contain the same RGB with opaque, partial, and zero alpha values
- **THEN** the picker exposes three separate alpha-aware swatches over a transparency checkerboard

#### Scenario: Reuse a configured color

- **WHEN** a user activates a Used colors swatch
- **THEN** its RGB and opacity replace the local draft without invoking the owning change callback
- **AND** Apply commits once while Cancel, Escape, and outside dismissal preserve the preceding value

#### Scenario: Remove the last durable use

- **WHEN** a color is removed from its final Tag or View field and the picker is opened again
- **THEN** the color is absent without a history cleanup write or State migration

#### Scenario: Use the palette accessibly

- **WHEN** Used colors render at narrow width or in an RTL locale
- **THEN** 28-pixel swatches wrap without overflow and expose keyboard selection, exact color and opacity labels, tooltips, and a geometry-stable selected mark
