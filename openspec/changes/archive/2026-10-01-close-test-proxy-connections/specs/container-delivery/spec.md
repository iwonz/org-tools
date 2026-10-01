## ADDED Requirements

### Requirement: Browser validation releases proxy connections deterministically

The Compose browser-validation loopback proxy SHALL own and release ordinary HTTP connections and
both sides of every upgraded connection. Its shutdown SHALL be awaitable, idempotent, stop new
connections, and resolve only after the listening server and tracked connections are closed.

#### Scenario: Close an upgraded development connection

- **WHEN** a browser validation completes while a Next.js HMR upgraded connection is active
- **THEN** proxy shutdown closes the browser and upstream sockets and the validation process exits

#### Scenario: Repeat proxy shutdown

- **WHEN** cleanup invokes proxy shutdown more than once after success or failure
- **THEN** every caller observes the same completed shutdown without an exception or leaked handle

### Requirement: Gallery comparison bounds software-raster noise

Screenshot generation SHALL preserve an existing maintained PNG when a candidate changes no more
than 256 pixels and every unmarked changed channel differs by at most 3. A candidate outside either
bound SHALL replace the file for review.

#### Scenario: Ignore an imperceptible raster variation

- **WHEN** repeated headless Chromium capture changes at most 256 pixels by no more than 3 channel levels
- **THEN** the maintained PNG remains byte-identical and repeated gallery hashes match

#### Scenario: Surface a meaningful screenshot change

- **WHEN** a candidate exceeds the pixel budget or maximum channel delta outside an explicitly marked raster region
- **THEN** screenshot generation writes the candidate so repository review exposes the change
