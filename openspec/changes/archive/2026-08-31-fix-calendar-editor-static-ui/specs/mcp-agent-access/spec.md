## MODIFIED Requirements

### Requirement: MCP transport is explicitly enabled and local-only
The local SQLite runtime SHALL expose a stateless Streamable HTTP MCP endpoint at `/mcp` that is
disabled by default. The endpoint MUST accept only JSON POST requests with a loopback Host, an
absent or matching loopback Origin, and a valid bearer token while returning no CORS headers and
supporting no GET, legacy SSE, tunnel, remote bind, or static Pages transport.

#### Scenario: Disabled endpoint
- **WHEN** a local client sends an otherwise valid MCP request before the user enables access
- **THEN** the endpoint rejects it with no organization data or protocol result

#### Scenario: Authenticated loopback request
- **WHEN** an enabled endpoint receives a JSON POST with a valid loopback boundary and current token
- **THEN** it negotiates a supported MCP protocol revision and returns a no-store protocol response

#### Scenario: Invalid transport boundary
- **WHEN** Host is non-loopback, Origin is mismatched, authorization is missing or invalid, the
  method is GET, or the request attempts CORS
- **THEN** the request is rejected before protocol arguments or organization state are processed

#### Scenario: Static runtime
- **WHEN** the GitHub Pages application is built or used in either locale, theme, or sidebar state
- **THEN** it contains and renders no MCP route, control, accessible action, dialog, token, server
  SDK, SQLite dependency, or MCP network call
