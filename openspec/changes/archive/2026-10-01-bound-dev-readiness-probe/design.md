## Context

`org-tools-dev-check` waits for `/api/health/ready` before starting Chromium. The container-local
`fetch()` has no `AbortSignal`; if the development server accepts a connection but does not complete
the response, the first attempt never returns. GitHub Actions then has no output until the job or a
new concurrency run cancels it.

## Goals / Non-Goals

**Goals:**

- Bound individual requests and the aggregate readiness period.
- Preserve retries for ordinary cold Next.js compilation.
- Print app status and recent logs before a readiness failure.

**Non-Goals:**

- Change application health semantics, Compose service dependencies, or product runtime timeouts.
- Hide a failed application startup by skipping the Chromium probe.

## Decisions

- Use Node's built-in `AbortSignal.timeout()` in the container-local fetch. This needs no dependency
  and terminates a stalled TCP/HTTP request.
- Use 36 attempts with a 3-second request deadline and a 1-second delay. The worst-case readiness
  window is bounded near 144 seconds while allowing a cold compile far longer than local startup.
- Print `compose ps app` and the last 200 app log lines only on failure. Successful CI stays concise,
  while failure exposes startup, dependency, and route-compilation diagnostics without printing
  `.env` or organization data.

## Risks / Trade-offs

- [A very slow runner needs more than the bounded window] → the emitted logs make the cause visible;
  the limit can be adjusted from evidence instead of consuming the 45-minute job timeout.
- [Logs contain request data] → only the development app's recent startup output is printed; secrets
  and environment values are never requested or echoed.
