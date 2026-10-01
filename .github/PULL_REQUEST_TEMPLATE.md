## Outcome

Describe the user-visible result and link the OpenSpec change.

## Security, privacy, and performance

- [ ] Server permissions, scopes, and ACL protect every affected payload and mutation.
- [ ] Fixtures contain only synthetic data; no `.env`, credential, database, dump, backup, or local path is tracked.
- [ ] PostgreSQL migrations, projection caching, and large-collection behavior remain bounded.
- [ ] Documentation, locales, capability specs, DOM, and PNG behavior agree.

## Validation

- [ ] `pnpm format && pnpm lint`
- [ ] `pnpm typecheck && pnpm test:unit`
- [ ] `pnpm dev:check && pnpm build && pnpm test:browser`
- [ ] PostgreSQL migration/restart and Backup/Restore checks
- [ ] production image, bind storage, and `pnpm public:check`
- [ ] `pnpm spec:validate && git diff --check`
- [ ] 56 PNGs generated twice, hashes compared, every frame inspected
