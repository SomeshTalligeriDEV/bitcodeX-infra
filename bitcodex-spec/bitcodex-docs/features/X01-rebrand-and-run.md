# X01 · Rebrand to BitcodeX and run everything locally

**Tier:** BUILD · **Phase:** 1 · **Owner:** Builder 2

## Goal
The whole BitcodeX stack runs on our laptop with BitcodeX branding, our own OAuth apps, and $0 services.

## Research first
- `documentation/install_and_run.md`, `apps/docs_web/docs/v0/standalone/self-hosting-standalone.md`, `apps/docs_web/docs/v0/development/environment-setup.md`.
- `internals/docker/docker-compose.yml`, `key_share_node/docker/`, every `envs.ts`.
- `bitcodex-docs/05-rebrand.md`.

## How to build
1. `docker-compose.bitcodex.yml` at the root: Postgres 17, MinIO (+ bucket create), Mailpit (SMTP :1025, UI :8025), subtensor localnet. Pin image tags.
2. `.env.example` for bitcodex_api, each KSN, iframe, apps. Real values only in `.env` (gitignored). Generate secrets with `openssl rand -hex 32`.
3. Create our Google OAuth client (Testing mode, redirect URIs for localhost ports) and a GitHub OAuth app. Put IDs in env; remove hard-coded IDs (see 05-rebrand.md).
4. Stage A rebrand (05-rebrand.md), plus `NOTICE`.
5. `yarn ci setup --skip-rust`, start services (tmux script or compose), log in on demo_web with Google, sign a Solana devnet message.
6. `scripts/dev-up.sh` and `scripts/dev-down.sh` that do all of the above in one command.

## Acceptance checks
- [ ] `scripts/dev-up.sh` on a clean clone brings up every service; `curl :4200/` and `:4201/status`, `:4202/status` respond.
- [ ] Google and email login work (email code arrives in Mailpit).
- [ ] No "BitcodeX" visible in demo_web, iframe, user dashboard, emails.
- [ ] `git grep -n "421793224165"` (BitcodeX's Google client id) returns nothing.
- [ ] `NOTICE` present; `LICENSE` unchanged.
