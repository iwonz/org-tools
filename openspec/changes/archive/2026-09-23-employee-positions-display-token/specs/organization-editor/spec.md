## MODIFIED Requirements

### Requirement: Editor Employee rows use formatted multiline geometry
The Editor SHALL render Employee information from the persisted Editor format as shared rich lines
containing inline Markdown runs, native Tag chips, and compound `Position · Unit` assignment pills.
Every line SHALL use one base text style and Markdown links SHALL remain visually styled but
non-interactive inside the single Employee-row button. DOM rows, virtual offsets, semantic-chip
wrapping, hit testing, anchors, Unit bounds, and PNG layout MUST use the same deterministic
rich-line geometry with the existing row height as a minimum. Open-position rows and Unit Tag
footers SHALL retain their existing presentation.

#### Scenario: Render a rich multiline Editor Employee
- **WHEN** an Editor format produces marked text plus wrapping Tag or assignment pills
- **THEN** the row, containing Unit, anchors, hit targets, and connections expand to the shared calculated geometry

#### Scenario: Collapse a Unit with a formatted boss
- **WHEN** a Unit is collapsed and its boss format produces multiple rich lines
- **THEN** the visible boss row retains the same content, marks, chips, and calculated row bounds

#### Scenario: Render an Editor link
- **WHEN** an Editor format contains an explicit safe Markdown link, including a `mailto:` link
- **THEN** its label has link styling while the Employee row remains one button with no nested navigation element

#### Scenario: Pack several assignments
- **WHEN** `{positions}` produces several assignment pills wider than one visual row
- **THEN** the pills wrap in structural order and every dependent Editor geometry uses the resulting row count
