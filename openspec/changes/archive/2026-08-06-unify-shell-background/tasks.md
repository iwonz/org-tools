## 1. Theme and shell implementation

- [x] 1.1 Add the light and dark shell theme token and expose it to Tailwind.
- [x] 1.2 Apply the continuous shell background to the root app, transparent unified header, and all six top-level product surfaces without changing bounded component primitives.

## 2. Coverage and documentation

- [x] 2.1 Add browser assertions for continuous light/dark shell backgrounds, retained control contrast, and responsive containment at 390, 1024, and 1280 px.
- [x] 2.2 Update interface-chrome, usage, and screenshot documentation for the continuous shell background.
- [x] 2.3 Regenerate deterministic screenshots and inspect representative light and dark product surfaces.

## 3. Validation and delivery

- [x] 3.1 Run format, lint, typecheck, unit tests, build, browser smoke, and strict OpenSpec validation.
- [x] 3.2 Run the post-build public-safety scan, synchronize the capability delta, archive the completed change, and commit the result as `style: unify shell background`.
