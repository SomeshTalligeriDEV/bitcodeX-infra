# BitcodeX self-host images. One builder compiles the Rust threshold-signing code once
# (Node addons for the API, WASM for the iframe); three small runtime targets use it.
#   docker compose -f docker-compose.selfhost.yml build

# ───────────── builder ─────────────
FROM node:22-bookworm-slim AS builder
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential curl ca-certificates git pkg-config python3 \
    && rm -rf /var/lib/apt/lists/*
ENV RUSTUP_HOME=/opt/rustup CARGO_HOME=/opt/cargo PATH=/opt/cargo/bin:$PATH
# Toolchain version comes from rust-toolchain(.toml) in the repo.
RUN curl -sSf https://sh.rustup.rs | sh -s -- -y --profile minimal --default-toolchain none
COPY rust-toolchain* /src/
WORKDIR /src
RUN rustup show active-toolchain || rustup toolchain install
RUN cargo install wasm-pack --version 0.15.0 --locked
RUN corepack enable
COPY . .
RUN yarn install --immutable
# Same build steps as CI (AGENTS.md): addons + WASM, internal packages, SDKs.
RUN yarn ci build_cs && yarn ci build_frost && yarn ci build_pkgs && yarn ci build_sdk

# Iframe settings are baked in at build time (Vite).
ARG VITE_BITCODEX_API_ENDPOINT
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_GITHUB_CLIENT_ID=""
ARG VITE_BITTENSOR_ALLOWED_HOST_ORIGINS=""
ARG VITE_USER_DASHBOARD_ORIGINS=""
ARG VITE_DEMO_WEB_ORIGIN=""
ENV VITE_BITCODEX_API_ENDPOINT=$VITE_BITCODEX_API_ENDPOINT \
    VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID \
    VITE_GITHUB_CLIENT_ID=$VITE_GITHUB_CLIENT_ID \
    VITE_BITTENSOR_ALLOWED_HOST_ORIGINS=$VITE_BITTENSOR_ALLOWED_HOST_ORIGINS \
    VITE_USER_DASHBOARD_ORIGINS=$VITE_USER_DASHBOARD_ORIGINS \
    VITE_DEMO_WEB_ORIGIN=$VITE_DEMO_WEB_ORIGIN
RUN cd embed/bitcodex_attached && npx vite build

# ───────────── slim dependency sets (production deps of one service only) ─────────────
FROM builder AS api-deps
RUN yarn workspaces focus --production @bitcodex/bitcodex-api-server \
    && rm -rf apps examples sandbox docs internals/docker target crypto/*/*/target

FROM builder AS ksn-deps
RUN yarn workspaces focus --production @bitcodex/key-share-node-server \
    && rm -rf apps examples sandbox docs internals/docker target crypto/*/*/target

# ───────────── runtime base (glibc, same as builder: native addons + esbuild) ─────────────
FROM node:22-bookworm-slim AS runtime
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/* && corepack enable
RUN useradd --create-home --uid 10001 bitcodex
WORKDIR /app

# ───────────── API ─────────────
FROM runtime AS api
COPY --from=api-deps --chown=bitcodex:bitcodex /src /app
USER bitcodex
WORKDIR /app/backend/bitcodex_api/server
ENV NODE_ENV=production
EXPOSE 4200
CMD ["corepack", "yarn", "start"]

# ───────────── key share node (needs pg_dump 17 for its startup backup) ─────────────
FROM runtime AS ksn
RUN apt-get update && apt-get install -y --no-install-recommends gnupg lsb-release \
    && curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/pgdg.gpg \
    && echo "deb [signed-by=/usr/share/keyrings/pgdg.gpg] https://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list \
    && apt-get update && apt-get install -y --no-install-recommends postgresql-client-17 \
    && rm -rf /var/lib/apt/lists/*
COPY --from=ksn-deps --chown=bitcodex:bitcodex /src /app
USER bitcodex
WORKDIR /app/key_share_node/server
ENV NODE_ENV=production
CMD ["corepack", "yarn", "start"]

# ───────────── iframe (static) ─────────────
FROM nginx:1.27-alpine AS iframe
COPY selfhost/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /src/embed/bitcodex_attached/dist /usr/share/nginx/html
EXPOSE 80
