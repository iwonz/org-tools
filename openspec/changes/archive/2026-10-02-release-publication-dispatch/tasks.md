## 1. Release publication workflow

- [x] 1.1 Add a manual dispatch entry point to the existing Container workflow without changing its push behavior.
- [x] 1.2 Dispatch Container for the exact Release Please tag only when a stable release is created, using least-privilege workflow permissions.
- [x] 1.3 Add deterministic workflow contract checks for the dispatch trigger, condition, tag ref, and permissions.

## 2. Documentation and specification

- [x] 2.1 Document the reviewed release PR, explicit container dispatch, manual CI approval, and final publication verification flow.
- [x] 2.2 Validate and synchronize the `container-delivery` capability requirement.

## 3. Verification and delivery

- [x] 3.1 Run formatting, lint, typecheck, unit, runtime, build, browser, deterministic gallery, image build, publication safety, OpenSpec, and diff checks required by the repository.
- [x] 3.2 Archive the OpenSpec change, integrate `main`, and verify CI plus clean synchronized repository refs.
- [x] 3.3 Leave the generated release PR unmerged until its version is intentionally published; verify its changelog and passing checks.
