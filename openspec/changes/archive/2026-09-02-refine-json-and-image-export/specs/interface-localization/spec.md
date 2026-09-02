## MODIFIED Requirements

### Requirement: Structured export is completely localized
Both bundled locales SHALL provide matching non-empty messages for JSON and Template tabs, the
unified sortable field list, drag handles, Unit and Tag collection controls, nested field names,
exclusions, bounded-preview metadata, build progress, validation, clipboard feedback, direct State
Export errors, Editor scope icons, image alignment accessibility names, and the default boss label.
Russian SHALL consistently use its localized Template label and localized manager boss default;
English SHALL consistently label them `Template` and `Manager`.

Editor export SHALL omit redundant Preview labels and the removed expanded-image Open action while
retaining localized accessible names for controls that render only an icon.

#### Scenario: Russian structured output
- **WHEN** Russian is active and a user opens Data Download or Editor export
- **THEN** both format selectors, field-order controls, scope and alignment controls, and image boss default use localized Russian copy without obsolete Preview or Open product labels

#### Scenario: English structured output
- **WHEN** English is active and a user opens Data Download or Editor export
- **THEN** both format selectors use `Template`, the image boss default uses `Manager`, and every remaining owned export control is English

#### Scenario: Accessible sortable and icon-only controls
- **WHEN** assistive technology reads a drag handle, scope action, or title-alignment action
- **THEN** its localized name describes the field move, scope, or alignment without relying on the visible icon
