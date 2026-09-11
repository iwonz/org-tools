## 1. Reliable development lifecycle

- [x] 1.1 Reproduce the warmup exit race with an isolated subprocess regression test.
- [x] 1.2 Share immediate child completion across startup, running, and shutdown; cancel pending warmup and document the behavior.
- [x] 1.3 Verify early, settling, pending-request, and running exits plus interruption with isolated regression coverage.

## 2. Validation and delivery

- [x] 2.1 Run formatting, lint, typecheck, unit tests, dev check, production build and both browser suites.
- [x] 2.2 Generate and inspect all gallery PNGs, regenerate and compare hashes, and run Pages build/check, public-safety, strict specs and diff checks.
- [x] 2.3 Synchronize the capability delta and prepare the validated change for archival and integration.
- [x] 2.4 Restore and probe the owned local development server.

Delivery follows AGENTS.md: archive, validate strictly with no active changes, commit, merge and push
main, remove the branch, and verify clean synchronized state.

Validation: the original settling-exit regression reproduced exit code 13. The corrected launcher
passes all 9 lifecycle cases and the complete 243-test unit suite. Development probing, 51 server
browser tests, 9 Pages browser tests, both builds, static checks, and public-safety checks passed.
All 59 PNGs were visually reviewed and their hashes matched across two generations. The restored
local development UI and state API both returned HTTP 200.
