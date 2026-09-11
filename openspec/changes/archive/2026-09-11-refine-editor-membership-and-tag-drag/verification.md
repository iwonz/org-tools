# Verification

Validated on 2026-09-11 with synthetic data and isolated loopback runtimes.

- Formatting, Biome lint, all workspace type checks, and diff whitespace checks passed.
- All 233 unit tests passed, including independent subtree unions at 20,000 Employees and
  4,000 Units, resolved Live membership, hierarchy selector agreement, and View isolation.
- Development startup and diagnostics checks passed.
- Production server and browser-only Pages builds passed.
- All 50 server browser tests and all eight Pages browser tests passed with strict diagnostics.
- The full pointer sorting scenario also passed ten consecutive runs with duplicate animation
  timestamps, covering zero-write previews, one-write drops, touch, cancellation, and peer changes.
- All 59 gallery PNGs were visually reviewed. Repeated generation from the final unchanged code
  matched every SHA-256 hash, with no missing or extra PNGs. The final gallery also matched the
  previously reviewed frames after the auto-scroll fix.
- Pages artifact checks, public-safety scans, and strict OpenSpec validation passed.

Browser tracing identified that a closely timed animation frame can round its scroll step to zero.
Edge scrolling now ends only at the actual scroll boundary, and the browser regression deliberately
reproduces duplicate timestamps. Drag release commits the rendered preview's destination.

No state format, runtime storage boundary, dependency, or configured SQLite database was changed.
