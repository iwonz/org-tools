## Outcome

Describe the user-visible result and link the OpenSpec change.

## Safety and performance

- [ ] Organization data remains within the browser and loopback same-origin runtime.
- [ ] Fixtures and screenshots are synthetic and contain no private paths or contact data.
- [ ] Large-list and derived-index behavior remains bounded or is covered by measurements.
- [ ] Documentation and capability specs match the implementation.

## Validation

- [ ] `pnpm lint`
- [ ] `pnpm typecheck`
- [ ] `pnpm test:unit`
- [ ] `pnpm build`
- [ ] `pnpm spec:validate`
- [ ] `pnpm public:check`
- [ ] `pnpm test:browser`
- [ ] PNGs regenerated and inspected when the UI changed
