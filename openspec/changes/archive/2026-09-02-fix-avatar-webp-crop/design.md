## Context

The avatar pipeline decodes a local PNG, JPEG, or WebP into an image, optionally downsizes a large
source through canvas, and paints the selected square into a 512 by 512 canvas. Both canvas stages
currently request WebP and reject a missing blob or any browser-selected fallback type. The state
validator already accepts bounded PNG, JPEG, and WebP data URLs, so this encoder assumption is
stricter than the persisted contract and can make otherwise valid local images unusable.

The implementation is shared by the loopback server UI and the browser-only Pages build. It must
remain local, avoid new codecs or network work, retain source and decoded-pixel limits, and release
every object URL.

## Goals / Non-Goals

**Goals:**

- Prefer the existing WebP output without treating WebP support as mandatory.
- Accept the browser's safe PNG fallback or explicitly retry PNG after a failed WebP attempt.
- Validate the final data URL and existing 2 MiB persisted-avatar limit before mutating a draft.
- Keep crop coordinates, 512 by 512 output, preview bounds, and temporary-resource cleanup intact.
- Expose only a localized format-neutral error after all local encoding attempts fail.

**Non-Goals:**

- Adding a JavaScript, WASM, remote, or server-side image codec.
- Changing source formats, state fields, SQLite, APIs, or avatar byte limits.
- Persisting the original source image or temporary crop data.
- Migrating existing embedded avatars between formats.

## Decisions

### Use the browser-required PNG encoder as the fallback

A shared canvas encoder first requests `image/webp`. A returned WebP is retained. A returned PNG is
accepted because browsers may select PNG when the requested encoder is unavailable. A null,
throwing, or unsupported result triggers one explicit `image/png` attempt. Only WebP or PNG blobs
continue to data-URL validation.

This avoids a new dependency and uses the PNG encoding support required for HTML canvas. Retrying a
lower WebP quality would not help when the codec itself is unavailable; a custom codec would add
bundle size and a larger security surface.

### Use the same encoder for preview preparation and final crops

Large-source downscaling and final crop encoding use the same ordered format policy. This prevents a
large image from failing before the crop dialog for the same WebP-only assumption. Source decoding,
40-megapixel validation, the 4096-pixel preview cap, and the 512-pixel final output remain unchanged.

### Validate before replacing the Employee draft

The final blob is converted to a data URL and passed through the existing avatar normalizer. The
Employee draft changes only after this complete operation succeeds. Encoding failure leaves the crop
dialog open and the previous avatar untouched.

### Retry the initial in-memory state request within a bounded window

The complete Pages regression suite exposed a browser scheduling race in the existing
`BroadcastChannel` handshake: an immediate request can be emitted while the new channel is still
being registered, so the live peer's response is occasionally missed. The controller keeps one
channel instance, reads readiness through a ref, and repeats the request after 50 and 150
milliseconds. Duplicate peer responses are already rejected by logical stamps, and the bounded
retries do not persist state or delay the empty-state fallback.

## Risks / Trade-offs

- **PNG can be larger than WebP** → The final crop remains 512 by 512 and must pass the existing
  2 MiB decoded-size limit before entering state.
- **A browser can fail both encoders** → Keep the crop dialog open and show one format-neutral owned
  error without exposing raw browser exceptions.
- **A large fallback preview can use more memory** → Preserve the 4096-pixel cap, create only one
  fallback blob, and revoke the replaced object URL immediately.
- **Browser behavior differs by codec implementation** → Unit-test every callback outcome and run
  server plus Pages browser tests with WebP deliberately disabled.
- **Handshake retries can produce duplicate responses** → Existing deterministic stamp comparison
  ignores already-applied snapshots, while timers are cancelled when the controller unmounts.
