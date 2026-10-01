## Context

The app container bind-mounts the checkout and Next.js writes `.next/dev/lock` into that shared
directory. The toolbox also writes production build output there. Concurrent Compose projects or a
build executed while the development server is running can make Next.js observe another live server
and enter a restart loop.

## Goals / Non-Goals

**Goals:**

- Give each Compose project's app service a private Next.js output directory.
- Preserve the bind-mounted source and hot reload.
- Keep production builds available to publication checks in the checkout.

**Non-Goals:**

- Persist development build output.
- Change PostgreSQL or Backup mounts.
- Change the production image filesystem.

## Decisions

Mount a Compose named volume at `/workspace/apps/ui/.next` only for the development app service.
Give the app its own root, UI, and types dependency volumes so a toolbox install cannot replace
loader files underneath a running development server. Compose scopes the volumes by project, so
concurrent projects cannot share the lock or dependency tree. The toolbox continues to write its
production build into the checkout for later inspection.

The volume is disposable and is removed by the supported `down --volumes` path. It is not a database
volume and does not contain organization data.

The preparation service assigns the Backup directory to runtime UID 10001 with mode `0711`.
Execute-only access lets the host wrapper canonicalize and validate the configured path after
startup without permitting directory listing. Recovery Backup files remain encrypted and mode
`0600`.

## Risks / Trade-offs

- **The first development start rebuilds Next.js output** → The output is a cache and is expected to
  be disposable.
- **An orphaned project can retain cache data** → The documented Compose teardown removes project
  volumes, and publication checks reject organization data from build output.
