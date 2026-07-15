# syntax=docker/dockerfile:1

FROM node:25.3.0-bookworm-slim AS base
WORKDIR /app

# ---------------------------------------------------------------------------
# deps: install with lockfile, cached across builds
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# ---------------------------------------------------------------------------
# dev: local development image -- source is bind-mounted by docker-compose,
# node_modules comes from this image's layer (not the host).
# ---------------------------------------------------------------------------
FROM deps AS dev
COPY . .
ENV NODE_ENV=development
EXPOSE 3000
# Stays root: source is bind-mounted from the host and .next/node_modules
# are named volumes, both awkward to make writable for a fixed container
# UID. Not a security boundary in dev -- the runner stage (immutable, no
# bind mounts) is non-root.
CMD ["npm", "run", "dev"]

# ---------------------------------------------------------------------------
# builder: production build, needs full deps + source
# ---------------------------------------------------------------------------
FROM deps AS builder
COPY . .
ENV NODE_ENV=production
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build

# ---------------------------------------------------------------------------
# runner: minimal production image -- standalone server + traced deps only,
# no node_modules, no source, no package manager.
# ---------------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
EXPOSE 3000
USER node
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/', r => process.exit(r.statusCode < 500 ? 0 : 1)).on('error', () => process.exit(1))"
CMD ["node", "server.js"]
