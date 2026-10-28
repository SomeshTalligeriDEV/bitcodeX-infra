# BitcodeX Infrastructure

Embedded wallet infrastructure for Bittensor applications.

BitcodeX is being developed to help applications offer wallet onboarding, user-approved signing, and account management through a shared SDK and self-hosted services.

> **Status:** Early development. Bittensor transaction signing and the complete local deployment are not yet verified end to end. This repository is not production-ready.

## Planned capabilities

- Email and social authentication for wallet onboarding.
- Threshold Ed25519 signing for Bittensor coldkey accounts.
- An isolated wallet interface for reviewing and approving signatures.
- Distributed backup fragments for recovering the client signing share.
- SDK integration for addresses, messages, and transaction signing.
- Developer tools for application configuration and account management.

Hotkeys remain separate from the threshold coldkey system. The planned application stores hotkey public addresses, while operational hotkeys are managed on the machines that use them.

## Architecture

| Component | Responsibility |
| --- | --- |
| Application SDK | Connect applications to wallet authentication and signing |
| Wallet interface | Show transaction details and request user approval |
| Signing API | Participate in threshold signing and manage sessions |
| Key-share nodes | Store recovery fragments for the client share |
| PostgreSQL | Persist application, wallet, and service records |
| Object storage | Serve application assets and uploaded metadata |
| Email service | Deliver supported verification and application emails |
| Bittensor connection | Read chain state and submit signed extrinsics |

Normal signing is intended to require both the client and server participants. Initial key generation, recovery, export, and browser storage need separate security review before deployment.

## Development direction

The first milestone is a reproducible local environment and a verified signing flow. Bittensor integration will then add chain configuration, SS58 addresses, runtime-aware transaction decoding, fee previews, and signed-extrinsic submission.

The planned local infrastructure uses PostgreSQL, S3-compatible object storage, and a development email inbox. Wallet authentication requires its own identity-provider configuration; an SMTP inbox alone does not implement social or passwordless login.

Initial validation targets local and test networks. Mainnet support is outside the current acceptance scope.

## Roadmap

1. Establish the local build and service baseline.
2. Configure application-owned authentication and infrastructure.
3. Verify threshold Ed25519 signatures against Bittensor transaction payloads.
4. Add transaction review and SDK integration.
5. Validate recovery, export, and operational controls.
6. Complete security review before production use.

## Repository status

This repository contains the wallet SDKs, signing services, recovery nodes, embedded interface, dashboards, and development tooling. Product names and source paths use the BitcodeX namespace.

| Directory | Contents |
| --- | --- |
| \`sdk/\` | Core, chain adapters, React and mobile integrations |
| \`crypto/\` | Threshold-signature primitives and bindings |
| \`backend/\` | API, database access and dashboard routes |
| \`key_share_node/\` | Recovery-fragment services |
| \`embed/\` | Wallet authentication, approval and signing interface |
| \`apps/\` | Demo, dashboards and documentation |
| \`bitcodex-spec/bitcodex-docs/\` | Architecture, implementation plans and findings |

### Local development

Use Node.js 22+, the pinned Yarn 4 release, the pinned Rust toolchain, wasm-pack, and PostgreSQL. Build native/WASM dependencies before the SDKs:

\`\`\`sh
corepack yarn install --immutable
corepack yarn ci build_cs
corepack yarn ci build_frost
corepack yarn ci build_pkgs
corepack yarn ci build_sdk
corepack yarn ci typecheck
\`\`\`

See [development setup](documentation/install_and_run.md) and [self-hosting](apps/docs_web/docs/v0/standalone/self-hosting-standalone.md). Provider IDs and credentials must be supplied by your deployment. The inherited registration shutdown guard remains in place pending a separate functional change; a fresh end-to-end signup is not yet an acceptance result.

### Licensing

See [LICENSE](LICENSE) and [NOTICE](NOTICE). Bundled third-party components retain their individual notices and licenses.

## Security

Do not commit credentials, private keys, key shares, authentication tokens, or signing nonces. Use dedicated development accounts and test networks while the integration is under construction.
