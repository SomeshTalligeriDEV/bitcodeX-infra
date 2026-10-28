# ───────────────
# Builder stage
# ───────────────
FROM node:22.0.0-alpine AS builder

# Install build tools and system dependencies for Rust and Node native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    git \
    musl-dev \
    openssl-dev \
    curl

# Switch to node user and set Rust environment variables
USER node
ENV CARGO_HOME=/home/node/.cargo
ENV PATH="${CARGO_HOME}/bin:${PATH}"

# Install rustup (Rust toolchain manager)
RUN curl https://sh.rustup.rs -sSf | sh -s -- -y

# Create working directory and copy source code
RUN mkdir -p /home/node/bitcodex && chown -R node:node /home/node/bitcodex
WORKDIR /home/node/bitcodex
COPY --chown=node:node ../../.. .

# Remove .npmrc before yarn set version to avoid NPM_TOKEN env var error
# .npmrc is only needed for publishing, not for building
RUN rm -f .npmrc || true

RUN yarn set version 4.7.0

# Install dependencies for tecdsa addon
RUN yarn workspaces focus addon

# Build tecdsa Rust napi addon
WORKDIR /home/node/bitcodex/crypto/tecdsa/cait_sith_cosmos_compat_addon/addon
RUN yarn run build

# Install dependencies for teddsa addon
WORKDIR /home/node/bitcodex
RUN yarn workspaces focus @bitcodex/teddsa-addon-native

# Build teddsa Rust napi addon
WORKDIR /home/node/bitcodex/crypto/teddsa/teddsa_addon/addon
RUN yarn run build

# Build stdlib-js
WORKDIR /home/node/bitcodex
RUN yarn workspaces focus @bitcodex/stdlib-js
WORKDIR /home/node/bitcodex/lib/stdlib_js
RUN yarn run build

# Build dotenv (depends on stdlib-js)
WORKDIR /home/node/bitcodex
RUN yarn workspaces focus @bitcodex/dotenv
WORKDIR /home/node/bitcodex/lib/dotenv
RUN yarn run build

# Build crypto/bytes
WORKDIR /home/node/bitcodex
RUN yarn workspaces focus @bitcodex/bytes
WORKDIR /home/node/bitcodex/crypto/bytes
RUN yarn run build

# Build tecdsa-interface
WORKDIR /home/node/bitcodex
RUN yarn workspaces focus @bitcodex/tecdsa-interface
WORKDIR /home/node/bitcodex/crypto/tecdsa/tecdsa_interface
RUN yarn run build

# Build bitcodex-types (depends on stdlib-js, bytes, tecdsa-interface)
WORKDIR /home/node/bitcodex
RUN yarn workspaces focus @bitcodex/bitcodex-types
WORKDIR /home/node/bitcodex/common/bitcodex_types
RUN yarn run build

# Build teddsa-interface (depends on bytes, bitcodex-types/teddsa)
WORKDIR /home/node/bitcodex
RUN yarn workspaces focus @bitcodex/teddsa-interface
WORKDIR /home/node/bitcodex/crypto/teddsa/teddsa_interface
RUN yarn run build

# Build ksn-interface (depends on bytes, bitcodex-types)
WORKDIR /home/node/bitcodex
RUN yarn workspaces focus @bitcodex/ksn-interface
WORKDIR /home/node/bitcodex/key_share_node/ksn_interface
RUN yarn run build

# Install dependencies for crypto-js
WORKDIR /home/node/bitcodex
RUN yarn workspaces focus @bitcodex/crypto-js

# Build crypto-js
WORKDIR /home/node/bitcodex/crypto/crypto_js
RUN yarn run build

WORKDIR /home/node/bitcodex

# Install dependencies for bitcodex_api_server
RUN yarn workspaces focus --production \
    @bitcodex/bitcodex-api-server

# ───────────────
# Runtime stage
# ───────────────
FROM node:22.0.0-alpine AS runtime

USER node
WORKDIR /home/node/bitcodex

# Copy source code from builder
COPY --from=builder --chown=node:node /home/node/bitcodex /home/node/bitcodex

WORKDIR /home/node/bitcodex/backend/bitcodex_api/server
CMD ["yarn", "start"]
