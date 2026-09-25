## ADDED Requirements

### Requirement: Analytics calculation and image capture stay local
Dashboard snapshots, queries, filter values, results, SVG, drill-down identity, and PNG capture SHALL remain inside the browser and loopback same-origin runtime. Recharts, Worker code, fonts, and html-to-image MUST be locally bundled. Capture MUST accept only local bundled resources and data URLs and MUST NOT fetch remote resources.

#### Scenario: Render and export a dashboard
- **WHEN** a widget calculates, charts, drills down, or exports PNG
- **THEN** no organization data or resource request is sent to a third-party origin

