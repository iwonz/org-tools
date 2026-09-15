## ADDED Requirements

### Requirement: Template output can remove empty lines consistently
Data Download and Editor Template export SHALL expose one shared **Remove empty lines** checkbox.
When enabled, preview, Copy, and Download SHALL remove every whitespace-only rendered line while
preserving the content and order of nonempty lines. Every Template line count, including All Units,
First Unit, bounded-preview shown, and complete totals, SHALL describe the processed output after
the same line-removal policy. A terminal line separator SHALL NOT count as an additional visual
line, and output with no retained content SHALL have a count of zero. The option SHALL remain
transient to the open export surface and SHALL NOT affect JSON, Image, organization State, browser
storage, or network behavior.

#### Scenario: Remove whitespace-only lines
- **WHEN** Remove empty lines is enabled and Template evaluation produces empty, spaces-only, tabs-only, and nonempty lines
- **THEN** preview, copied text, and downloaded text contain only the nonempty lines in their original order

#### Scenario: Preserve output while disabled
- **WHEN** Remove empty lines is disabled
- **THEN** preview, copied text, and downloaded text retain the existing rendered Template output byte for byte

#### Scenario: Count the processed output
- **WHEN** the option or Template Format changes, or All Units and First Unit produce different empty lines
- **THEN** every visible Template count updates from the same processed line stream used by the corresponding output

#### Scenario: Bound filtered preview work
- **WHEN** Template export contains 20,000 Employees and Remove empty lines is enabled
- **THEN** the application derives complete line counts without constructing the complete output for preview and still bounds displayed text to 50 source rows and 128 KiB
