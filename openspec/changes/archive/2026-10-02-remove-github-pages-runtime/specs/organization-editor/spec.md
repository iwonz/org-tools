## MODIFIED Requirements

### Requirement: Large annotated Editor Views have a measurable performance contract
The maintained authenticated-server Editor scenario SHALL cover 20,000 Employees, 4,000 expanded
Units, at least 1,200 Text, Sticker, and Arrow elements, attachments, and maximum-size rich text.
Local test diagnostics SHALL expose numeric render, layout, measurement, and invalidation counts
without organization content, persistence, or network transmission. After warm-up, the scenario
SHALL target 60 frames per second, gate the 95th-percentile animation-frame interval at 33
milliseconds, reject an interaction pause above 100 milliseconds, and gate the 95th-percentile
long-text input-to-next-paint delay at 50 milliseconds.

#### Scenario: Large View interaction regression test
- **WHEN** automated browser coverage pans, zooms, edits long rich text, and transforms canvas
  elements in the maintained large annotated View
- **THEN** deterministic counters prove that unrelated scene and layout work did not run
- **AND** measured frame and input delays remain within the maintained coarse budgets
- **AND** preview writes remain absent and each completed operation retains its existing single-write
  contract
