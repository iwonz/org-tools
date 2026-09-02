## ADDED Requirements

### Requirement: Global transfer actions use focused modal workflows
Import and Export SHALL each open one responsive modal with State and Employees tabs, thematic icons
before labels, stable control geometry, and no navigation or shell movement. Import SHALL expose
file selection, mapping, options, review, and Apply inside the modal; Export SHALL expose the selected
format and one Download action.

#### Scenario: Open transfer modal
- **WHEN** a sidebar Import or Export action is activated in compact or expanded mode
- **THEN** focus moves into the corresponding modal and returns to the trigger on close

#### Scenario: Narrow transfer modal
- **WHEN** the viewport is 390 px wide
- **THEN** tabs, mapping controls, counts, policies, and footer actions remain contained and usable

#### Scenario: Large match review
- **WHEN** Employee Import contains thousands of existing matches
- **THEN** one bounded scroll area renders virtualized rows with visible per-row policy controls

## MODIFIED Requirements

### Requirement: Product workflows use purposeful grouping
Teams, Employees, Analytics, Calendar, and Download SHALL retain their full-bleed purposeful groups,
and the Editor SHALL render the one current Unit structure on its distinct edge-to-edge canvas.

#### Scenario: Editor workspace
- **WHEN** the Editor renders an empty or populated current structure
- **THEN** the canvas retains its full interactive area and distinct neutral background while its toolbar groups, nodes, selection, and focus states use the shared visual language
