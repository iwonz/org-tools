## Context

Browser validation runs inside the Compose toolbox and reaches the development app through a
loopback HTTP proxy. Next.js upgrades its HMR connection to WebSocket. Node's
`server.closeAllConnections()` excludes upgraded sockets, and the proxy currently tracks only the
browser-facing socket. On Linux CI the surviving upstream socket keeps the Node process alive after
the browser check succeeds.

## Goals / Non-Goals

**Goals:**

- Give the proxy explicit ownership of browser-facing and upstream upgraded sockets.
- Make shutdown deterministic, awaitable, and safe to call more than once.
- Regress the lifecycle with a local WebSocket-like upgrade test that makes no external request.

**Non-Goals:**

- Change the production proxy, application transport, HMR configuration, or browser assertions.
- Add dependencies, persistent state, environment variables, or runtime compatibility paths.

## Decisions

- Maintain a set of upgraded socket pairs in addition to normal server connections. Closing either
  side destroys its peer and removes the pair. This addresses the resource Node deliberately omits
  from `closeAllConnections()` while keeping normal HTTP behavior unchanged.
- Return one memoized shutdown promise. The first call stops accepting traffic, destroys ordinary
  and upgraded connections, and resolves after the server emits `close`; later calls await the same
  result. Returning immediately after `server.close()` was rejected because it cannot prove that
  the listening handle has been released.
- Use built-in `node:http` and `node:net` in the regression test. A WebSocket library would add a
  dependency for behavior that only requires an HTTP Upgrade handshake and a persistent TCP pair.
- Preserve an existing gallery PNG when no more than 256 pixels differ and every unmarked pixel has
  a per-channel delta of at most 3. Repeated software-raster measurements showed at most 71 affected
  pixels with delta 3 in the two canvas-preview frames; the prior delta-2 boundary rewrote otherwise
  identical images. Removing comparison or raising the pixel budget was rejected because either
  would mask meaningful layout changes.
- Keep the proxy local to browser validation. It transports only synthetic test traffic between
  containers and does not cross the application's trust boundary.

## Risks / Trade-offs

- [A peer closes while shutdown iterates the collection] → copy or tolerate Set deletion during
  iteration and make every destroy operation idempotent.
- [The upstream cannot connect] → destroy the browser-facing socket through the existing error path
  and remove the pair from tracking.
- [A future upgraded protocol adds unusual lifecycle behavior] → the contract is transport-agnostic:
  both raw sockets are always destroyed during shutdown.
- [Raster tolerance hides a visual regression] → retain the 256-pixel ceiling, apply the channel
  tolerance only inside that ceiling, and continue visual review of every maintained frame.
