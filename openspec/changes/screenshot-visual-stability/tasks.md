## 1. Visual stabilization

- [x] 1.1 Extract a tested pixel comparator that preserves the explicitly scoped raster-noise policy.
- [x] 1.2 Wait for fonts and embedded images, sample bounded consecutive screenshots, and fail unstable scenarios with diagnostic images.
- [x] 1.3 Upload gallery diagnostics on failure while retaining the complete two-pass 56-hash gate.
- [x] 1.4 Make database-backed Administration permission ordering deterministic across clean instances.

## 2. Documentation and evidence

- [x] 2.1 Update validation and screenshot documentation with the readiness contract, measured timings, and observed flake.
- [x] 2.2 Run fast validation, the complete browser matrix, two deterministic gallery passes, production/public-safety checks, and strict OpenSpec validation.
- [ ] 2.3 Visually inspect all maintained PNGs, synchronize and archive the change, integrate `main`, and record final CI/container/release evidence.
