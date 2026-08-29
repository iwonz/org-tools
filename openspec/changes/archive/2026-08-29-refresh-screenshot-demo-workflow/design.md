## Context

The generated gallery currently mixes core product journeys with secondary form details. The
README exposes only a subset, Teams and language selection have no dedicated frame, and the
Download frame stops before a useful selection is visible. The file list, generator, README, and
screenshot guide are maintained independently, so stale PNGs can survive a redesign unnoticed.

This is a repository-tooling and documentation change. Captures still run locally against the
static production build, use only the deterministic synthetic workspace, and never cross the
browser-only privacy boundary. The public state contract, runtime application, dependencies, and
performance targets are unchanged.

The repository also documents individual OpenSpec and validation steps without requiring their
complete lifecycle. That permits a task to finish with an active change, an unmerged branch, or a
local commit that has not reached the current default branch.

## Goals / Non-Goals

**Goals:**

- Present one concise ten-frame demo covering Import, Export, theme, language, Teams, Employees,
  Editor, Analytics, Calendar, and Download.
- Capture meaningful, deterministic, visually reviewable states from one synthetic workspace.
- Make the manifest, generated files, README links, and screenshot documentation agree exactly.
- Require every repository change to start clean and current, use an isolated OpenSpec branch,
  complete validation and archival, integrate into `main`, publish when allowed, and finish clean.
- Preserve the existing browser smoke coverage for detailed behavior that no longer needs its own
  public screenshot.

**Non-Goals:**

- Change the product UI, public state schema, runtime behavior, dependencies, or privacy model.
- Add a video, onboarding surface, remote fixture, or live organization data.
- Turn every browser regression scenario into a public gallery image.
- Rewrite Git history or remove unmerged work that belongs to another contributor.

## Decisions

### Use one exact scenario manifest

A checked-in JSON manifest defines the ten stable scenario identifiers, filenames, titles, and
descriptions. The screenshot suite resolves output paths through that manifest, and the public
safety check validates a one-to-one relationship between manifest entries, PNG files, README links,
and screenshot-guide links.

This is preferred to maintaining parallel hard-coded lists because the manifest gives automation a
small, reviewable contract. Deriving documentation at build time was rejected because checked-in
Markdown should remain readable and editable without a generator.

### Replace the gallery instead of extending it

The generator removes PNGs only from the dedicated `docs/screenshots` directory before producing
the ten manifest files, then asserts that no files are missing or extra. Detailed avatar, dated-tag,
empty-state, and import-mapping behavior remains in browser tests but leaves the public demo.

Keeping all old images was rejected because it dilutes the product narrative and makes complete
visual review expensive. Deleting broader generated directories was rejected because housekeeping
must not destroy unrelated local caches or artifacts.

### Capture complete, intentional states

Every frame uses the same synthetic workspace and fixed browser conditions. Theme and language
frames keep their sidebar menus open so the control is visible; the language frame uses the bundled
Russian catalog. Teams, Employees, Editor, Analytics, and Calendar show populated product surfaces.
Import and Export show their dialogs with recognizable content, and Download shows a populated
selection rather than an untouched empty state.

This gives each PNG one clear purpose while the smoke suite continues to assert the underlying
interactions and downloads.

### Make delivery a closed loop

`AGENTS.md` is the mandatory agent policy, `CONTRIBUTING.md` is the human workflow, and the
`project-tooling` capability is the testable product-repository contract. All three describe the
same sequence: update clean `main`, create `change/<name>`, create or continue one OpenSpec change,
implement its tasks, run the full suite, sync and archive the change, commit meaningfully, merge and
push `main`, remove merged branches, and verify no active or unique work remains.

If publication is explicitly forbidden or an external system prevents it, the work must stop at the
safest clean local state and report the incomplete integration. Silently claiming a fully delivered
task is not acceptable. Automatic deletion of unknown or unmerged branches was rejected because it
could destroy another contributor's work.

### Preserve trust boundaries and performance

All data remains in the Playwright browser context and comes from existing synthetic helpers.
Screenshots contain no secret, local path, real contact data, remote avatar, or network dependency.
The manifest and documentation checks perform only bounded filesystem reads, so they do not affect
runtime bundle size or the 20,000 Employee and 4,000 Unit interaction target.

## Risks / Trade-offs

- [A ten-frame gallery omits useful edge cases] → Keep those cases in the browser smoke suite and
  document that the gallery is a product narrative, not the complete regression catalog.
- [A stale PNG or broken Markdown link survives a rename] → Validate exact manifest/file/link
  equality during the public-safety check and after generation.
- [A capture changes because of local settings or time] → Keep the fixed viewport, locale,
  clock, reduced motion, local fonts, synthetic fixture, and production-build server.
- [Gallery cleanup deletes an unrelated asset] → Restrict deletion to `*.png` directly inside
  `docs/screenshots` and immediately regenerate the exact manifest set.
- [Mandatory publication conflicts with an explicit user instruction or unavailable Git remote] →
  Treat that as a declared exception, preserve the clean local result, and report the exact pending
  integration instead of widening authority.

## Migration Plan

1. Add the manifest and update the screenshot suite and public-safety validation.
2. Replace README and screenshot-guide references with all ten manifest scenarios.
3. Regenerate the gallery from the production build, inspect each frame, regenerate it again, and
   compare hashes for determinism.
4. Update mandatory delivery guidance and the project-tooling capability.
5. Run the full repository validation suite, sync the delta spec, archive the change, and commit.
6. Merge the short-lived branch into current `main`, push `main`, delete the merged branch, and
   verify clean local and remote state with no active OpenSpec changes.

Rollback is a normal revert of the integrated commit; no user data or public file migration exists.

## Open Questions

None.
