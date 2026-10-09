# syntax=docker/dockerfile:1.7
FROM node:26.9.0-bookworm-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@11.24.0 --activate
WORKDIR /workspace

FROM base AS dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/ui/package.json apps/ui/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/screenshots/package.json packages/screenshots/package.json
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile --fetch-timeout=300000 --network-concurrency=8

FROM dependencies AS development
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
RUN apt-get update \
    && apt-get install -y --no-install-recommends git \
    && rm -rf /var/lib/apt/lists/*
RUN pnpm --filter @org-tools/screenshots exec playwright install --with-deps chromium
COPY . .
CMD ["pnpm", "--filter", "@org-tools/ui", "exec", "next", "dev", "--webpack", "--hostname", "0.0.0.0", "--port", "3000"]

FROM dependencies AS build
COPY . .
RUN pnpm --filter @org-tools/ui build

FROM node:26.9.0-bookworm-slim AS runtime
ENV HOSTNAME=0.0.0.0
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /app
RUN groupadd --gid 10001 orgtools && useradd --uid 10001 --gid 10001 --no-create-home --shell /usr/sbin/nologin orgtools
COPY --from=build --chown=orgtools:orgtools /workspace/apps/ui/.next/standalone ./
COPY --from=build --chown=orgtools:orgtools /workspace/apps/ui/.next/static ./apps/ui/.next/static
COPY --from=build --chown=orgtools:orgtools /workspace/apps/ui/public ./apps/ui/public
COPY --from=build --chown=orgtools:orgtools /workspace/apps/ui/scripts/migrate-postgres.mjs ./apps/ui/scripts/migrate-postgres.mjs
COPY --from=build --chown=orgtools:orgtools /workspace/apps/ui/migrations ./apps/ui/migrations
USER 10001:10001
EXPOSE 3000
CMD ["node", "apps/ui/server.js"]
