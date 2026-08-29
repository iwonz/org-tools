## 1. Shared Sidebar Geometry

- [x] 1.1 Give the sidebar toggle the compact navigation-item width and horizontal padding in both
  sidebar modes while preserving the fixed icon axis.
- [x] 1.2 Update interface usage documentation for the shared compact-item geometry.

## 2. Regression Coverage

- [x] 2.1 Assert toggle width, inline padding, and icon alignment against compact navigation geometry
  before and after sidebar expansion.
- [x] 2.2 Regenerate the screenshot gallery and inspect the compact and expanded sidebar states.

## 3. Validation

- [x] 3.1 Run formatting, lint, type checking, unit tests, and a production build.
- [x] 3.2 Run the complete browser smoke suite and strict OpenSpec validation.
- [x] 3.3 Run the public-safety scan and final diff checks.
