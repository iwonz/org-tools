## Context

Analytics is currently a first-class product destination backed by exact organization and UI State,
a local Worker query engine, chart and DOM-capture dependencies, several dialogs, and three gallery
frames. The feature has proved disproportionate to the product and must be removed completely rather
than hidden. The configured owned SQLite snapshot still contains Analytics definitions and currently
opens on the Analytics tab, so publication also requires the repository's one-time exact-State
conversion process.

## Decisions

### Remove the product surface instead of retaining a dormant route

The Analytics navigation destination, tab content, components, query/Worker/client/cache code,
charting and image-export code, tests, fixtures, styles, and product copy are deleted. There is no
redirecting Analytics route or disabled placeholder. Remaining product destinations keep their
relative order, with Employees used as the migration fallback for a saved Analytics active tab.

### Replace the exact State shape

`organization.analytics`, `ui.analytics`, `"analytics"` in `UiActiveTab`, and every public
`Analytics*` type are removed. Blank State, import/export, persistence, BroadcastChannel exchange,
and the store all use the new exact shape. Runtime parsers continue to reject unknown keys, so an old
Analytics-bearing State is rejected rather than silently rewritten. View and custom-field deletion
retain every non-Analytics dependency guard and drop only Analytics references.

### Delete exclusive runtime dependencies

`recharts`, `react-is`, and `html-to-image` are removed because no remaining source imports them.
Production and Pages builds are scanned for Analytics Worker/chart code and remote resources. The
generic privacy guarantee against analytics SDKs and third-party organization-data transmission is
retained because it is a product invariant rather than part of this feature.

### Reduce the maintained gallery to 56 frames

The three Analytics frames and their manifest/documentation entries are removed. The generator,
tests, README showcase, screenshot guide, and publication checks use 56 as the exact maintained
count. Historical archived OpenSpec changes remain untouched as the decision record.

### Convert the owned database once outside runtime

Before publication, the owned runtime is stopped and the complete SQLite family is copied to a
timestamped ignored backup. A temporary uncommitted converter removes `organization.analytics` and
`ui.analytics`, changes `ui.activeTab` from `analytics` to `employees` when needed, and increments
revision exactly once. A detached candidate and the written row are validated with the production
parser, all other data is compared, and ordinary startup is proven. The removed filter and tabs are
recoverable only from that backup.

## Risks

- Removing broad shared code could affect remaining Employee and Editor workflows. Source scans,
  unit tests, both production runtime browser suites, and both builds verify the remaining surfaces.
- Exact-State replacement can strand the configured runtime. The backup, detached validation,
  production-parser validation, unaffected-data comparison, and startup proof make the conversion
  reviewable and reversible from the backup.
- Screenshot count assumptions may be duplicated. The manifest, generator, documentation, README,
  tests, and public-safety scan are updated together and the gallery is regenerated twice.

## Migration

1. Stop the owned runtime and record the configured row revision and Analytics-bearing paths.
2. Back up the complete SQLite database family with one timestamp.
3. Transform a detached copy, validate it with the new production parser, and compare every path
   other than the intentional Analytics removals, active-tab fallback, and revision.
4. Apply the same transformation to the owned row, validate it again, and start the application
   normally.
5. Keep the converter and database artifacts untracked and do not add runtime compatibility.
