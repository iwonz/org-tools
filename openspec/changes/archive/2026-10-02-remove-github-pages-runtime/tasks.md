## 1. Remove current Pages delivery hooks

- [x] 1.1 Remove obsolete static-export and Pages test paths from repository configuration.
- [x] 1.2 Add a regression test that rejects Pages applications, workflows, actions, permissions, environments, and static-export paths in current source.

## 2. Align contracts and documentation

- [x] 2.1 Rewrite current capability specifications and documentation for the single authenticated server runtime.
- [x] 2.2 Validate and synchronize all five capability deltas.

## 3. Verification and delivery

- [x] 3.1 Run the complete containerized validation set, two deterministic 56-PNG passes, production image inspection, publication safety, OpenSpec, and diff checks.
- [x] 3.2 Archive the OpenSpec change, integrate fresh `origin/main`, push `main`, and verify clean synchronized refs and CI.
- [x] 3.3 Disable the GitHub Pages site, delete the `github-pages` environment, and verify CI, Release Please, and GHCR remain available.
