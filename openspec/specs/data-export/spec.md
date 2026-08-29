# data-export Specification

## Purpose
Define the local, generic text and image export boundary for Employees and Units.

## Requirements

### Requirement: Data export remains local and generic
The application SHALL export selected Employees and Units as CSV, JSON, separator templates, or a
canvas PNG using only the generic data model. Employee gender SHALL be available as a selectable
field using its stable persisted enum. Employee JSON SHALL keep `tags` as an array of labels and add
`tagDates` records containing `tag` and `date`; CSV and templates SHALL encode dated assignments as
`tag=YYYY-MM-DD`. PNG output SHALL receive the active locale, render every tag as `label` or
`label · localized date`, wrap chips, and expand Employee rows and Team cards using the same packing
model as the Org Editor. A successful Download-tab file save SHALL not render an inline
downloaded-file label, while clipboard copy confirmation and localized errors SHALL remain
available.

#### Scenario: Employee field export
- **WHEN** a user selects gender, profile, embedded avatar, birthday, tags, tag dates, or contact
  fields
- **THEN** the exported value comes directly from the persisted Employee without deriving or
  inferring it from another identifier

#### Scenario: Backward-compatible tags field
- **WHEN** an Employee with dated and undated tags is exported
- **THEN** `tags` contains every label while `tagDates` contains only assignments with dates in the
  selected output syntax

#### Scenario: PNG with many dated tags
- **WHEN** an Employee has more localized dated tags than fit on one image row
- **THEN** the PNG contains every tag on wrapped rows and expands geometry without overlaps or an
  overflow count

#### Scenario: Local export
- **WHEN** a user copies or saves an export
- **THEN** the data is produced in the browser without an upload or remote API

#### Scenario: Silent file download
- **WHEN** a user downloads a file after copying or without a prior copy
- **THEN** no downloaded-file success label appears and any prior copy confirmation is cleared
