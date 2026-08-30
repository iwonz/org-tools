## Context

Org Tools has a shared React 19 and MobX UI exercised in three materially different browser environments: the development server, the production SQLite server, and the static Pages export. The reported React warning is development-only diagnostic output, so a production-only smoke suite can remain green while render-phase mutation is present. Existing browser workflows cover most visible behavior but do not consistently turn console and page diagnostics into test failures.

The audit must not transmit browser output or organization data. Diagnostics remain local to the owned Playwright process and contain only synthetic fixtures in automated checks.

## Goals / Non-Goals

**Goals:**

- Identify and remove state mutations performed while another React component is rendering.
- Detect unexpected console errors and warnings, uncaught page errors, failed same-origin resources, and failed application responses in development, server production, and Pages production checks.
- Exercise every maintained module and its representative menus, dialogs, editing actions, Import/Export, themes, and locales through the existing browser workflow catalog.
- Keep diagnostic collection shared, bounded, actionable, and free of false success caused by checking before queued browser work settles.

**Non-Goals:**

- Changing product features, the public state contract, SQLite schema, or cross-tab protocol.
- Adding telemetry, remote error reporting, third-party monitoring, or a runtime dependency.
- Treating deliberate network-abort tests or browser-internal messages as application failures without scenario context.

## Decisions

### Move render-time synchronization to actions or effects

The investigation will trace the development warning to the first application frame and remove the mutation from computed/render evaluation. Store normalization remains in explicit actions, event handlers, hydration, or bounded post-commit effects. Suppressing `console.error`, deferring blindly with a timer, or allowlisting the React warning is rejected because each hides an invalid ownership boundary.

### Collect diagnostics at the browser-context boundary

Shared screenshot test helpers will subscribe before navigation to page console events, uncaught page errors, failed requests, and error HTTP responses for application-owned resources. Each workflow will assert the collector is clean after its final settled state. The development probe will apply the same policy while React development diagnostics are enabled. This covers popup/portal work without coupling product components to tests.

### Use an explicit narrow ignore policy

Only messages proven to originate from controlled browser mechanics and unrelated to application correctness may be ignored, with the reason next to the matcher. React, Next.js, MobX, localization, hydration, accessibility, same-origin request, and resource diagnostics are never allowlisted. Unknown diagnostics fail with the scenario name, type, URL, and message.

### Reuse the maintained workflow catalog

The 38 declared screenshot scenarios already open the product's primary and supporting surfaces. Their capture path will include diagnostic assertions, while focused smoke cases will add representative mutations and download/import behavior not observable from static captures. This keeps the audit aligned with documented functionality and prevents a second drifting scenario inventory.

### Preserve data and performance boundaries

The collector is test-only, stores bounded strings, and never changes runtime state. The render fix will avoid new reactions or organization serialization. Large-collection behavior and scoped UI writes remain unchanged.

## Risks / Trade-offs

- **Browser or framework upgrades may add legitimate diagnostics** → fail closed, investigate the source, and document any truly external ignore matcher rather than broadly filtering severity.
- **A diagnostic can occur after the visual assertion** → wait for the workflow's stable condition and one event-loop turn before asserting the collector.
- **The 38-frame catalog emphasizes visual states over every mutation path** → retain focused smoke actions for create/edit/delete, Import/Export, and navigation while using the catalog for complete surface coverage.
- **Development and production output differ** → keep the development probe mandatory for React diagnostics and run production suites for resource, request, and minified runtime failures.
