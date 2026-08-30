## Why

React currently reports a render-phase state update while normal organization data is displayed. Runtime warnings can hide real failures, make development diagnostics unreliable, and indicate rendering behavior that may break under future React scheduling.

## What Changes

- Remove render-phase MobX or React mutations so components only observe state while rendering.
- Audit the complete server and static browser workflows for console errors, warnings, page errors, failed application requests, and hydration diagnostics.
- Make the browser suites fail on unexpected runtime diagnostics while retaining a narrow, documented allowlist only for browser-generated noise that the application cannot control.
- Cover both themes and locales, navigation, state Import/Export, Teams, Employees, Editor, Analytics, Calendar, Data Download, dialogs, menus, and representative editing actions.
- Preserve the browser-only privacy boundary, the current strict state contract, automatic SQLite persistence, and memory-only Pages behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `project-tooling`: Require production browser validation to detect unexpected console, page, hydration, request, and resource errors across both runtimes and the maintained workflow catalog.

## Impact

The change affects React/MobX rendering boundaries, shared UI components or stores found by the audit, Playwright smoke infrastructure, and repository validation documentation. It does not change the public state format, persistence APIs, network boundary, product data, dependencies, or user-facing workflows.
