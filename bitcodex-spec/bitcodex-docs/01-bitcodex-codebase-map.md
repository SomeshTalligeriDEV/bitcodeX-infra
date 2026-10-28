> Historical source audit: findings below describe the pre-rebrand snapshot. Paths and identifiers were migrated to BitcodeX for navigation. Shutdown dates and provider ownership describe the original distribution, not BitcodeX operations. See NOTICE for provenance. Rebrand validation is recorded in documentation/rebrand-validation.md.

# 01 · BitcodeX codebase map (read 28 Oct 2026, commit 6306354)

About 3,000 tracked files. Yarn 4 monorepo (Node 22+) plus a Rust workspace compiled to WASM (browser) and Node addons (server). BitcodeX's own architecture notes are in `AGENTS.md`; this file adds what matters for Bittensor.

## Layers

```
lib/            stdlib_js, dotenv, aws, postgres_lib          (shared utilities)
common/         bitcodex_types                                      (shared TS types)
crypto/         tecdsa (Cait-Sith, secp256k1), teddsa (FROST, Ed25519), bytes, crypto_js
sdk/            bitcodex_sdk_core -> bitcodex_sdk_eth | bitcodex_sdk_cosmos | bitcodex_sdk_svm | bitcodex_sdk_react | RN
backend/        bitcodex_api/server (main API + TSS), admin_api, ct_dashboard_api, user_dashboard_api,
                openapi (Zod), bitcodex_pg_interface (Knex migrations), error codes
key_share_node/ server (TS, Express), key_share_node_2 (Rust), pg_interface, ksn_interface
embed/          bitcodex_attached (React 19 + Vite iframe: login, keygen, signing UI, postMessage)
ui/             bitcodex_common_ui (shared React components)
apps/           demo_web :3200, customer_dashboard :3203, bitcodex_admin_web :3204, docs_web :3205,
                user_dashboard :3206, attached_mobile_host_web :3207
examples/, sandbox/  integration samples per chain
internals/      ci (yarn ci ...), docker, tmux, vercel
```

Default ports: bitcodex_api 4200, key share nodes 4201/4202/4203, bitcodex_attached 3201.

## The key model we reuse (Ed25519 path)

1. Client makes a random seed → SHA-512 + RFC 8032 clamping → Ed25519 scalar → **FROST 2-of-2 split**: share P0 (browser), share P1 (server, encrypted in bitcodex_api DB).
2. The seed is also 2-of-2 SSS-split: server seed share + user seed share; the user part is SSS t-of-n split across **key share nodes (KSNs)** for recovery only. KSNs do not sign.
3. Sign-in: the iframe presents the OAuth/email token to each KSN, gets fragments, rebuilds its share once, keeps it on device.
4. Signing: round 1 (commitments) and round 2 (signature shares) between iframe and `/tss/v2/sign_ed25519/round1|round2`; the iframe aggregates a standard 64-byte Ed25519 signature.
5. The full private key is never rebuilt, except in the explicit export flow.

Key files: `embed/bitcodex_attached/src/crypto/keygen_ed25519.ts`, `sign_ed25519.ts`, `sss_ed25519.ts`, `combine.ts`, `reshare*.ts`; `crypto/teddsa/frost_ed25519_cosmos_compat_wasm/wasm/src/{keygen,sign}.rs` (exports `cli_keygen_seed_ed25519`, `cli_sign_round1_ed25519`, `cli_sign_round2_ed25519`, `cli_aggregate_ed25519`, `cli_verify_ed25519`); `backend/bitcodex_api/server/src/routes/tss_v2/{keygen_ed25519,sign_ed25519_round1,sign_ed25519_round2,export_shares}.ts`.

## API routes (from source)

- bitcodex_api TSS v2: `/tss/v2/keygen`, `/keygen_ed25519`, `/sign_ed25519/round1`, `/sign_ed25519/round2`, `/presign/step1-3`, `/sign/step1`, `/triples/step1-11` (ECDSA), `/commit`, `/export_shares`, `/user/check`, `/user/signin`, `/user/signin_silently`, `/user/reshare`, plus `report_key_share_not_found`.
- bitcodex_api also: `social_login_v1/v2`, `log_v1`, `user_dashboard/v1`, status.
- KSN: `/keyshare/v2/check`, `/commit`, `/register`, `/register/ed25519`, `/reshare` (and v1).

## Login providers (iframe)

`embed/bitcodex_attached/src/routes/{email,google,github,x,discord,telegram}` and `app/auth0`, config in `src/config/oauth.ts`, `auth0.ts`, `telegram.ts`. **Client IDs are hard-coded to BitcodeX's apps** (`GOOGLE_CLIENT_ID`, `X_CLIENT_ID`, `DISCORD_CLIENT_ID`, `GITHUB_CLIENT_ID`) in the iframe and in `backend/.../google_auth/client_id.ts` and `key_share_node/server/src/auth/google/client_id.ts`. Replace with our own, from env.

## postMessage API (iframe ↔ SDK)

`embed/bitcodex_attached/src/window_msgs/`: `get_public_key`, `get_public_key_ed25519`, `get_wallet_info`, `get_email`, `get_name`, `get_auth_type`, `open_modal`, `sign_out`, `export_private_key`, `export_key_store`, `export_reauth_state`, `generate_oauth_url`, `set_oauth_nonce`, `set_code_verifier`, `get_connected_apps`, chain info getters. SDK side: `sdk/bitcodex_sdk_core/src/methods/*` mirrors these.

## Copy map: SVM → Bittensor (what a new `bittensor` ecosystem must mirror)

| BitcodeX SVM file/folder | BitcodeX Bittensor equivalent | Notes |
|---|---|---|
| `sdk/bitcodex_sdk_svm/` | `sdk/bitcodex_sdk_bittensor/` | Exposes a polkadot.js `Signer` (`signPayload`, `signRaw`) + helpers `connect`, `signAndSend`, `signMessage`, `getAddress`. Drop Solana wallet-standard; add `@polkadot/extension-inject`-compatible injection (X02). |
| `sdk/bitcodex_sdk_core/src/types/` (sign types, msg types) | add `bittensor` sign data types | `MakeBittensorSigData` with `{ kind: "extrinsic" | "raw", payload, chain_id, origin }`. |
| `sdk/bitcodex_sdk_react` `useBitcodeXSvm` | `useBitcodexBittensor` | Same shape. |
| `embed/bitcodex_attached/src/components/modal_variants/svm/` | `modal_variants/bittensor/` | tx summary, fee, message sig, "all tx" batch. |
| `embed/bitcodex_attached/src/tx-parsers/svm/` | `tx-parsers/bittensor/` | Decode call with `api.registry.createType('Call', ...)`; map pallet.method to friendly cards (X03). |
| `embed/bitcodex_attached/src/web3/svm/` (fee, token metadata) | `web3/bittensor/` | `paymentInfo` fee, balances, stake info, TAO price. |
| `embed/bitcodex_attached/src/requests/chain_infos.ts` | local Bittensor chain list | localnet, testnet, mainnet (disabled). Not in Keplr registry. |
| `apps/demo_web/src/components/widgets/solana_*_sign_widget` | `bittensor_*_widget` | transfer, stake, register hotkey, sign message, proxy. |
| `apps/user_dashboard` SVM assets | Bittensor assets + stake positions | X06. |
| `examples/svm_nextjs`, `sandbox/sandbox_sol` | `examples/bittensor_nextjs`, `sandbox/sandbox_bittensor` | |

## External services the backend expects

Postgres 17 (required, bitcodex_api and each KSN), S3 (required env; use **MinIO** locally), SMTP (email OTP; use **Mailpit** locally or a Gmail app password), Elasticsearch (optional, leave empty), Amplitude analytics in the iframe (remove or disable).

## Known oddities

- `apps/user_dashboard/src/components/service_shutdown_modal` announces BitcodeX's shutdown (1 June 2026). Remove in the rebrand.
- Root `CLAUDE.md` / `GEMINI.md` are one-liners importing `AGENTS.md`.
- Mock packages (`teddsa_*_mock`) exist for tests; do not ship them.

## Agent findings (dated)


### 2026-10-28 — source audit and local execution attempt

**Status: source map completed for the requested paths; local end-to-end acceptance is BLOCKED, not passed.** No application source was edited. This is a source-based investigation, not a security audit or a claim that every line in the repository has been reviewed. Inventories below distinguish manifest declarations and lexical matches from executed behavior.

Read in full: root CLAUDE.md and AGENTS.md; bitcodex-spec/CLAUDE.md; this kit's README.md, 00-research.md, 01-bitcodex-codebase-map.md, 02-bittensor-wallets.md, 03-architecture.md; documentation/install_and_run.md; apps/docs_web/docs/v0/standalone/self-hosting-standalone.md; apps/attached_mobile_host_web/CLAUDE.md. The kit remains nested in bitcodex-spec; its CLAUDE.md has not replaced the root one-line import.

#### Corrections that take precedence over the introductory map

1. **Fresh signup is disabled in executable code**, not merely discouraged by a shutdown modal. backend/bitcodex_api/server/src/routes/tss_v2/keygen.ts:keygenV2 returns SIGNUP_DISABLED unconditionally; its previous runKeygenV2 call is commented out. The v1 keygen route is also disabled. Successful fresh signup cannot be demonstrated without a source change.
2. **The new-user route is POST /tss/v2/keygen plus POST /keyshare/v2/register (both curves)**. POST /tss/v2/keygen_ed25519 and POST /keyshare/v2/register/ed25519 are the existing-secp256k1-user upgrade path. In both paths, client SSS splitting and KSN registration happen BEFORE the main API stores the server share. The requested server-store-then-split sequence is not the code's order.
3. **Full seed/scalar exists at initial keygen.** crypto/keygen_ed25519.ts generates a full random seed in the iframe; WASM derives the full scalar and splits it with a dealer. Both FROST shares temporarily exist there. Signing does not reconstruct the full key, but “full coldkey must never exist in one place except export” conflicts with reusing this keygen unchanged.
4. **Two different KSN backups exist:** the browser FROST signing share is t-of-n split over Ed25519; separately the original seed is 2-of-2 split, and the user's seed-share Y is t-of-n split using Cait-Sith seed SSS. Restoring the client signing share is not reconstructing the full seed.
5. **Wallet email OTP is Auth0 passwordless**, not local SMTP. Mailpit alone cannot implement existing wallet login. SMTP serves dashboard/admin verification, invitations and reminders.
6. **Client shares persist**, not just in memory: embed/bitcodex_attached/src/store/app.ts uses Zustand persist with default browser storage and no encryption/partialize override. keyshare_1, keyPackageEd25519, seedEd25519, wallet metadata and JWT are stored per storageKey. seedEd25519 here is the user's seed-share Y, not the complete seed.
7. **KSNs back up/release shares; they do not participate in each FROST signing round.** The API and iframe are the two signers.
8. HTTP mounts are /social-login/v1, /social-login/v2 and /log/v1, not social_login_v1/v2 or log_v1. SSS retrieval is POST /keyshare/v2/ (not /check). Missing-share reporting is POST /tss/v2/user/report_key_share_not_found. ECDSA includes /sign/step2 too.
9. Four mock workspaces are declared but their package.json files are absent; teddsa_interface is listed twice. The full manifest inventory below records these rather than assuming they exist.
10. apps/attached_mobile_host_web currently has Vite scripts, despite its older CLAUDE.md describing Next.js. Both src/app and router-era structures coexist in parts of the tree; follow actual entrypoints.
11. This directory has **no .git metadata and no root LICENSE file**. The supplied commit/date and “tracked file” claims cannot be established from this snapshot. Vendored crypto license files exist. Restore authoritative provenance/license material before distributing; this is an observed missing artifact, not a legal conclusion.
12. S3 credentials are required schema strings, but S3 network access is used for customer logo uploads, not threshold signing. lib/aws/src/s3/index.ts has no explicit endpoint/path-style option and returns an AWS-formatted public URL: MinIO is not a verified drop-in from the documented env alone.

#### Flow A — Google login, new-user keygen, and Ed25519 upgrade

Path abbreviations used only in these numbered traces: **I** = embed/bitcodex_attached/src; **C** = sdk/bitcodex_sdk_core/src; **S** = sdk/bitcodex_sdk_svm/src; **A** = backend/bitcodex_api/server/src; **K** = key_share_node/server/src. They refer to real source files relative to the repository root.

1. C/methods/sign_in/index.ts:signIn -> C/methods/sign_in/google.ts:handleGoogleSignIn -> tryGoogleSignIn. Opens a blank popup immediately; sends **generate_oauth_url** through C/methods/send_msg_to_iframe.ts.
2. I/window_msgs/index.ts:makeMsgHandler -> I/window_msgs/generate_oauth_url.ts:handleGenerateOAuthUrl -> buildGoogleOAuthUrl. Saves nonce and returns **generate_oauth_url_ack**. Google authorization URL is https://accounts.google.com/o/oauth2/v2/auth; redirect is attached-origin /google/callback. This is a browser provider redirect, not an BitcodeX HTTP route.
3. I/routes/google/callback/index.tsx -> I/components/google_callback/use_callback.tsx:handleGoogleCallback -> I/components/oauth_callback/send_oauth_payload.ts:sendOAuthPayloadToEmbeddedWindow -> sendMsgToEmbeddedWindow -> I/window_msgs/send.ts:sendMsgToWindow. Sends **oauth_info_pass** through a MessageChannel to the same-origin attached frame within the opener; Safari fallback uses BroadcastChannel.
4. I/window_msgs/index.ts dispatches to **handleOAuthInfoPassV2**, not the retained v1 handleOAuthInfoPass. I/window_msgs/oauth_info_pass/validate_social_login.ts:getCredentialsFromPayload -> validateOAuthPayload -> token.ts:verifyIdToken; checks registered nonce and Google JWT via JWKS (https://www.googleapis.com/oauth2/v3/certs), audience/issuer and identity. Re-auth intercept is handled before normal signup in the v2 handler.
5. I/window_msgs/oauth_info_pass/handlers/check_user.ts:checkUserExistsV2 -> I/requests/bitcodex_api.ts:makeBitcodeXApiRequest -> **POST /tss/v2/user/check** -> A/routes/tss_v2/user_check_email.ts:userCheckEmailV2 -> A/api/tss/v2/user/index.ts:checkEmailV2. Returns wallet existence, needs_reshare/needs_ed25519_keygen and node metadata. Active nodes below threshold block all flows.
6. **New-user branch:** I/window_msgs/oauth_info_pass/handlers/new_user.ts:handleNewUserV2 first runs crypto/tecdsa/cait_sith_cosmos_compat_hooks keygen and I/crypto/keygen.ts:splitUserKeyShares for secp256k1; then I/crypto/keygen_ed25519.ts:runEd25519KeygenAndSplit.
7. runEd25519KeygenAndSplit -> generateSeed -> crypto/teddsa/teddsa_hooks/src/keygen.ts:runTeddsaKeygenSeed -> crypto/teddsa/frost_ed25519_cosmos_compat_wasm/wasm/src/keygen.rs:cli_keygen_seed_ed25519 -> keygen_from_seed_inner -> keygen_import_inner -> frost::keys::split. SHA-512, RFC8032 clamp, scalar reduction; two participants, min_signers=2; identifiers scalar 1 and 2.
8. I/crypto/sss_ed25519.ts:extractSigningShare -> splitTeddsaSigningShare -> hashKeyshareNodeNamesEd25519 -> WASM sss_split. Maps sorted FROST identifiers back to node names. Independently Cait-Sith WASM seed_sss_split splits seed 2-of-2 and user seed Y t-of-n. Names determine stable SSS identifiers; do not casually rename registered nodes.
9. I/crypto/commit_reveal/session.ts:commitAll -> createCommitRevealSession (ephemeral client keypair and identity-token hash) -> I/requests/bitcodex_api.ts:commitToBitcodeXApi **POST /tss/v2/commit**, then I/requests/ks_node_v2.ts:commitToKsNode **POST /keyshare/v2/commit** on nodes. Resolve enough successful commits using registration_threshold (default all nodes), then resolvePendingCommits. Reveal signatures bind session, operation and node using signature.ts:createKsnCommitRevealParams/createBitcodeXApiCommitRevealParams. Do not omit this stage.
10. I/requests/ks_node_v2.ts:registerKeySharesV2 -> **POST /keyshare/v2/register** with both curves plus Ed25519 seed fragment -> K/routes/key_share_v2/index.ts commitRevealMiddleware("register") + bearerTokenMiddleware -> register.ts:keyshareV2Register -> K/api/key_share/v2.ts:registerKeyShareV2 -> helper.ts:registerSecp256k1WalletKeyShare/registerEd25519WalletKeyShare -> registerWalletKeyShareInternal -> encryptDataAsync -> key_share_node/pg_interface createWallet/createKeyShare. Ed25519 encrypted JSON contains share and seed_share.
11. I/handlers/new_user.ts -> crypto/tecdsa/api_lib:reqKeygenV2 -> **POST /tss/v2/keygen** carrying server secp256k1 share, serialized server Ed25519 package and server seed share. Router middleware: apiKeyMiddleware -> oauthMiddleware -> commitRevealMiddleware("keygen") -> tssActivateMiddleware -> keygenV2. **Actual execution ends with SIGNUP_DISABLED.** KSN writes earlier in the flow may already have happened.
12. **Dormant intended continuation, not reachable through current route:** A/api/tss/v2/keygen/index.ts:runKeygenV2 -> A/api/tss/ks_node/index.ts:checkKeyShareFromKSNodesV2 -> **POST /keyshare/v2/check** -> K/routes/key_share_v2/check.ts:keyshareV2Check -> checkKeyShareV2. Verify registration threshold, extract server signing_share/verifying_share/seed_share, encryptDataAsync, transactional backend/bitcodex_pg_interface createWallet/createWalletKSNodes for both curves, issue JWT. Optional referral saves through **POST /social-login/v2/referral**.
13. **Existing secp256k1-only user branch:** I/window_msgs/oauth_info_pass/handlers/ed25519_keygen.ts:handleExistingUserNeedsEd25519Keygen -> runEd25519KeygenAndSplit -> commitAll("add_ed25519") -> **POST /keyshare/v2/register/ed25519** on ACTIVE nodes via registerKeyShareEd25519V2 -> K/routes/key_share_v2/ed25519.ts:registerKeyshareEd25519 -> K/api/key_share/v2.ts:registerEd25519V2 -> helper.ts:registerEd25519WalletKeyShare -> encrypted DB storage.
14. Upgrade then calls crypto/teddsa/api_lib:reqKeygenEd25519 -> **POST /tss/v2/keygen_ed25519** -> oauthMiddleware + commitRevealMiddleware("keygen_ed25519") + tssActivateMiddleware -> A/routes/tss_v2/keygen_ed25519.ts:keygenEd25519 -> A/api/tss/v2/keygen/index.ts:runKeygenEd25519. Requires existing secp256k1 wallet, verifies KSN registration through /keyshare/v2/check, encrypts server JSON and creates Ed25519 wallet/node mappings.
15. Upgrade retrieves existing secp256k1 fragments together with the just-created Ed25519 fragments via **POST /keyshare/v2/**, reconstructs secp256k1, and retains freshly generated Ed25519 client package. Reshare+upgrade variant is handleReshareAndEd25519Keygen: additionally /tss/v2/user/signin, /keyshare/v2/reshare and /tss/v2/user/reshare.
16. Successful handler returns to I/window_msgs/oauth_info_pass/index.ts:handleOAuthInfoPassV2, writes I/store/app.ts, sends **oauth_sign_in_update** to host (host responds **oauth_sign_in_update_ack**), and **oauth_info_pass_ack** to popup in finally; clears nonce. The info-pass ack alone is not proof signup succeeded.

#### Flow B — returning-user recovery

1. Same provider and **oauth_info_pass** sequence as A. I/check_user.ts -> **POST /tss/v2/user/check** selects handleExistingUserV2 when both wallets exist without reshare.
2. I/window_msgs/oauth_info_pass/handlers/existing_user.ts:handleExistingUserV2 -> commitAll("sign_in") -> **POST /tss/v2/commit** and **POST /keyshare/v2/commit**; here recovery threshold, not registration threshold, controls early success.
3. I/requests/bitcodex_api.ts:signInV2 -> **POST /tss/v2/user/signin** -> A/routes/tss_v2/user_signin.ts:userSignInV2 -> A/api/tss/v2/user/index.ts:signInV2. OAuth, API-key, commit-reveal and activation middleware precede handler. Returns wallet IDs/public keys/JWT and server_verifying_share_ed25519 (a public group point, not server secret).
4. I/requests/ks_node_v2.ts:requestKeySharesWithBackup -> requestKeyShareFromNode -> **POST /keyshare/v2/** with Bearer provider token and cr_session_id/cr_signature. Requests both wallets. Ready nodes tried first, pending successful commits provide backups; MAX_RETRIES=2 for retryable errors; missing-data errors are not retried.
5. K/routes/key_share_v2/index.ts -> commitRevealMiddleware("get_key_shares") -> bearerTokenMiddleware -> get_key_shares.ts:getKeysharesV2 -> K/api/key_share/v2.ts:getKeyShareV2 -> helper.ts:getEd25519WalletKeyShare/getSecp256k1WalletKeyShare -> getWalletKeyShareInternal -> DB lookup, ownership check, decryptDataAsync. Response contains plaintext fragments inside JSON; HTTPS supplies transport encryption outside local HTTP. Commit-reveal is authentication, not an encrypted transport tunnel.
6. I/crypto/key_share_utils.ts:decodeEd25519SharesByNode/decodeSecp256k1SharesByNode -> I/crypto/sss_ed25519.ts:combineTeddsaShares -> WASM sss_combine, once in this successful login path; I/crypto/combine.ts:combineUserShares separately restores secp256k1.
7. I/crypto/reshare_v2.ts:convertSeedShares -> Cait-Sith seed_sss_combine restores user seed Y. buildKeyPackageResult uses client signing share + group public key + public server verifying share to construct client KeyPackage/PublicKeyPackage with FROST threshold 2.
8. Missing-node reports: I/requests/bitcodex_api.ts:reportKeyShareNotFound -> **POST /tss/v2/user/report_key_share_not_found** -> A/routes/tss_v2/report_key_share_not_found.ts -> A/api/tss/v2/user/index.ts:reportKeyShareNotFoundV2.
9. Persist reconstructed package/JWT through I/store/app.ts; send the same success/update/ack messages as A. Subsequent signatures read the stored package, not KSNs. “Once” applies per recovery operation, not once per account lifetime. Silent signin (/tss/v2/user/signin_silently) and reshare paths are separate branches.

#### Flow C — demo SVM transaction/message signing

1. apps/demo_web/src/components/widgets/solana_onchain_sign_widget/solana_onchain_sign_widget.tsx:handleClickSolOnchainSignV0 -> sdk/bitcodex_sdk_react/src/svm/use_bitcodex_svm.ts:useBitcodeXSvm -> S/methods/connect.ts:connect if needed. Ed25519 public key comes through **get_public_key_ed25519 / get_public_key_ed25519_ack**; core initialization uses **init / init_ack**, and wallet getters use their corresponding ack types.
2. Demo constructs Connection("https://api.devnet.solana.com"), calls JSON-RPC getLatestBlockhash, builds SystemProgram.transfer (0.001 SOL to the all-ones address), compiles v0 TransactionMessage and calls bitcodexSvm.signTransaction. This widget signs and logs the signature; it does **not** broadcast a transaction.
3. S/methods/sign_transaction.ts:signTransaction -> S/methods/make_signature.ts:makeSignature -> createMakeSignatureData. Payload: chain_type="svm", sign_type="tx", origin, signer, chain_id; serialized_transaction base64 for display, message_to_sign base64 for signing, is_versioned.
4. make_signature.ts:handleSigningFlow -> C/methods/open_modal.ts:openModal -> C/methods/send_msg_to_iframe.ts:sendMsgToIframe. Message **open_modal**, modal_type **svm/make_signature**, UUID modal_id; iframe becomes visible.
5. I/window_msgs/index.ts:makeMsgHandler -> I/window_msgs/open_modal.ts:handleOpenModal -> I/store/memory/index.ts:openModal -> I/components/modal/modal_dialog.tsx:ModalDialog -> I/components/modal_variants/svm/make_signature_svm_modal.tsx:MakeSignatureSvmModal -> tx_sig/make_tx_sig_modal.tsx:MakeTxSigModal.
6. Display path: tx_sig/use_parse_tx.ts -> I/tx-parsers/svm/parser.ts:parseTransaction/deserializeTransaction -> parseLegacyTransaction/parseVersionedTransaction -> instruction.ts:parseInstruction/getParserForProgram. Uses Solana instruction parsers; the versioned parser only indexes message.staticAccountKeys and does not resolve address lookup tables. Loaded-address transactions can fail parsing; this is a limitation to avoid copying. tx_sig/svm_tx_fee.tsx -> I/web3/svm/use_calculate_fee.ts:useCalculateFee computes fees locally using 5000 lamports/signature, default 200000 compute units and parsed priority-fee instructions; it does not query RPC for fees. Chain metadata is GET https://keplr-api.keplr.app/v1/chains/all via I/requests/chain_infos.ts. Token metadata uses I/store/asset_meta.ts -> I/requests/asset_meta.ts:postAssetMeta -> POST <KEPLR_API_ENDPOINT>/v1/asset_meta, then GET https://api.jup.ag/tokens/v2/search?query=<mint> fallback. instruction.ts:getParserForProgram calls external package getProgramIdl; dependency internals could not be inspected after failed install, so its downstream endpoint is not verified. These display dependencies are not required by FROST itself.
7. User approval -> tx_sig/use_tx_sig_modal.tsx:useTxSigModal.onApprove -> use_svm_signature_base.tsx:prepareSigningContext -> I/crypto/keygen_ed25519.ts:extractKeyPackageHex/teddsaKeygenFromHex. Reads persisted client package, public package, API key, JWT.
8. onApprove decodes **message_to_sign** -> use_svm_signature_base.tsx:signMessageToHex -> I/crypto/sign_ed25519.ts:makeSignOutputEd25519 -> crypto/teddsa/teddsa_hooks/src/sign.ts:runTeddsaSign.
9. runTeddsaSign -> teddsaSignRound1 -> WASM sign.rs:cli_sign_round1_ed25519 (client nonces/commitments remain local); crypto/teddsa/api_lib:reqSignEd25519Round1 -> **POST /tss/v2/sign_ed25519/round1** with message bytes, JWT and API key.
10. A/routes/tss_v2/index.ts applies apiKeyMiddleware, userJwtMiddlewareV2, tssActivateMiddleware -> sign_ed25519_round1.ts:signEd25519Round1 -> A/api/tss/sign_ed25519/index.ts:runSignEd25519Round1. Validates wallet/email/curve, decrypts server share, crypto/teddsa/teddsa_addon/src/server/index.ts:reconstructKeyPackageEd25519/runSignRound1Ed25519 -> addon/src/keygen.rs:napi_reconstruct_key_package_ed25519 and addon/src/sign.rs:napi_sign_round1_ed25519 -> sign_round1_inner. Creates Postgres TSS session/stage storing message, nonces, commitments. Returns session_id and commitments_0 (server is still P1/identifier 2; suffix 0 is API naming).
11. Client sorts both commitments -> reqSignEd25519Round2 -> **POST /tss/v2/sign_ed25519/round2**, session_id + commitments_1, JWT. A/routes/tss_v2/sign_ed25519_round2.ts:signEd25519Round2 -> runSignEd25519Round2: validates session/wallet/stage, reads stored nonces/message, decrypts package, crypto/teddsa/teddsa_addon/src/server/index.ts:runSignRound2Ed25519 -> addon/src/sign.rs:napi_sign_round2_ed25519 -> sign_round2_inner; writes COMPLETED stage/session and returns signature_share_0.
12. Client teddsaSignRound2 -> WASM cli_sign_round2_ed25519 with client nonces + both commitments -> teddsaAggregate -> WASM cli_aggregate_ed25519 -> standard 64-byte signature. runTeddsaSign does not separately call teddsaVerify; that helper exists.
13. signMessageToHex -> closeWithSignature -> I/store/memory/index.ts:closeModal -> **open_modal_ack**, type="approve", chain_type="svm", sig_result={type:"signature",signature:hex}. Reject/error use same modal discriminator with corresponding result.
14. S/make_signature.ts:convertSigResultToOutput attaches signature via legacy tx.addSignature or versioned static-account-key slot; signTransaction returns original transaction object with signature. finally core closeModal hides iframe.
15. Offchain branch: apps/demo_web/.../solana_offchain_sign_widget.tsx:handleClickSolOffchainSign -> S/methods/sign_message.ts:signMessage -> same flow with sign_type="message", hex message -> I/modal_variants/svm/message_sig/use_message_sig_modal.tsx -> same FROST. Message signing is network-independent; “devnet message” means the wallet's configured chain, not an on-chain devnet event.
16. Batch branch: sign_all_transactions -> sign_type="all_tx" -> all_tx_sig modal; mixed legacy/versioned transactions rejected by SDK. Sign-and-send methods subsequently submit using Solana RPC; wallet-standard adapts these methods separately.

**Security observation to resolve before mirroring:** the displayed serialized_transaction and message_to_sign are separate host-supplied fields. useTxSigModal signs the latter without deriving it from the former in that function. Bind displayed and signed payloads inside the trusted iframe for Bittensor; do not merely copy this shape.

#### Flow D — key export

1. apps/user_dashboard/src/app/export_private_key/page.tsx and attached export components initiate **__export_private_key__**; C/types/protected/export_priv_key.ts defines its contract. I/window_msgs/index.ts -> export_private_key.ts:handleExportPrivateKey.
2. Checks actual message hostOrigin against env VITE_USER_DASHBOARD_ORIGINS, existing first-login JWT, requested auth_type, client secp256k1 share, user seed Y and Ed25519 public key.
3. I/window_msgs/export_reauth_state.ts:setReAuthResolver waits up to five minutes. I/components/export/use_export_reauth.ts opens provider re-auth; **set_reauth_params** supplies nonce/code verifier; provider callback sends **oauth_info_pass**. handleOAuthInfoPassV2 intercepts active re-auth and resolves credentials instead of replacing wallet.
4. Sends **__export_reauth_received__** to target bitcodex_user_dashboard. **POST /tss/v2/export_shares** with first_login_jwt in body and fresh provider credential in Authorization. No commit-reveal for this route.
5. A/routes/tss_v2/index.ts -> userJwtFromBodyMiddleware -> oauthMiddleware -> tssActivateMiddleware -> export_shares.ts:exportShares. Validates both wallet curves and same user_id for OAuth identity versus JWT wallets; decrypts and returns secp256k1_share plus ed25519_seed_share (not Ed25519 signing share).
6. I/export_private_key.ts -> Cait-Sith cli_combine_shares for full secp256k1 scalar; hexToSeedSharePoint + seed_sss_combine([serverSeedPoint,userSeedPoint],2) for original Ed25519 seed. Formats seed[32] || publicKey[32] using bs58, which is Solana export formatting, not a Substrate keystore.
7. I/window_msgs/export_key_store.ts:setExportedKeys keeps result in module memory; **__export_private_key_ack__** carries success/error only. I/components/export/export_display.tsx renders within attached origin. No full exported key is sent back in the ack.
8. Portless **set_reauth_params** handler accepts attached origin or registered host; error/timeouts are explicit. Export identity matching is server-enforced, but this review did not prove freshness/replay properties of every provider credential.

#### Flow E — provider-specific entry paths

All successful providers converge at getCredentialsFromPayload -> handleOAuthInfoPassV2 -> A/B above. Main API oauthMiddleware dispatches by auth_type (defaults google); KSN bearerTokenMiddleware validates again before releasing fragments. There is no separate "email" AuthType: it is "auth0".

1. **Google:** C/methods/sign_in/google.ts:handleGoogleSignIn -> generate_oauth_url/ack -> I/window_msgs/generate_oauth_url.ts:buildGoogleOAuthUrl -> Google authorize -> /google/callback -> components/google_callback/use_callback.tsx:handleGoogleCallback -> oauth_info_pass/ack. I/token.ts validates JWT nonce/JWKS; A/middleware/auth/google_auth/index.ts:googleAuthMiddleware -> validate.ts:validateOAuthToken; K/auth/google/index.ts does its own Google validation. Public client IDs are duplicated across three sides.
2. **GitHub:** C/methods/sign_in/github.ts -> generate_oauth_url/ack -> buildGithubOAuthUrl (PKCE state/code challenge) -> https://github.com/login/oauth/authorize -> /github/callback -> I/routes/github/callback/index.tsx -> I/components/github_callback/use_callback.tsx:handleGithubCallback -> oauth_info_pass(code). I/validate_social_login.ts:validateOAuthPayloadOfGithub -> github.ts:getAccessTokenOfGithub -> **POST /social-login/v1/github/get-token** -> A/routes/social_login_v1/get_github_token.ts:getGithubToken -> GitHub token endpoint (backend client secret). I/github.ts:verifyIdTokenOfGithub -> **GET https://api.github.com/user**. A/github_auth/validate.ts:validateAccessTokenOfGithub -> api/github.ts:getGithubUserInfo; K/auth/github/index.ts verifies provider user independently.
3. **X:** C/methods/sign_in/x.ts -> generate_oauth_url/ack -> buildXOAuthUrl -> https://twitter.com/i/oauth2/authorize -> /x/callback -> I/routes/x/callback/index.tsx -> I/components/x_callback/use_callback.tsx:handleXCallback -> oauth_info_pass(code). I/validateOAuthPayloadOfX -> x.ts:getAccessTokenOfX -> **POST /social-login/v1/x/get-token** -> A/get_x_token.ts:getXToken -> **POST https://api.x.com/2/oauth2/token**. I/x.ts:verifyIdTokenOfX -> **GET /social-login/v1/x/verify-user** -> A/verify_x_user.ts:verifyXUser -> **GET https://api.x.com/2/users/me**. API and KSN validate access token/user on provider side. Backend social endpoints rate limit 10 requests/60s.
4. **Discord:** C/methods/sign_in/discord.ts -> generate_oauth_url/ack -> buildDiscordOAuthUrl -> https://discord.com/api/oauth2/authorize -> /discord/callback -> I/routes/discord/callback/index.tsx -> I/components/discord_callback/use_callback.tsx:handleDiscordCallback -> oauth_info_pass(code). I/validateOAuthPayloadOfDiscord -> discord.ts:getAccessTokenOfDiscordWithPKCE -> **POST https://discord.com/api/oauth2/token** directly from browser; verifyIdTokenOfDiscord -> **GET https://discord.com/api/users/@me**. API discordAuthMiddleware/validateDiscordOAuthToken and K/auth/discord/index.ts verify again. No BitcodeX Discord token-exchange route.
5. **Telegram:** C/methods/sign_in/telegram.ts:handleTelegramSignIn -> **open_modal** with auth/telegram_login; C/open_modal.ts opens /telegram and waits for **popup_ready**. I/routes/telegram/index.tsx and Telegram components/widget deliver Telegram data through I/routes/telegram/callback/index.tsx -> I/components/telegram_callback/use_callback.tsx:handleTelegramCallback and **oauth_info_pass**; validateOAuthPayloadOfTelegram creates JSON credential and telegram_<id> identity. A/telegram_auth/index.ts parses JSON and validateTelegramHash validates using bot token. K/auth/telegram/index.ts:validateTelegramToken accepts JSON hash flow or JWT branch (validate_jwt.ts); this JWT support is not symmetric with API's JSON-only handler. Modal completion uses **open_modal_ack** plus shared OAuth update/ack.
6. **Email OTP:** C/methods/sign_in/email.ts:handleEmailSignIn -> **open_modal** auth/email_login; C/open_modal.ts first sets **set_oauth_nonce**, waits **set_oauth_nonce_ack**, opens /email, waits **popup_ready**, then sends modal payload. I/routes/email/index.tsx -> components/email/use_email_login.ts:handleSubmitEmail -> lib/auth0/index.ts:sendEmailOTPCode -> auth0-js passwordlessStart(connection=email,send=code). handleVerifyCode -> verifyEmailOTPCode -> passwordlessLogin -> /email/callback. OTP length 6, resend cooldown 180s. These are Auth0 SDK calls; no local BitcodeX SMTP OTP route is invoked.
7. **Auth0 completion:** I/routes/email/callback/index.tsx (also legacy app/auth0/callback/page.tsx) -> components/email_callback/use_callback.tsx:handleEmailCallback -> parseAuth0Hash; sends OAuth payload with auth_type="auth0", then **open_modal_ack**. I/token.ts verifies Auth0 JWKS/issuer/audience/nonce; A/auth0_auth/validate.ts:validateAuth0IdToken and K/auth/auth0/index.ts validate against fixed configured domain/client. Mobile no-opener paths use redirect or BroadcastChannel fallback. Auth0 is the identity backend for email, not a seventh independent wallet identity family.

#### SVM/Bittensor implementation boundary

Mirror the **chain adapter**, not the cryptographic protocol:

- SDK: sdk/bitcodex_sdk_svm/src constructor/static init/emitter/lazy init; all methods; types/sign.ts; wallet-standard/{wallet,account,chains,features,register,sign-in,icon}.ts. Replace PublicKey/base58, Transaction/VersionedTransaction, Solana RPC, SIWS and Solana wallet-standard with explicit Substrate payload/signature/address interfaces.
- Shared core: types/modal/make_sig/svm.ts and make_sig/index.ts discriminated unions; generic modal/message routing; get_public_key_ed25519 is curve-generic and should remain reusable. No get_svm_chain_info counterpart exists in current dispatcher.
- React: sdk/bitcodex_sdk_react/src/svm/{context,use_bitcodex_svm,index}.ts plus provider/export/build wiring and example consumers.
- Iframe: modal switch/renderer and three svm variants (tx, all_tx, message), SIWS display, all tx-parsers/svm files, all web3/svm files, chain_infos alias map and supported-chain guards, token/amount/fee/explorer and shared chain icon switches.
- Dashboard/demo: Solana widgets, chain selection, asset/address derivation, balance/portfolio/history/send/explorer switches; SDK endpoint/API-key initialization. Filename-only searches miss many of these; the exhaustive lexical inventory below includes shared files.
- Build/package integration: root workspace list, TS aliases, SDK build/publish scripts, SDK React export maps, docs/examples/sandbox manifests, mobile host codecs.
- Preserve FROST keygen/signing as a separate decision from required Bittensor envelope encoding. SS58 prefix, SCALE bytes, long-payload hashing, MultiSignature prefix, signed extensions and runtime metadata still need independent chain probes. This session did not validate Bittensor runtime claims.
- Do not replace Solana program IDs with Bittensor constants in-place. Add a new ecosystem and keep existing adapters intact.

#### Hard-coded configuration and branding: replacement decisions

The generated location inventories below enumerate source occurrences without copying client IDs, analytics keys or secret-like values into this document. They include examples/tests/docs separately through their paths. A URL occurrence is not automatically an instruction to replace it.

| Area | Concrete source/config | Required action in later rebrand |
|---|---|---|
| OAuth IDs | I/config/oauth.ts; A/middleware/auth/google_auth/client_id.ts; K/auth/google/client_id.ts; A/api/github.ts and api/x.ts; mobile login client | Own registered apps; env-driven values consistent at iframe/API/KSN/mobile. Provider API domains stay provider-owned. |
| Auth0 | I/config/auth0.ts; API/KSN auth0 client_id.ts; mobile host login | Own tenant or implement a replacement identity service; Mailpit is not that replacement. |
| Telegram | I/config/telegram.ts env; API/KSN TELEGRAM_BOT_TOKEN; K/auth/telegram/client_id.ts JWT audience | Own bot, origins and any JWT audience. |
| Hosted endpoints | SDK defaults, iframe requests/endpoints.ts, chain_infos.ts, all app *.env.example, mobile build_iframe_src, docs links | Local API/attached/dashboard origins; explicit metadata/RPC service decisions. Keplr, Jupiter, tx-interpreter, fee sponsorship are additional dependencies. |
| S3 | backend env S3_BUCKET default bitcodex-wallet-customer, frontend public bucket bitcodex-wallet in ap-northeast-2; lib/aws/src/s3/index.ts AWS URL constructor | Separate upload bucket from frontend asset bucket; MinIO endpoint/addressing/public URL need validation or code change. |
| Email | backend SMTP/FROM_EMAIL; admin/user dashboard email templates; links/assets in email_template_2 | Local Mailpit port/auth settings and own sender/links; replace branded email markup/assets. |
| Analytics | I/analytics/amplitude.ts + VITE_AMPLITUDE_API_KEY example env | Leave empty to disable: initAmplitude returns early. Not a mandatory runtime dependency. |
| Shutdown | both user_dashboard and customer_dashboard service_shutdown_modal plus their mount sites; v1/v2 keygen routes; attached signup_disabled error | Rebrand is more than removing modal; re-enabling registration requires a separate reviewed source change. |
| Logos | ui common icons, public favicon/logo/apple-touch/manifest assets, wallet-standard embedded icon, apps/docs theme/social images, email templates | Replace product brand assets, not third-party chain/provider logos indiscriminately. Preserve attribution/licenses separately. |
| Storage/protocol branding | bitcodex-wallet-app-2, bitcodex_* postMessage targets, BroadcastChannel name, RN __bitcodex_t codec tags, package scope | Renaming persisted keys/message contracts requires coordinated migration/versioning. Not a safe global search/replace. |

#### External services by backend and optionality

| Executable/module | Required for core operation | Feature-dependent / optional |
|---|---|---|
| bitcodex_api/server | Postgres (migrations, users, wallets, sessions/nonces, commit-reveal, node config); reachable KSNs for registration/recovery; local encryption/JWT/node keys; identity-provider network for selected login | S3 customer logo upload; SMTP dashboard verification/invite/reminder flows; Elasticsearch logging only when URL/index/user/password set; Slack heartbeat alerts optional; Typeform webhook feature; GitHub secret for GitHub exchange; Telegram bot token for Telegram; Keplr/chain-dependent dashboard features |
| admin_api | Express subrouter in bitcodex_api, shared Postgres/state/auth, not an independent default server | SMTP invitations; S3 customer/logo management; Typeform integration |
| ct_dashboard_api | Express subrouter in bitcodex_api, shared Postgres/state | SMTP through dashboard flow support; S3 logo uploads; authenticated customer APIs |
| user_dashboard_api | Express subrouter in bitcodex_api, shared Postgres/state | SMTP verification/email features; no independent S3 or Elasticsearch daemon requirement established |
| TypeScript key_share_node/server (each instance) | Its own logical Postgres database; local encryption-secret file, admin/report credentials, signing keypair; API heartbeat/report endpoint; selected identity-provider verification | DB dump/restore uses local filesystem and pg tooling. No S3/SMTP/Elasticsearch service in its env schema. Telegram bot token string required by schema even if Telegram unused. |
| Rust key_share_node_2/server | Axum ECDHE prototype with /public-key, /exchange, /encrypted, PORT default 8081 | Does not wire the sibling Rust pg_interface crate into Cargo dependencies or expose TS /keyshare/v2 routes. Do not substitute for TS KSN. |
| crypto/tecdsa/server_example and cait_sith_cosmos_compat_express | Crypto demonstration/test harness modules; not production wallet services | Inspect sample startup separately if used; not needed for demo_web stack. |

Main API schema requires strings for SMTP_*, FROM_EMAIL, S3_*, TYPEFORM_WEBHOOK_SECRET, TELEGRAM_BOT_TOKEN, KS_NODE_REPORT_PASSWORD, GITHUB_CLIENT_SECRET, DAPP_DASHBOARD_URL, DB_*, JWT_* and ENCRYPTION_SECRET. “Schema requires a string” does not mean every external service must be contacted at startup. ES_* and SLACK_WEBHOOK_URL are optional. API launch starts DB migrations and node-health/heartbeat/customer-reminder runtimes. Do not seed real email addresses into a local reminder environment.

Self-hosted SMTP must accommodate nodemailer auth configuration: existing email helpers set auth user/pass and secure:false. Mailpit integration was not executed. MinIO was not executed; its addressing and returned asset URL remain unresolved.

#### Local command/error record and acceptance status

All commands ran from /Users/somesh.s.talligeri/Downloads/bitcodex-develop unless explicitly reading a path. Read-only searches/cat calls were used throughout; no git history/remote mutation was performed.

| Command / action actually attempted | Observed result |
|---|---|
| pwd | Correct workspace path. |
| git status --short | fatal: not a git repository (or any of the parent directories): .git |
| node --version | v24.10.0 |
| yarn --version | 1.22.22 (global command is not repository-pinned Yarn) |
| rustc --version; cargo --version (sandbox) | Rustup attempted pinned 1.93.1 sync; Operation not permitted creating ~/.rustup/tmp file. |
| wasm-pack --version | 0.15.0 |
| docker --version; docker compose version | Docker 29.8.0; Compose v5.5.1 |
| tmux -V | command not found: tmux |
| python3 --version | Python 3.14.6 |
| rustc --version; cargo --version; corepack yarn --version; docker ps (approved escalation) | Rustup auto-installed 1.93.1-aarch64-apple-darwin (7 components). rustc 1.93.1, cargo 1.93.1, Yarn 4.12.0. Docker socket ~/.colima/default/docker.sock absent; daemon not running. |
| corepack yarn install --immutable (approved escalation) | Resolution passed; YN0060 React 19 vs React 18 peer ranges; YN0002 missing peers (starknet, eslint, @types/react, router-core, jest, Hardhat tools, Babel/Expo/esbuild); YN0086 summary. Fetch then repeatedly failed YN0001 ENOSPC on zip writes/copies and temporary-directory creation. Interrupted via Ctrl-C, exit 130. No completed install or build. |
| colima start (approved escalation) | Attempted Ubuntu 24.04 arm64 Docker VM image download; fatal no space left on device writing Colima cache .downloading. Exit 1. Signed download query omitted from report. |
| df -h . | 228Gi volume, 195Gi used, 116Mi available, capacity 100% at check. |
| pgrep -fl 'yarn.*install' (sandbox) | sysmon request failed / Cannot get process list. Installer was subsequently interrupted via its running tool session. |
| cat internals/ci/ci-setup.sh internals/tmux/tmux-e2e-start.sh | Both documented hyphenated paths absent. Actual tmux file is internals/tmux/tmux_e2e_start.sh; setup is TS internals/ci/src/cmds/setup.ts. |
| First Python heredoc manifest inspection | zsh: can't create temp file for here document: operation not permitted. Retried read-only using python3 -c. |
| First Python manifest inspection | FileNotFoundError at crypto/teddsa/teddsa_interface_mock/package.json. Retried with existence checks; all four absent mock declarations recorded. |
| Discovery reads of guessed paths | cat/rg “No such file or directory” for lib/aws/src/s3.ts, lib/aws/src/s3/client.ts, I/store/app/index.ts, I/window_msgs/handler.ts, I/lib/auth0.ts, A/auth, A/api/user, A/git.ts. Correct paths found using rg --files (s3/index.ts, store/app.ts, window_msgs/index.ts, lib/auth0/index.ts, middleware/auth, api/tss/v2/user, git directory). |
| Initial zsh keygen glob | no matches found for A/api/tss/keygen* and child glob; corrected to A/api/tss/v2/keygen/index.ts. |

Repeated ENOSPC per-package errors were the same filesystem failure; tool output was truncated, so this is a record of all observed error classes, not a complete byte-for-byte terminal transcript. No credentials/shares were generated for login or printed intentionally. Public provider IDs encountered while reading source are not repeated here.

**Not run / not passed:** WASM/addon compilation; build_pkgs; build_sdk; typecheck; cargo check; database migration/seed; Postgres/MinIO/Mailpit container startup; API/KSN/iframe/demo launch; real OAuth login; devnet message signing. Missing space prevents install/Docker startup. Even with space restored, fresh signup is unconditionally disabled and wallet OTP relies on BitcodeX's Auth0 configuration. No mock-auth test was substituted for a real demo UI result.

**Documented continuation, not commands claimed executed:**
```sh
corepack yarn install --immutable
# Ensure child processes invoking "yarn" resolve Yarn 4, not global Yarn 1.
corepack yarn ci build_cs
corepack yarn ci build_frost
corepack yarn ci build_pkgs
corepack yarn ci build_sdk
corepack yarn ci typecheck
cargo check --workspace
corepack yarn workspace @bitcodex/key-share-node-server create_env
corepack yarn workspace @bitcodex/bitcodex-api-server create_env
corepack yarn workspace @bitcodex/bitcodex-attached create_env
corepack yarn workspace @bitcodex/demo-web create_env
# After isolated Postgres + environment + node settings are configured:
corepack yarn ci db_migrate_ksn
corepack yarn ci db_migrate_api
# Review dev seed and its API keys/node/activation settings before seeding.
# Start API, at least threshold KSNs, attached and demo in separate terminals:
corepack yarn workspace @bitcodex/key-share-node-server start
corepack yarn workspace @bitcodex/key-share-node-server start_2
corepack yarn workspace @bitcodex/bitcodex-api-server dev
corepack yarn workspace @bitcodex/bitcodex-attached dev
corepack yarn workspace @bitcodex/demo-web dev
```

Do not blindly run the above before resolving disk capacity, disabled signup, owned OAuth configuration and MinIO/Mailpit integration. Source setup.ts accepts skip_typecheck but does not invoke typecheck in its body; it does run DB migration commands. Build_cs/build_frost include native addons as well as WASM and copy outputs into attached public/pkg. Default dev seed nodes are localhost:4201/4202, SSS threshold 2, registration_threshold null (fallback all selected nodes). Three-node KSN migration scripts coexist with two-node API dev seed: verify configured node count.

#### Machine-derived inventories

The following sections are generated from this exact filesystem snapshot. Dependency arrows are **declared direct edges**, not proof of every runtime import; reverse edges include dev/peer/optional declarations. Registry-version dependencies with a local package name are identified as such rather than silently assumed workspace links. Transitive dependencies can be derived from these edges; yarn.lock is the third-party version resolution source. No lockfile was edited.

##### Yarn workspace graph
70 declarations; 69 unique paths; 65 existing manifests; 4 missing manifests.
Duplicate declarations: `crypto/teddsa/teddsa_interface`.

###### `internals/ci`
Name: `@bitcodex/ci`. Build/typecheck/migration/publish CLI orchestration.
Direct declared consumers: none in existing root-listed manifests.
dependencies: `chalk@^5.5.0`; `commander@^12.1.0`.
devDependencies: `@types/jest@^29.5.14`; `@types/node@^24.10.1`; `jest@^30.1.3`; `ts-jest@^29.4.5`; `tsx@^4.20.3`; `typescript@^5.8.3`.

###### `internals/github`
Name: `@bitcodex/github`. GitHub automation helpers.
Direct declared consumers: none in existing root-listed manifests.
dependencies: `chalk@^5.5.0`; `commander@^12.1.0`.
devDependencies: `@types/jest@^29.5.14`; `@types/node@^24.10.1`; `del-cli@^6.0.0`; `jest@^30.1.3`; `ts-jest@^29.4.5`; `tsx@^4.20.3`; `typescript@^5.8.3`.

###### `e2e_tests`
Name: `@bitcodex/e2e-tests`. Integration scenarios for registration/recovery/commit-reveal using test fixtures.
Direct declared consumers: none in existing root-listed manifests.
dependencies: `@bitcodex/bytes@workspace:*` → `crypto/bytes` [workspace protocol]; `@bitcodex/crypto-js@workspace:*` → `crypto/crypto_js` [workspace protocol]; `@bitcodex/ksn-interface@workspace:*` → `key_share_node/ksn_interface` [workspace protocol]; `@bitcodex/ksn-pg-interface@workspace:*` → `key_share_node/pg_interface` [workspace protocol]; `@bitcodex/bitcodex-pg-interface@workspace:*` → `backend/bitcodex_pg_interface` [workspace protocol]; `@bitcodex/bitcodex-types@workspace:*` → `common/bitcodex_types` [workspace protocol]; `@bitcodex/postgres-lib@workspace:*` → `lib/postgres_lib` [workspace protocol]; `@bitcodex/stdlib-js@workspace:*` → `lib/stdlib_js` [workspace protocol]; `@bitcodex/teddsa-addon@workspace:*` → `crypto/teddsa/teddsa_addon` [workspace protocol]; `express@^4.21.1`; `pg@^8.16.3`; `uuid@^13.0.0`; `winston@^3.17.0`.
devDependencies: `@bitcodex/key-share-node-server@workspace:*` → `key_share_node/server` [workspace protocol]; `@bitcodex/bitcodex-api-server@workspace:*` → `backend/bitcodex_api/server` [workspace protocol]; `@types/express@^5.0.6`; `@types/jest@^29.5.14`; `@types/node@^24.10.1`; `@types/pg@^8.15.6`; `@types/supertest@^6.0.3`; `@types/uuid@^10.0.0`; `dayjs@^1.11.18`; `jest@^30.1.3`; `supertest@^7.0.0`; `ts-jest@^29.4.5`; `typescript@^5.8.3`.

###### `key_share_node/pg_interface`
Name: `@bitcodex/ksn-pg-interface`. TypeScript KSN database models, migrations and backup/restore.
Direct declared consumers: `e2e_tests` (dependencies: `workspace:*`); `key_share_node/server` (dependencies: `workspace:*`).
dependencies: `@bitcodex/bytes@^0.1.2-alpha.1` → `crypto/bytes` [local-name; registry/range declaration]; `@bitcodex/ksn-interface@^0.1.2-alpha.1` → `key_share_node/ksn_interface` [local-name; registry/range declaration]; `@bitcodex/stdlib-js@^0.0.2-rc.44` → `lib/stdlib_js` [local-name; registry/range declaration]; `knex@^3.1.0`; `pg@^8.16.3`; `pgsql-parser@^17.7.8`; `uuid@^13.0.0`.
devDependencies: `@types/jest@^29.5.14`; `@types/node@^24.10.1`; `jest@^30.1.3`; `ts-jest@^29.4.5`; `tsx@^4.20.3`; `typescript@^5.8.3`.

###### `key_share_node/server`
Name: `@bitcodex/key-share-node-server`. Production Express KSN backup/recovery, auth, commit-reveal and telemetry.
Direct declared consumers: `e2e_tests` (devDependencies: `workspace:*`).
dependencies: `@asteasolutions/zod-to-openapi@^8.1.0`; `@bitcodex/bytes@^0.1.2-alpha.1` → `crypto/bytes` [local-name; registry/range declaration]; `@bitcodex/crypto-js@^0.1.2-alpha.1` → `crypto/crypto_js` [local-name; registry/range declaration]; `@bitcodex/ksn-interface@^0.1.2-alpha.1` → `key_share_node/ksn_interface` [local-name; registry/range declaration]; `@bitcodex/ksn-pg-interface@workspace:*` → `key_share_node/pg_interface` [workspace protocol]; `@bitcodex/stdlib-js@^0.0.2-rc.44` → `lib/stdlib_js` [local-name; registry/range declaration]; `chalk@^5.5.0`; `commander@^12.1.0`; `cors@^2.8.5`; `dayjs@^1.11.18`; `dotenv@^16.4.5`; `express@^4.21.1`; `express-rate-limit@8.2.1`; `helmet@^8.0.0`; `jsonwebtoken@^9.0.2`; `morgan@^1.10.0`; `pg@^8.16.3`; `swagger-ui-express@^5.0.1`; `tsx@^4.20.3`; `winston@^3.17.0`; `winston-daily-rotate-file@^5.0.0`; `zod@^4.1.12`.
devDependencies: `@types/cors@^2.8.17`; `@types/express@^5.0.6`; `@types/express-rate-limit@^6.0.2`; `@types/jest@^29.5.14`; `@types/jsonwebtoken@^9.0.7`; `@types/morgan@^1.9.9`; `@types/node@^24.10.1`; `@types/pg@^8.15.6`; `@types/supertest@^6.0.3`; `@types/swagger-jsdoc@^6.0.4`; `@types/swagger-ui-express@^4.1.8`; `jest@^30.1.3`; `supertest@^7.0.0`; `ts-jest@^29.4.5`; `typescript@^5.8.3`.

###### `key_share_node/ksn_interface`
Name: `@bitcodex/ksn-interface`. Shared KSN API and commit-reveal types.
Direct declared consumers: `e2e_tests` (dependencies: `workspace:*`); `key_share_node/pg_interface` (dependencies: `^0.1.2-alpha.1`); `key_share_node/server` (dependencies: `^0.1.2-alpha.1`); `backend/bitcodex_api/server` (dependencies: `workspace:*`); `embed/bitcodex_attached` (dependencies: `^0.1.2-alpha.1`).
dependencies: `@bitcodex/bytes@^0.1.2-alpha.12` → `crypto/bytes` [local-name; registry/range declaration]; `@bitcodex/bitcodex-types@^0.1.2-alpha.14` → `common/bitcodex_types` [local-name; registry/range declaration].
devDependencies: `@types/jest@^29.5.14`; `@types/node@^24.10.1`; `del-cli@^6.0.0`; `jest@^30.1.3`; `ts-jest@^29.4.5`; `tsc-alias@^1.8.16`; `tsx@^4.20.3`; `typescript@^5.8.3`.

###### `sdk/bitcodex_cosmos_kit`
Name: `@bitcodex/bitcodex-cosmos-kit`. Cosmos-kit adapter.
Direct declared consumers: `examples/cosmoskit_nextjs` (dependencies: `^0.0.1-rc.20`); `sandbox/sandbox_cosmos_kit` (dependencies: `^0.0.1-rc.21`).
dependencies: `@cosmos-kit/core@^2.16.7`; `@keplr-wallet/types@0.12.297`; `@bitcodex/bitcodex-sdk-core@^0.1.2-alpha.14` → `sdk/bitcodex_sdk_core` [local-name; registry/range declaration]; `@bitcodex/bitcodex-sdk-cosmos@^0.1.2-alpha.14` → `sdk/bitcodex_sdk_cosmos` [local-name; registry/range declaration].
devDependencies: `@rollup/plugin-commonjs@^25.0.0`; `@rollup/plugin-node-resolve@^15.0.0`; `@rollup/plugin-typescript@^11.0.0`; `del-cli@^6.0.0`; `rollup@^4.0.0`; `tsc-alias@^1.8.16`; `tsx@^4.20.3`; `typescript@^5.8.3`.
peerDependencies: `@cosmjs/amino@>= 0.28`; `@cosmjs/proto-signing@>= 0.28`.

###### `sdk/bitcodex_interchain_kit`
Name: `@bitcodex/bitcodex-interchain-kit`. Interchain-kit adapter.
Direct declared consumers: `examples/interchainkit_nextjs` (dependencies: `^0.1.2-alpha.1`); `sandbox/sandbox_interchain_kit` (dependencies: `workspace:*`).
dependencies: `@interchain-kit/core@^0.10.0`; `@keplr-wallet/types@0.12.297`; `@bitcodex/bitcodex-sdk-core@^0.1.2-alpha.14` → `sdk/bitcodex_sdk_core` [local-name; registry/range declaration]; `@bitcodex/bitcodex-sdk-cosmos@^0.1.2-alpha.14` → `sdk/bitcodex_sdk_cosmos` [local-name; registry/range declaration].
devDependencies: `@rollup/plugin-commonjs@^25.0.0`; `@rollup/plugin-node-resolve@^15.0.0`; `@rollup/plugin-typescript@^11.0.0`; `del-cli@^6.0.0`; `rollup@^4.0.0`; `tsc-alias@^1.8.16`; `typescript@^5.8.3`.

###### `sdk/bitcodex_sdk_core`
Name: `@bitcodex/bitcodex-sdk-core`. Browser auth, iframe messaging, modal and public-wallet interfaces.
Direct declared consumers: `sdk/bitcodex_cosmos_kit` (dependencies: `^0.1.2-alpha.14`); `sdk/bitcodex_interchain_kit` (dependencies: `^0.1.2-alpha.14`); `sdk/bitcodex_sdk_core_react_native` (dependencies: `^0.1.2-alpha.14`); `sdk/bitcodex_sdk_cosmos` (dependencies: `^0.1.2-alpha.14`); `sdk/bitcodex_sdk_eth` (dependencies: `^0.1.2-alpha.14`); `sdk/bitcodex_sdk_react` (dependencies: `^0.1.2-alpha.14`); `sdk/bitcodex_sdk_svm` (dependencies: `^0.1.2-alpha.14`); `examples/interchainkit_nextjs` (dependencies: `^0.1.2-alpha.1`); `sandbox/sandbox_simple_host` (dependencies: `^0.1.2-alpha.1`); `sandbox/sandbox_evm` (dependencies: `^0.1.2-alpha.1`); `sandbox/sandbox_interchain_kit` (dependencies: `^0.1.2-alpha.1`); `sandbox/sandbox_react_native` (dependencies: `workspace:*`); `embed/bitcodex_attached` (dependencies: `^0.1.2-alpha.12`); `apps/demo_web` (devDependencies: `workspace:*`).
dependencies: `@keplr-wallet/types@0.12.297`; `@bitcodex/bytes@^0.1.2-alpha.12` → `crypto/bytes` [local-name; registry/range declaration]; `@bitcodex/bitcodex-types@^0.1.2-alpha.14` → `common/bitcodex_types` [local-name; registry/range declaration]; `@bitcodex/stdlib-js@^0.1.2-alpha.12` → `lib/stdlib_js` [local-name; registry/range declaration].
devDependencies: `@rollup/plugin-commonjs@^25.0.0`; `@rollup/plugin-json@^6.1.0`; `@rollup/plugin-node-resolve@^15.0.0`; `@rollup/plugin-replace@^6.0.2`; `@rollup/plugin-terser@^0.4.4`; `@rollup/plugin-typescript@^11.0.0`; `@types/jest@^29.5.14`; `@types/node@^24.10.1`; `chalk@^5.5.0`; `del@^8.0.1`; `jest@^30.1.3`; `rollup@^4.0.0`; `rollup-plugin-dts@^6.2.1`; `rollup-plugin-tsconfig-paths@^1.5.2`; `ts-jest@^29.4.5`; `tsc-alias@^1.8.16`; `tsx@^4.20.3`; `typescript@^5.8.3`.

###### `sdk/bitcodex_sdk_core_react_native`
Name: `@bitcodex/bitcodex-sdk-core-react-native`. React Native/browser-host bridge and codecs.
Direct declared consumers: `sandbox/sandbox_react_native` (dependencies: `workspace:*`).
dependencies: `@bitcodex/bitcodex-sdk-core@^0.1.2-alpha.14` → `sdk/bitcodex_sdk_core` [local-name; registry/range declaration]; `@bitcodex/bitcodex-types@^0.1.2-alpha.14` → `common/bitcodex_types` [local-name; registry/range declaration]; `@bitcodex/stdlib-js@^0.1.2-alpha.12` → `lib/stdlib_js` [local-name; registry/range declaration]; `buffer@^6.0.3`; `pako@^2.1.0`.
devDependencies: `@expo/config-plugins@^55.0.6`; `@types/react@~19.1.0`; `tsx@^4.20.3`; `typescript@^5.8.3`.
peerDependencies: `@react-native-async-storage/async-storage@>=1.17`; `expo-web-browser@>=14`; `react@>=18`; `react-native@>=0.70`; `react-native-get-random-values@>=1`; `react-native-inappbrowser-reborn@>=3`.

###### `sdk/bitcodex_sdk_cosmos`
Name: `@bitcodex/bitcodex-sdk-cosmos`. Keplr-compatible Cosmos signing adapter.
Direct declared consumers: `sdk/bitcodex_cosmos_kit` (dependencies: `^0.1.2-alpha.14`); `sdk/bitcodex_interchain_kit` (dependencies: `^0.1.2-alpha.14`); `sdk/bitcodex_sdk_react` (dependencies: `^0.1.2-alpha.14`); `examples/interchainkit_nextjs` (dependencies: `^0.1.2-alpha.1`); `examples/cosmos_nextjs` (dependencies: `^0.1.2-alpha.1`); `examples/multi_ecosystem_react` (dependencies: `^0.1.2-alpha.1`); `sandbox/sandbox_simple_host` (dependencies: `^0.1.2-alpha.1`); `sandbox/sandbox_interchain_kit` (dependencies: `^0.1.2-alpha.1`); `sandbox/sandbox_react_native` (dependencies: `workspace:*`); `embed/bitcodex_attached` (dependencies: `^0.1.2-alpha.1`); `apps/demo_web` (devDependencies: `workspace:*`); `apps/user_dashboard` (dependencies: `^0.1.2-alpha.1`).
dependencies: `@cosmjs/amino@0.36.1`; `@cosmjs/proto-signing@0.36.1`; `@keplr-wallet/proto-types@^0.12.253`; `@keplr-wallet/types@0.12.297`; `@noble/curves@1.9.7`; `@noble/hashes@^1.8.0`; `@bitcodex/bitcodex-sdk-core@^0.1.2-alpha.14` → `sdk/bitcodex_sdk_core` [local-name; registry/range declaration]; `@bitcodex/stdlib-js@^0.1.2-alpha.12` → `lib/stdlib_js` [local-name; registry/range declaration]; `bech32@^2.0.0`; `buffer@^6.0.3`; `uuid@^13.0.0`.
devDependencies: `@rollup/plugin-commonjs@^25.0.0`; `@rollup/plugin-json@^6.1.0`; `@rollup/plugin-node-resolve@^15.0.0`; `@rollup/plugin-terser@^0.4.4`; `@rollup/plugin-typescript@^11.0.0`; `@types/jest@^29.5.14`; `@types/node@^24.10.1`; `chalk@^5.5.0`; `del@^8.0.1`; `del-cli@^6.0.0`; `jest@^30.1.3`; `rollup@^4.0.0`; `ts-jest@^29.4.5`; `tsc-alias@^1.8.16`; `tsx@^4.20.3`; `typescript@^5.8.3`.

###### `sdk/bitcodex_sdk_eth`
Name: `@bitcodex/bitcodex-sdk-eth`. EVM/viem provider and signing adapter.
Direct declared consumers: `sdk/bitcodex_sdk_react` (dependencies: `^0.1.2-alpha.14`); `examples/evm_nextjs` (dependencies: `^0.1.2-alpha.1`); `examples/evm_wagmi_nextjs` (dependencies: `^0.1.2-alpha.1`); `examples/multi_ecosystem_react` (dependencies: `^0.1.2-alpha.1`); `sandbox/sandbox_simple_host` (dependencies: `^0.1.2-alpha.1`); `sandbox/sandbox_evm` (dependencies: `^0.1.2-alpha.1`); `sandbox/sandbox_react_native` (dependencies: `workspace:*`); `embed/bitcodex_attached` (dependencies: `^0.1.2-alpha.1`); `apps/demo_web` (devDependencies: `workspace:*`); `apps/user_dashboard` (dependencies: `^0.1.2-alpha.1`).
dependencies: `@bitcodex/bitcodex-sdk-core@^0.1.2-alpha.14` → `sdk/bitcodex_sdk_core` [local-name; registry/range declaration]; `@bitcodex/stdlib-js@^0.1.2-alpha.12` → `lib/stdlib_js` [local-name; registry/range declaration]; `eventemitter3@^5.0.1`; `uuid@^13.0.0`; `viem@^2.41.2`.
devDependencies: `@rollup/plugin-commonjs@^25.0.0`; `@rollup/plugin-json@^6.1.0`; `@rollup/plugin-node-resolve@^15.0.0`; `@rollup/plugin-replace@^6.0.2`; `@rollup/plugin-terser@^0.4.4`; `@rollup/plugin-typescript@^11.0.0`; `@types/jest@^29.5.14`; `@types/node@^24.10.1`; `del-cli@^6.0.0`; `ethers@^6.14.4`; `hardhat@^2.25.0`; `jest@^30.1.3`; `rollup@^4.0.0`; `ts-jest@^29.4.5`; `tsc-alias@^1.8.16`; `tsx@^4.20.3`; `typescript@^5.8.3`.

###### `sdk/bitcodex_sdk_react`
Name: `@bitcodex/bitcodex-sdk-react`. React contexts/hooks across ecosystems.
Direct declared consumers: `examples/cosmos_nextjs` (dependencies: `workspace:*`); `examples/evm_nextjs` (dependencies: `workspace:*`); `examples/multi_ecosystem_react` (dependencies: `workspace:*`); `examples/svm_nextjs` (dependencies: `workspace:*`); `apps/demo_web` (devDependencies: `workspace:*`); `apps/user_dashboard` (dependencies: `workspace:*`).
dependencies: `@bitcodex/bitcodex-sdk-core@^0.1.2-alpha.14` → `sdk/bitcodex_sdk_core` [local-name; registry/range declaration]; `@bitcodex/bitcodex-sdk-cosmos@^0.1.2-alpha.14` → `sdk/bitcodex_sdk_cosmos` [local-name; registry/range declaration]; `@bitcodex/bitcodex-sdk-eth@^0.1.2-alpha.14` → `sdk/bitcodex_sdk_eth` [local-name; registry/range declaration]; `@bitcodex/bitcodex-sdk-svm@^0.1.2-alpha.14` → `sdk/bitcodex_sdk_svm` [local-name; registry/range declaration]; `@bitcodex/bitcodex-types@^0.1.2-alpha.14` → `common/bitcodex_types` [local-name; registry/range declaration]; `@bitcodex/stdlib-js@^0.1.2-alpha.12` → `lib/stdlib_js` [local-name; registry/range declaration].
devDependencies: `@rollup/plugin-commonjs@^25.0.0`; `@rollup/plugin-json@^6.1.0`; `@rollup/plugin-node-resolve@^15.0.0`; `@rollup/plugin-typescript@^11.0.0`; `@types/react@~19.1.0`; `del-cli@^6.0.0`; `rollup@^4.0.0`; `tsc-alias@^1.8.16`; `tsx@^4.20.3`; `typescript@^5.8.3`.
peerDependencies: `react@^18.0.0 \|\| ^19.0.0`.

###### `sdk/bitcodex_sdk_svm`
Name: `@bitcodex/bitcodex-sdk-svm`. Solana transaction/message and wallet-standard adapter.
Direct declared consumers: `sdk/bitcodex_sdk_react` (dependencies: `^0.1.2-alpha.14`); `examples/multi_ecosystem_react` (dependencies: `^0.1.2-alpha.1`); `examples/svm_nextjs` (dependencies: `^0.1.2-alpha.1`); `sandbox/sandbox_react_native` (dependencies: `workspace:*`); `apps/demo_web` (devDependencies: `workspace:*`); `apps/user_dashboard` (dependencies: `workspace:*`); `sandbox/sandbox_rialo` (dependencies: `workspace:*`); `sandbox/sandbox_sol` (dependencies: `workspace:*`).
dependencies: `@bitcodex/bitcodex-sdk-core@^0.1.2-alpha.14` → `sdk/bitcodex_sdk_core` [local-name; registry/range declaration]; `@bitcodex/stdlib-js@^0.0.2-rc.42` → `lib/stdlib_js` [local-name; registry/range declaration]; `@solana/wallet-standard-features@^1.3.0`; `@solana/web3.js@^1.98.0`; `@wallet-standard/base@^1.1.0`; `@wallet-standard/features@^1.1.0`; `@wallet-standard/wallet@^1.1.0`; `bs58@^6.0.0`; `eventemitter3@^5.0.1`; `uuid@^9.0.0`.
devDependencies: `@rollup/plugin-commonjs@^25.0.0`; `@rollup/plugin-node-resolve@^15.0.0`; `@rollup/plugin-typescript@^11.0.0`; `@types/jest@^29.5.14`; `@types/node@^24.10.1`; `@types/uuid@^10.0.0`; `del-cli@^6.0.0`; `jest@^30.1.3`; `rollup@^4.0.0`; `rollup-plugin-dts@^6.2.1`; `rollup-plugin-tsconfig-paths@^1.5.2`; `ts-jest@^29.4.5`; `tsc-alias@^1.8.16`; `typescript@^5.8.3`.

###### `examples/interchainkit_nextjs`
Name: `@bitcodex/interchainkit-nextjs`. Integration example: interchainkit nextjs.
Direct declared consumers: none in existing root-listed manifests.
dependencies: `@chain-registry/v2@^1.71.237`; `@cosmjs/amino@0.36.1`; `@cosmjs/encoding@0.36.1`; `@cosmjs/proto-signing@0.36.1`; `@cosmjs/stargate@0.36.1`; `@hookform/resolvers@5.2.2`; `@interchain-kit/core@^0.10.0`; `@interchain-kit/keplr-extension@^0.10.0`; `@interchain-kit/react@^0.10.0`; `@keplr-wallet/types@0.12.297`; `@keplr-wallet/unit@0.12.297`; `@bitcodex/bitcodex-interchain-kit@^0.1.2-alpha.1` → `sdk/bitcodex_interchain_kit` [local-name; registry/range declaration]; `@bitcodex/bitcodex-sdk-core@^0.1.2-alpha.1` → `sdk/bitcodex_sdk_core` [local-name; registry/range declaration]; `@bitcodex/bitcodex-sdk-cosmos@^0.1.2-alpha.1` → `sdk/bitcodex_sdk_cosmos` [local-name; registry/range declaration]; `@tanstack/react-query@^5.90.12`; `chain-registry@^1.69.410`; `next@^16.0.7`; `react@^19.2.1`; `react-dom@^19.2.1`; `react-hook-form@7.65.0`; `zod@^4.1.12`.
devDependencies: `@tailwindcss/postcss@^4`; `@types/node@^24.10.1`; `@types/react@^19.2.7`; `@types/react-dom@^19.2.3`; `tailwindcss@^4.1.3`; `typescript@^5.8.3`.

###### `examples/cosmos_nextjs`
Name: `@bitcodex-examples/cosmos-nextjs`. Integration example: cosmos nextjs.
Direct declared consumers: none in existing root-listed manifests.
dependencies: `@cosmjs/encoding@0.36.1`; `@cosmjs/proto-signing@0.36.1`; `@cosmjs/stargate@0.36.1`; `@hookform/resolvers@5.2.2`; `@keplr-wallet/types@0.12.297`; `@keplr-wallet/unit@0.12.297`; `@bitcodex/bitcodex-sdk-cosmos@^0.1.2-alpha.1` → `sdk/bitcodex_sdk_cosmos` [local-name; registry/range declaration]; `@bitcodex/bitcodex-sdk-react@workspace:*` → `sdk/bitcodex_sdk_react` [workspace protocol]; `next@^16.1.1`; `react@^19.2.1`; `react-dom@^19.2.1`; `react-hook-form@7.65.0`; `zod@4.1.12`.
devDependencies: `@eslint/eslintrc@3.1.0`; `@tailwindcss/postcss@^4`; `@types/node@^24.10.1`; `@types/react@19.0.2`; `@types/react-dom@19.0.2`; `eslint@9.36.0`; `eslint-config-next@^16.0.7`; `tailwindcss@^4.1.3`; `typescript@^5.8.3`.

###### `examples/cosmoskit_nextjs`
Name: `@bitcodex-examples/cosmos-kit-nextjs`. Integration example: cosmoskit nextjs.
Direct declared consumers: none in existing root-listed manifests.
dependencies: `@cosmjs/amino@0.36.1`; `@cosmjs/encoding@0.36.1`; `@cosmjs/proto-signing@0.36.1`; `@cosmjs/stargate@0.36.1`; `@cosmos-kit/react@^2.22.7`; `@hookform/resolvers@5.2.2`; `@interchain-ui/react@^1.26.3`; `@keplr-wallet/types@0.12.297`; `@keplr-wallet/unit@0.12.297`; `@bitcodex/bitcodex-cosmos-kit@^0.0.1-rc.20` → `sdk/bitcodex_cosmos_kit` [local-name; registry/range declaration]; `@tanstack/react-query@^5.90.12`; `chain-registry@^1.69.410`; `next@^16.1.1`; `react@^19.2.1`; `react-dom@^19.2.1`; `react-hook-form@7.65.0`; `zod@4.1.12`.
devDependencies: `@eslint/eslintrc@3.1.0`; `@tailwindcss/postcss@^4`; `@types/node@^24.10.1`; `@types/react@19.0.2`; `@types/react-dom@19.0.2`; `eslint@9.36.0`; `eslint-config-next@^16.0.7`; `tailwindcss@^4.1.3`; `typescript@^5.8.3`.

###### `examples/evm_nextjs`
Name: `@bitcodex-examples/evm-nextjs`. Integration example: evm nextjs.
Direct declared consumers: none in existing root-listed manifests.
dependencies: `@hookform/resolvers@5.2.2`; `@bitcodex/bitcodex-sdk-eth@^0.1.2-alpha.1` → `sdk/bitcodex_sdk_eth` [local-name; registry/range declaration]; `@bitcodex/bitcodex-sdk-react@workspace:*` → `sdk/bitcodex_sdk_react` [workspace protocol]; `@tanstack/react-query@^5.90.12`; `next@^16.1.1`; `react@^19.2.1`; `react-dom@^19.2.1`; `react-hook-form@7.65.0`; `viem@^2.41.2`; `zod@4.1.12`.
devDependencies: `@eslint/eslintrc@3.1.0`; `@tailwindcss/postcss@^4`; `@types/node@^24.10.1`; `@types/react@19.0.2`; `@types/react-dom@19.0.2`; `eslint@9.36.0`; `eslint-config-next@^16.0.7`; `tailwindcss@^4.1.3`; `typescript@^5.8.3`.

###### `examples/evm_wagmi_nextjs`
Name: `@bitcodex-examples/evm-wagmi-nextjs`. Integration example: evm wagmi nextjs.
Direct declared consumers: none in existing root-listed manifests.
dependencies: `@hookform/resolvers@5.2.2`; `@bitcodex/bitcodex-sdk-eth@^0.1.2-alpha.1` → `sdk/bitcodex_sdk_eth` [local-name; registry/range declaration]; `@rainbow-me/rainbowkit@2.2.8`; `@tanstack/react-query@^5.90.12`; `next@^16.1.1`; `react@^19.2.1`; `react-dom@^19.2.1`; `react-hook-form@7.65.0`; `viem@^2.41.2`; `wagmi@2.18.0`; `zod@4.1.12`.
devDependencies: `@eslint/eslintrc@3.1.0`; `@tailwindcss/postcss@^4`; `@types/node@^24.10.1`; `@types/react@19.0.2`; `@types/react-dom@19.0.2`; `eslint@9.36.0`; `eslint-config-next@^16.0.7`; `tailwindcss@^4.1.3`; `typescript@^5.8.3`.

###### `examples/multi_ecosystem_react`
Name: `@bitcodex-examples/multi-ecosystem-react`. Integration example: multi ecosystem react.
Direct declared consumers: none in existing root-listed manifests.
dependencies: `@cosmjs/encoding@0.34.0`; `@cosmjs/stargate@0.34.0`; `@hookform/resolvers@5.2.2`; `@keplr-wallet/types@0.12.297`; `@keplr-wallet/unit@0.12.297`; `@bitcodex/bitcodex-sdk-cosmos@^0.1.2-alpha.1` → `sdk/bitcodex_sdk_cosmos` [local-name; registry/range declaration]; `@bitcodex/bitcodex-sdk-eth@^0.1.2-alpha.1` → `sdk/bitcodex_sdk_eth` [local-name; registry/range declaration]; `@bitcodex/bitcodex-sdk-react@workspace:*` → `sdk/bitcodex_sdk_react` [workspace protocol]; `@bitcodex/bitcodex-sdk-svm@^0.1.2-alpha.1` → `sdk/bitcodex_sdk_svm` [local-name; registry/range declaration]; `@solana/web3.js@^1.98.0`; `@tanstack/react-query@^5.90.12`; `buffer@^6.0.3`; `react@^19.2.1`; `react-dom@^19.2.1`; `react-hook-form@^7.65.0`; `viem@^2.41.2`; `zod@4.1.12`.
devDependencies: `@eslint/js@9.36.0`; `@tailwindcss/postcss@^4`; `@types/node@^24.10.1`; `@types/react@19.0.2`; `@types/react-dom@19.0.2`; `@vitejs/plugin-react@^4.3.4`; `eslint@9.36.0`; `eslint-plugin-react-hooks@^5.2.0`; `eslint-plugin-react-refresh@^0.4.22`; `globals@^16.4.0`; `tailwindcss@^4.1.3`; `typescript@^5.8.3`; `typescript-eslint@^8.45.0`; `vite@^7.1.6`.

###### `examples/svm_nextjs`
Name: `@bitcodex-examples/svm-nextjs`. Integration example: svm nextjs.
Direct declared consumers: none in existing root-listed manifests.
dependencies: `@hookform/resolvers@5.2.2`; `@bitcodex/bitcodex-sdk-react@workspace:*` → `sdk/bitcodex_sdk_react` [workspace protocol]; `@bitcodex/bitcodex-sdk-svm@^0.1.2-alpha.1` → `sdk/bitcodex_sdk_svm` [local-name; registry/range declaration]; `@solana/web3.js@^1.98.0`; `@tanstack/react-query@^5.90.12`; `next@^16.1.1`; `react@^19.2.1`; `react-dom@^19.2.1`; `react-hook-form@7.65.0`; `zod@4.1.12`.
devDependencies: `@eslint/eslintrc@3.1.0`; `@tailwindcss/postcss@^4`; `@types/node@^24.10.1`; `@types/react@19.0.2`; `@types/react-dom@19.0.2`; `eslint@9.36.0`; `eslint-config-next@^16.0.7`; `tailwindcss@^4.1.3`; `typescript@^5.8.3`.

###### `sandbox/sandbox_simple_host`
Name: `sandbox_simple_host`. Development playground: sandbox simple host.
Direct declared consumers: none in existing root-listed manifests.
dependencies: `@cosmjs/stargate@^0.34.0`; `@bitcodex/bitcodex-sdk-core@^0.1.2-alpha.1` → `sdk/bitcodex_sdk_core` [local-name; registry/range declaration]; `@bitcodex/bitcodex-sdk-cosmos@^0.1.2-alpha.1` → `sdk/bitcodex_sdk_cosmos` [local-name; registry/range declaration]; `@bitcodex/bitcodex-sdk-eth@^0.1.2-alpha.1` → `sdk/bitcodex_sdk_eth` [local-name; registry/range declaration]; `@tanstack/react-query@^5.90.12`; `classnames@^2.5.1`; `long@^5.3.2`; `next@^16.1.1`; `react@^19.2.1`; `react-dom@^19.2.1`; `react-router@^7.8.0`; `zod@^4.1.12`; `zustand@^5.0.6`.
devDependencies: `@esbuild-plugins/node-globals-polyfill@^0.2.3`; `@react-router/dev@^7.4.0`; `@types/node@^24.10.1`; `@types/react@^19.2.7`; `@types/react-dom@^19.2.3`; `@vitejs/plugin-react@^5.0.3`; `react-router-devtools@^1.1.0`; `sass@^1.94.2`; `tsx@^4.20.3`; `typescript@^5.8.3`; `vite@^7.1.6`; `vite-plugin-node-polyfills@^0.24.0`; `vite-tsconfig-paths@^5.1.4`.

###### `sandbox/sandbox_evm`
Name: `sandbox-evm`. Development playground: sandbox evm.
Direct declared consumers: none in existing root-listed manifests.
dependencies: `@heroicons/react@~2.1.5`; `@keplr-wallet/proto-types@^0.12.250`; `@bitcodex/bitcodex-sdk-core@^0.1.2-alpha.1` → `sdk/bitcodex_sdk_core` [local-name; registry/range declaration]; `@bitcodex/bitcodex-sdk-eth@^0.1.2-alpha.1` → `sdk/bitcodex_sdk_eth` [local-name; registry/range declaration]; `@rainbow-me/rainbowkit@2.2.7`; `@tanstack/react-query@^5.90.12`; `@uniswap/sdk-core@~5.8.2`; `@uniswap/v2-sdk@~4.6.1`; `blo@~1.2.0`; `next@^16.1.1`; `pino-pretty@^13.1.1`; `react@^19.2.1`; `react-dom@^19.2.1`; `react-hot-toast@~2.4.0`; `usehooks-ts@~3.1.0`; `viem@^2.41.2`; `wagmi@2.15.6`; `zustand@^5.0.6`.
devDependencies: `@nomicfoundation/hardhat-ethers@^3.0.9`; `@nomicfoundation/hardhat-ignition@^0.15.12`; `@nomicfoundation/hardhat-ignition-ethers@^0.15.13`; `@nomicfoundation/hardhat-toolbox@^6.0.0`; `@nomicfoundation/hardhat-verify@^2.0.14`; `@nomicfoundation/ignition-core@^0.15.12`; `@tailwindcss/postcss@4.0.15`; `@types/node@^24.10.1`; `@types/react@^19.2.7`; `@types/react-dom@^19.2.3`; `abitype@1.0.6`; `hardhat@^2.25.0`; `postcss@~8.4.45`; `tailwindcss@^4.1.3`; `tsx@^4.20.3`; `type-fest@~4.26.1`; `typescript@^5.8.3`.

###### `sandbox/sandbox_cosmos_kit`
Name: `@bitcodex/sandbox-cosmos-kit`. Development playground: sandbox cosmos kit.
Direct declared consumers: none in existing root-listed manifests.
dependencies: `@cosmjs/amino@0.36.1`; `@cosmjs/encoding@0.36.1`; `@cosmjs/proto-signing@0.36.1`; `@cosmjs/stargate@0.36.1`; `@cosmos-kit/react@^2.22.7`; `@hookform/resolvers@5.2.2`; `@interchain-ui/react@^1.26.3`; `@keplr-wallet/types@0.12.297`; `@keplr-wallet/unit@0.12.297`; `@bitcodex/bitcodex-cosmos-kit@^0.0.1-rc.21` → `sdk/bitcodex_cosmos_kit` [local-name; registry/range declaration]; `@tanstack/react-query@^5.90.12`; `chain-registry@^1.69.410`; `next@^16.1.1`; `react@^19.2.1`; `react-dom@^19.2.1`; `react-hook-form@7.65.0`; `zod@^4.1.12`.
devDependencies: `@tailwindcss/postcss@^4`; `@types/node@^24.10.1`; `@types/react@^19.2.7`; `@types/react-dom@^19.2.3`; `tailwindcss@^4.1.3`; `typescript@^5.8.3`.

###### `sandbox/sandbox_interchain_kit`
Name: `@bitcodex/sandbox-interchain-kit`. Development playground: sandbox interchain kit.
Direct declared consumers: none in existing root-listed manifests.
dependencies: `@chain-registry/v2@^1.71.237`; `@cosmjs/amino@0.36.1`; `@cosmjs/encoding@0.36.1`; `@cosmjs/proto-signing@0.36.1`; `@cosmjs/stargate@0.36.1`; `@hookform/resolvers@5.2.2`; `@interchain-kit/core@^0.10.0`; `@interchain-kit/keplr-extension@^0.10.0`; `@interchain-kit/react@^0.10.0`; `@keplr-wallet/types@0.12.297`; `@keplr-wallet/unit@0.12.297`; `@bitcodex/bitcodex-interchain-kit@workspace:*` → `sdk/bitcodex_interchain_kit` [workspace protocol]; `@bitcodex/bitcodex-sdk-core@^0.1.2-alpha.1` → `sdk/bitcodex_sdk_core` [local-name; registry/range declaration]; `@bitcodex/bitcodex-sdk-cosmos@^0.1.2-alpha.1` → `sdk/bitcodex_sdk_cosmos` [local-name; registry/range declaration]; `@tanstack/react-query@^5.90.12`; `chain-registry@^1.69.410`; `next@^16.1.1`; `react@^19.2.1`; `react-dom@^19.2.1`; `react-hook-form@7.65.0`; `zod@^4.1.12`.
devDependencies: `@tailwindcss/postcss@^4`; `@types/node@^24.10.1`; `@types/react@^19.2.7`; `@types/react-dom@^19.2.3`; `tailwindcss@^4.1.3`; `typescript@^5.8.3`.

###### `sandbox/sandbox_react_native`
Name: `sandbox_react_native`. Development playground: sandbox react native.
Direct declared consumers: none in existing root-listed manifests.
dependencies: `@cosmjs/proto-signing@0.36.1`; `@expo/vector-icons@^15.1.1`; `@keplr-wallet/proto-types@^0.12.253`; `@bitcodex/bitcodex-sdk-core@workspace:*` → `sdk/bitcodex_sdk_core` [workspace protocol]; `@bitcodex/bitcodex-sdk-core-react-native@workspace:*` → `sdk/bitcodex_sdk_core_react_native` [workspace protocol]; `@bitcodex/bitcodex-sdk-cosmos@workspace:*` → `sdk/bitcodex_sdk_cosmos` [workspace protocol]; `@bitcodex/bitcodex-sdk-eth@workspace:*` → `sdk/bitcodex_sdk_eth` [workspace protocol]; `@bitcodex/bitcodex-sdk-svm@workspace:*` → `sdk/bitcodex_sdk_svm` [workspace protocol]; `@react-native-async-storage/async-storage@^2.1.2`; `@react-navigation/bottom-tabs@^7.10.1`; `@react-navigation/elements@^2.9.10`; `@react-navigation/native@^7.1.28`; `@solana/web3.js@^1.98.0`; `buffer@^6.0.3`; `expo@~55.0.6`; `expo-constants@~55.0.7`; `expo-font@~55.0.4`; `expo-haptics@~55.0.8`; `expo-image@~55.0.6`; `expo-linking@~55.0.7`; `expo-router@~55.0.5`; `expo-splash-screen@~55.0.10`; `expo-status-bar@~55.0.4`; `expo-symbols@~55.0.5`; `expo-system-ui@~55.0.9`; `expo-web-browser@~55.0.9`; `react@^19.2.1`; `react-dom@^19.2.1`; `react-native@0.83.2`; `react-native-gesture-handler@~2.30.0`; `react-native-get-random-values@~1.11.0`; `react-native-reanimated@4.2.1`; `react-native-safe-area-context@~5.6.2`; `react-native-screens@~4.23.0`; `react-native-web@~0.21.2`; `react-native-worklets@0.7.2`; `viem@^2.41.2`.
devDependencies: `@types/react@~19.2.10`; `eslint@^9.25.0`; `eslint-config-expo@~55.0.0`; `typescript@~5.9.2`.

###### `crypto/bytes`
Name: `@bitcodex/bytes`. Typed byte/hex utilities.
Direct declared consumers: `e2e_tests` (dependencies: `workspace:*`); `key_share_node/pg_interface` (dependencies: `^0.1.2-alpha.1`); `key_share_node/server` (dependencies: `^0.1.2-alpha.1`); `key_share_node/ksn_interface` (dependencies: `^0.1.2-alpha.12`); `sdk/bitcodex_sdk_core` (dependencies: `^0.1.2-alpha.12`); `crypto/crypto_js` (dependencies: `^0.1.2-alpha.12`); `backend/bitcodex_api/server` (dependencies: `^0.1.2-alpha.2`); `backend/bitcodex_api_server_state` (dependencies: `^0.1.2-alpha.1`); `embed/bitcodex_attached` (dependencies: `^0.1.2-alpha.1`); `common/bitcodex_types` (dependencies: `^0.1.2-alpha.12`); `crypto/tecdsa/cait_sith_cosmos_compat_hooks` (dependencies: `^0.1.2-alpha.1`); `crypto/teddsa/teddsa_interface` (dependencies: `^0.1.2-alpha.1`); `crypto/teddsa/teddsa_hooks` (dependencies: `^0.1.2-alpha.1`).
dependencies: `@bitcodex/stdlib-js@^0.1.2-alpha.12` → `lib/stdlib_js` [local-name; registry/range declaration].
devDependencies: `@jest/globals@^29.7.0`; `@types/jest@^29.5.14`; `@types/node@^24.10.1`; `del-cli@^6.0.0`; `jest@^30.1.3`; `ts-jest@^29.4.5`; `typescript@^5.8.3`.

###### `crypto/tecdsa/tecdsa_interface`
Name: `@bitcodex/tecdsa-interface`. ECDSA protocol TS types.
Direct declared consumers: `backend/bitcodex_api/server` (dependencies: `0.0.2-alpha.22`); `embed/bitcodex_attached` (dependencies: `0.0.2-alpha.22`); `common/bitcodex_types` (dependencies: `0.0.2-alpha.22`); `crypto/tecdsa/server_example` (dependencies: `0.0.2-alpha.22`); `crypto/tecdsa/cait_sith_cosmos_compat_express` (dependencies: `0.0.2-alpha.22`); `crypto/tecdsa/cait_sith_cosmos_compat_hooks` (dependencies: `0.0.2-alpha.22`).
devDependencies: `@jest/globals@^29.7.0`; `@types/jest@^29.5.14`; `@types/node@^24.10.1`; `del-cli@^6.0.0`; `ts-jest@^29.4.5`; `tsc-alias@^1.8.16`; `typescript@^5.8.3`.

###### `crypto/crypto_js`
Name: `@bitcodex/crypto-js`. JavaScript crypto/encryption primitives.
Direct declared consumers: `e2e_tests` (dependencies: `workspace:*`); `key_share_node/server` (dependencies: `^0.1.2-alpha.1`); `backend/bitcodex_api/server` (dependencies: `^0.1.2-alpha.1`); `backend/bitcodex_api_server_state` (dependencies: `^0.1.2-alpha.1`); `backend/ct_dashboard_api` (dependencies: `^0.1.2-alpha.1`); `backend/bitcodex_pg_interface` (dependencies: `^0.1.2-alpha.1`); `backend/admin_api` (dependencies: `^0.1.2-alpha.1`); `backend/user_dashboard_api` (dependencies: `^0.1.2-alpha.1`); `embed/bitcodex_attached` (dependencies: `^0.1.2-alpha.1`).
dependencies: `@noble/curves@2.0.1`; `@noble/hashes@2.0.1`; `@bitcodex/bytes@^0.1.2-alpha.12` → `crypto/bytes` [local-name; registry/range declaration]; `@bitcodex/stdlib-js@^0.1.2-alpha.12` → `lib/stdlib_js` [local-name; registry/range declaration]; `bcryptjs@^3.0.2`; `supertest@^7.0.0`.
devDependencies: `@jest/globals@^29.7.0`; `@types/bcryptjs@^2.4.6`; `@types/jest@^29.5.14`; `@types/node@^24.10.1`; `del-cli@^6.0.0`; `jest@^30.1.3`; `ts-jest@^29.4.5`; `typescript@^5.8.3`; `vite@^7.1.6`; `vite-plugin-node-polyfills@^0.24.0`.

###### `backend/bitcodex_api_error_codes`
Name: `@bitcodex/bitcodex-api-error-codes`. API error names and HTTP status mapping.
Direct declared consumers: `backend/bitcodex_api/server` (dependencies: `workspace:*`); `backend/ct_dashboard_api` (dependencies: `workspace:*`); `backend/admin_api` (dependencies: `workspace:*`); `backend/user_dashboard_api` (dependencies: `workspace:*`).
dependencies: `@bitcodex/bitcodex-types@^0.1.2-alpha.1` → `common/bitcodex_types` [local-name; registry/range declaration]; `@bitcodex/stdlib-js@0.0.2-rc.41` → `lib/stdlib_js` [local-name; registry/range declaration]; `uuid@^13.0.0`.
devDependencies: `@types/jest@^29.5.14`; `@types/node@^24.10.1`; `jest@^30.1.3`; `ts-jest@^29.4.5`; `tsx@^4.20.3`; `typescript@^5.8.3`.

###### `backend/bitcodex_api/server`
Name: `@bitcodex/bitcodex-api-server`. Main Express host: TSS/auth/social/dashboard/admin routes and runtimes.
Direct declared consumers: `e2e_tests` (devDependencies: `workspace:*`).
dependencies: `@bitcodex/admin-api@workspace:*` → `backend/admin_api` [workspace protocol]; `@bitcodex/bytes@^0.1.2-alpha.2` → `crypto/bytes` [local-name; registry/range declaration]; `@bitcodex/cait-sith-cosmos-compat-addon@workspace:*` → `crypto/tecdsa/cait_sith_cosmos_compat_addon` [workspace protocol]; `@bitcodex/crypto-js@^0.1.2-alpha.1` → `crypto/crypto_js` [local-name; registry/range declaration]; `@bitcodex/ct-dashboard-api@workspace:*` → `backend/ct_dashboard_api` [workspace protocol]; `@bitcodex/dotenv@0.0.2-alpha.26` → `lib/dotenv` [local-name; registry/range declaration]; `@bitcodex/ksn-interface@workspace:*` → `key_share_node/ksn_interface` [workspace protocol]; `@bitcodex/bitcodex-api-error-codes@workspace:*` → `backend/bitcodex_api_error_codes` [workspace protocol]; `@bitcodex/bitcodex-api-openapi@workspace:*` → `backend/openapi` [workspace protocol]; `@bitcodex/bitcodex-api-server-state@workspace:*` → `backend/bitcodex_api_server_state` [workspace protocol]; `@bitcodex/bitcodex-pg-interface@workspace:*` → `backend/bitcodex_pg_interface` [workspace protocol]; `@bitcodex/bitcodex-types@^0.1.2-alpha.1` → `common/bitcodex_types` [local-name; registry/range declaration]; `@bitcodex/postgres-lib@workspace:*` → `lib/postgres_lib` [workspace protocol]; `@bitcodex/stdlib-js@0.0.2-rc.41` → `lib/stdlib_js` [local-name; registry/range declaration]; `@bitcodex/tecdsa-interface@0.0.2-alpha.22` → `crypto/tecdsa/tecdsa_interface` [local-name; registry/range declaration]; `@bitcodex/teddsa-addon@workspace:*` → `crypto/teddsa/teddsa_addon` [workspace protocol]; `@bitcodex/teddsa-interface@workspace:*` → `crypto/teddsa/teddsa_interface` [workspace protocol]; `@bitcodex/user-dashboard-api@workspace:*` → `backend/user_dashboard_api` [workspace protocol]; `chalk@^5.5.0`; `cors@^2.8.5`; `dotenv@^16.4.5`; `express@^4.21.1`; `helmet@^8.0.0`; `jsonwebtoken@^9.0.2`; `knex@^3.1.0`; `morgan@^1.10.0`; `nodemailer@^7.0.4`; `pg@^8.16.3`; `swagger-ui-express@^5.0.1`; `tsx@^4.20.3`; `uuid@^13.0.0`; `winston@^3.17.0`; `winston-elasticsearch@^0.19.0`; `zod@^4.1.12`.
devDependencies: `@types/cors@^2.8.17`; `@types/express@^5.0.6`; `@types/jest@^29.5.14`; `@types/jsonwebtoken@^9.0.7`; `@types/morgan@^1.9.9`; `@types/node@^24.10.1`; `@types/nodemailer@^6.4.17`; `@types/supertest@^6.0.3`; `@types/swagger-jsdoc@^6.0.4`; `@types/swagger-ui-express@^4.1.8`; `jest@^30.1.3`; `supertest@^7.0.0`; `ts-jest@^29.4.5`; `typescript@^5.8.3`.

###### `backend/bitcodex_api_server_state`
Name: `@bitcodex/bitcodex-api-server-state`. Shared server state and logging initialization.
Direct declared consumers: `backend/bitcodex_api/server` (dependencies: `workspace:*`); `backend/ct_dashboard_api` (dependencies: `workspace:*`); `backend/admin_api` (dependencies: `workspace:*`); `backend/user_dashboard_api` (dependencies: `workspace:*`).
dependencies: `@bitcodex/bytes@^0.1.2-alpha.1` → `crypto/bytes` [local-name; registry/range declaration]; `@bitcodex/crypto-js@^0.1.2-alpha.1` → `crypto/crypto_js` [local-name; registry/range declaration]; `@bitcodex/bitcodex-pg-interface@workspace:*` → `backend/bitcodex_pg_interface` [workspace protocol]; `@bitcodex/stdlib-js@0.0.2-rc.41` → `lib/stdlib_js` [local-name; registry/range declaration]; `cors@^2.8.5`; `dotenv@^16.4.5`; `express@^4.21.1`; `helmet@^8.0.0`; `jsonwebtoken@^9.0.2`; `morgan@^1.10.0`; `pg@^8.16.3`; `uuid@^13.0.0`; `winston@^3.17.0`; `winston-elasticsearch@^0.19.0`.
devDependencies: `@types/express@^5.0.6`; `@types/jest@^29.5.14`; `@types/jsonwebtoken@^9.0.7`; `@types/morgan@^1.9.9`; `@types/node@^24.10.1`; `@types/supertest@^6.0.3`; `jest@^30.1.3`; `supertest@^7.0.0`; `ts-jest@^29.4.5`; `typescript@^5.8.3`.

###### `backend/ct_dashboard_api`
Name: `@bitcodex/ct-dashboard-api`. Customer dashboard router: customers, API keys, verification and app info.
Direct declared consumers: `backend/bitcodex_api/server` (dependencies: `workspace:*`).
dependencies: `@bitcodex/admin-api@workspace:*` → `backend/admin_api` [workspace protocol]; `@bitcodex/aws@workspace:*` → `lib/aws` [workspace protocol]; `@bitcodex/crypto-js@^0.1.2-alpha.1` → `crypto/crypto_js` [local-name; registry/range declaration]; `@bitcodex/bitcodex-api-error-codes@workspace:*` → `backend/bitcodex_api_error_codes` [workspace protocol]; `@bitcodex/bitcodex-api-openapi@workspace:*` → `backend/openapi` [workspace protocol]; `@bitcodex/bitcodex-api-server-state@workspace:*` → `backend/bitcodex_api_server_state` [workspace protocol]; `@bitcodex/bitcodex-pg-interface@workspace:*` → `backend/bitcodex_pg_interface` [workspace protocol]; `@bitcodex/bitcodex-types@^0.1.2-alpha.1` → `common/bitcodex_types` [local-name; registry/range declaration]; `@bitcodex/postgres-lib@workspace:*` → `lib/postgres_lib` [workspace protocol]; `@bitcodex/stdlib-js@0.0.2-rc.41` → `lib/stdlib_js` [local-name; registry/range declaration]; `cors@^2.8.5`; `dotenv@^16.4.5`; `express@^4.21.1`; `express-rate-limit@8.2.1`; `helmet@^8.0.0`; `jsonwebtoken@^9.0.2`; `morgan@^1.10.0`; `multer@^2.0.0`; `pg@^8.16.3`; `sharp@0.33.4`; `swagger-ui-express@^5.0.1`; `uuid@^13.0.0`; `zod@^4.1.12`.
devDependencies: `@types/cors@^2.8.17`; `@types/express@^5.0.6`; `@types/jest@^29.5.14`; `@types/jsonwebtoken@^9.0.7`; `@types/morgan@^1.9.9`; `@types/multer@^2.0.0`; `@types/node@^24.10.1`; `@types/supertest@^6.0.3`; `@types/swagger-jsdoc@^6.0.4`; `@types/swagger-ui-express@^4.1.8`; `jest@^30.1.3`; `supertest@^7.0.0`; `ts-jest@^29.4.5`; `typescript@^5.8.3`.

###### `backend/bitcodex_pg_interface`
Name: `@bitcodex/bitcodex-pg-interface`. Main Postgres data layer, migrations and seeds.
Direct declared consumers: `e2e_tests` (dependencies: `workspace:*`); `backend/bitcodex_api/server` (dependencies: `workspace:*`); `backend/bitcodex_api_server_state` (dependencies: `workspace:*`); `backend/ct_dashboard_api` (dependencies: `workspace:*`); `backend/admin_api` (dependencies: `workspace:*`); `backend/user_dashboard_api` (dependencies: `workspace:*`); `apps/bitcodex_admin_web` (dependencies: `workspace:*`).
dependencies: `@bitcodex/cait-sith-cosmos-compat-addon@workspace:*` → `crypto/tecdsa/cait_sith_cosmos_compat_addon` [workspace protocol]; `@bitcodex/cait-sith-cosmos-compat-express@workspace:*` → `crypto/tecdsa/cait_sith_cosmos_compat_express` [workspace protocol]; `@bitcodex/crypto-js@^0.1.2-alpha.1` → `crypto/crypto_js` [local-name; registry/range declaration]; `@bitcodex/dotenv@0.0.2-alpha.26` → `lib/dotenv` [local-name; registry/range declaration]; `@bitcodex/bitcodex-types@^0.1.2-alpha.1` → `common/bitcodex_types` [local-name; registry/range declaration]; `@bitcodex/postgres-lib@workspace:*` → `lib/postgres_lib` [workspace protocol]; `@bitcodex/stdlib-js@0.0.2-rc.41` → `lib/stdlib_js` [local-name; registry/range declaration]; `jest@^30.1.3`; `knex@^3.1.0`; `pg@^8.16.3`; `pgsql-parser@^17.7.8`; `uuid@^13.0.0`.
devDependencies: `@types/jest@^29.5.14`; `@types/node@^24.10.1`; `ts-jest@^29.4.5`; `tsconfig-paths@^4.2.0`; `tsx@^4.20.3`; `typescript@^5.8.3`.

###### `backend/admin_api`
Name: `@bitcodex/admin-api`. Admin management router.
Direct declared consumers: `backend/bitcodex_api/server` (dependencies: `workspace:*`); `backend/ct_dashboard_api` (dependencies: `workspace:*`).
dependencies: `@bitcodex/aws@workspace:*` → `lib/aws` [workspace protocol]; `@bitcodex/crypto-js@^0.1.2-alpha.1` → `crypto/crypto_js` [local-name; registry/range declaration]; `@bitcodex/bitcodex-api-error-codes@workspace:*` → `backend/bitcodex_api_error_codes` [workspace protocol]; `@bitcodex/bitcodex-api-openapi@workspace:*` → `backend/openapi` [workspace protocol]; `@bitcodex/bitcodex-api-server-state@workspace:*` → `backend/bitcodex_api_server_state` [workspace protocol]; `@bitcodex/bitcodex-pg-interface@workspace:*` → `backend/bitcodex_pg_interface` [workspace protocol]; `@bitcodex/bitcodex-types@^0.1.2-alpha.1` → `common/bitcodex_types` [local-name; registry/range declaration]; `@bitcodex/postgres-lib@workspace:*` → `lib/postgres_lib` [workspace protocol]; `@bitcodex/stdlib-js@0.0.2-rc.41` → `lib/stdlib_js` [local-name; registry/range declaration]; `cors@^2.8.5`; `dotenv@^16.4.5`; `express@^4.21.1`; `express-rate-limit@^8.2.1`; `he@^1.2.0`; `helmet@^8.0.0`; `jsonwebtoken@^9.0.2`; `morgan@^1.10.0`; `multer@^2.0.0`; `nodemailer@^7.0.4`; `pg@^8.16.3`; `sharp@0.33.4`; `swagger-ui-express@^5.0.1`; `uuid@^13.0.0`; `zod@^4.1.12`.
devDependencies: `@types/cors@^2.8.17`; `@types/express@^5.0.6`; `@types/express-rate-limit@^6.0.2`; `@types/he@^1.2.0`; `@types/jest@^29.5.14`; `@types/jsonwebtoken@^9.0.7`; `@types/morgan@^1.9.9`; `@types/multer@^2.0.0`; `@types/node@^24.10.1`; `@types/nodemailer@^6.4.17`; `@types/supertest@^6.0.3`; `@types/swagger-jsdoc@^6.0.4`; `@types/swagger-ui-express@^4.1.8`; `jest@^30.1.3`; `supertest@^7.0.0`; `ts-jest@^29.4.5`; `typescript@^5.8.3`.

###### `backend/openapi`
Name: `@bitcodex/bitcodex-api-openapi`. Zod/OpenAPI schemas and registry.
Direct declared consumers: `backend/bitcodex_api/server` (dependencies: `workspace:*`); `backend/ct_dashboard_api` (dependencies: `workspace:*`); `backend/admin_api` (dependencies: `workspace:*`); `backend/user_dashboard_api` (dependencies: `workspace:*`).
dependencies: `@asteasolutions/zod-to-openapi@^8.1.0`; `zod@^4.1.12`.
devDependencies: `typescript@^5.8.3`.

###### `backend/user_dashboard_api`
Name: `@bitcodex/user-dashboard-api`. End-user dashboard router.
Direct declared consumers: `backend/bitcodex_api/server` (dependencies: `workspace:*`).
dependencies: `@bitcodex/aws@workspace:*` → `lib/aws` [workspace protocol]; `@bitcodex/crypto-js@^0.1.2-alpha.1` → `crypto/crypto_js` [local-name; registry/range declaration]; `@bitcodex/bitcodex-api-error-codes@workspace:*` → `backend/bitcodex_api_error_codes` [workspace protocol]; `@bitcodex/bitcodex-api-openapi@workspace:*` → `backend/openapi` [workspace protocol]; `@bitcodex/bitcodex-api-server-state@workspace:*` → `backend/bitcodex_api_server_state` [workspace protocol]; `@bitcodex/bitcodex-pg-interface@workspace:*` → `backend/bitcodex_pg_interface` [workspace protocol]; `@bitcodex/bitcodex-types@^0.1.2-alpha.1` → `common/bitcodex_types` [local-name; registry/range declaration]; `@bitcodex/postgres-lib@workspace:*` → `lib/postgres_lib` [workspace protocol]; `@bitcodex/stdlib-js@0.0.2-rc.41` → `lib/stdlib_js` [local-name; registry/range declaration]; `cors@^2.8.5`; `dotenv@^16.4.5`; `express@^4.21.1`; `express-rate-limit@8.2.1`; `helmet@^8.0.0`; `jsonwebtoken@^9.0.2`; `morgan@^1.10.0`; `multer@^2.0.0`; `nodemailer@^7.0.4`; `pg@^8.16.3`; `sharp@0.33.4`; `swagger-ui-express@^5.0.1`; `uuid@^13.0.0`; `zod@^4.1.12`.
devDependencies: `@types/cors@^2.8.17`; `@types/express@^5.0.6`; `@types/jest@^29.5.14`; `@types/jsonwebtoken@^9.0.7`; `@types/morgan@^1.9.9`; `@types/multer@^2.0.0`; `@types/node@^24.10.1`; `@types/nodemailer@^6.4.17`; `@types/supertest@^6.0.3`; `@types/swagger-jsdoc@^6.0.4`; `@types/swagger-ui-express@^4.1.8`; `jest@^30.1.3`; `supertest@^7.0.0`; `ts-jest@^29.4.5`; `typescript@^5.8.3`.

###### `embed/bitcodex_attached`
Name: `@bitcodex/bitcodex-attached`. Trusted-origin wallet iframe: auth/keygen/recovery/approval/sign/export.
Direct declared consumers: none in existing root-listed manifests.
dependencies: `@amplitude/analytics-browser@^2.18.1`; `@cosmjs/amino@0.36.1`; `@cosmjs/proto-signing@0.36.1`; `@floating-ui/dom@^1.7.4`; `@floating-ui/react@^0.27.16`; `@fontsource-variable/geist@^5.2.8`; `@fontsource-variable/geist-mono@^5.2.7`; `@fontsource-variable/inter@^5.2.8`; `@keplr-wallet/cosmos@^0.12.210`; `@keplr-wallet/proto-types@^0.12.250`; `@keplr-wallet/types@0.12.297`; `@keplr-wallet/unit@0.12.297`; `@bitcodex/api-lib@workspace:*` → `crypto/tecdsa/api_lib` [workspace protocol]; `@bitcodex/bytes@^0.1.2-alpha.1` → `crypto/bytes` [local-name; registry/range declaration]; `@bitcodex/cait-sith-cosmos-compat-hooks@workspace:*` → `crypto/tecdsa/cait_sith_cosmos_compat_hooks` [workspace protocol]; `@bitcodex/cait-sith-cosmos-compat-wasm@workspace:*` → `crypto/tecdsa/cait_sith_cosmos_compat_wasm` [workspace protocol]; `@bitcodex/crypto-js@^0.1.2-alpha.1` → `crypto/crypto_js` [local-name; registry/range declaration]; `@bitcodex/dotenv@^0.0.2-alpha.29` → `lib/dotenv` [local-name; registry/range declaration]; `@bitcodex/frost-ed25519-cosmos-compat-wasm@workspace:*` → `crypto/teddsa/frost_ed25519_cosmos_compat_wasm` [workspace protocol]; `@bitcodex/ksn-interface@^0.1.2-alpha.1` → `key_share_node/ksn_interface` [local-name; registry/range declaration]; `@bitcodex/bitcodex-common-ui@workspace:*` → `ui/bitcodex_common_ui` [workspace protocol]; `@bitcodex/bitcodex-sdk-core@^0.1.2-alpha.12` → `sdk/bitcodex_sdk_core` [local-name; registry/range declaration]; `@bitcodex/bitcodex-sdk-cosmos@^0.1.2-alpha.1` → `sdk/bitcodex_sdk_cosmos` [local-name; registry/range declaration]; `@bitcodex/bitcodex-sdk-eth@^0.1.2-alpha.1` → `sdk/bitcodex_sdk_eth` [local-name; registry/range declaration]; `@bitcodex/stdlib-js@0.0.2-rc.41` → `lib/stdlib_js` [local-name; registry/range declaration]; `@bitcodex/tecdsa-interface@0.0.2-alpha.22` → `crypto/tecdsa/tecdsa_interface` [local-name; registry/range declaration]; `@bitcodex/teddsa-hooks@workspace:*` → `crypto/teddsa/teddsa_hooks` [workspace protocol]; `@bitcodex/teddsa-interface@workspace:*` → `crypto/teddsa/teddsa_interface` [workspace protocol]; `@solana/web3.js@^1.98.0`; `@solanafm/explorer-kit@^1.2.0`; `@solanafm/explorer-kit-idls@^1.1.4`; `@tanstack/react-query@^5.90.12`; `@tanstack/react-router@^1.136.8`; `@tanstack/react-router-devtools@^1.136.8`; `@tanstack/router-plugin@^1.136.8`; `auth0-js@^9.29.0`; `bitcoinjs-lib@^6.1.7`; `bs58@^6.0.0`; `chalk@^5.5.0`; `cosmjs-types@^0.9.0`; `jsonwebtoken@^9.0.2`; `react@^19.2.1`; `react-dom@^19.2.1`; `react-error-boundary@^6.0.0`; `starknet@^7.6.4`; `uuid@^13.0.0`; `viem@^2.41.2`; `vite@^7.1.6`; `zod@^4.1.12`; `zustand@^5.0.6`.
devDependencies: `@types/auth0-js@^9.21.6`; `@types/node@^24.10.1`; `@types/react@^19.2.7`; `@types/react-dom@^19.2.3`; `@vitejs/plugin-react@^5.0.3`; `del@^8.0.1`; `del-cli@^6.0.0`; `dotenv@^16.4.5`; `sass@^1.94.2`; `tsx@^4.20.3`; `typescript@^5.8.3`; `vite-plugin-node-polyfills@^0.24.0`; `vite-tsconfig-paths@^5.1.4`.

###### `ui/bitcodex_common_ui`
Name: `@bitcodex/bitcodex-common-ui`. Shared Sass/React controls, icons and theme.
Direct declared consumers: `embed/bitcodex_attached` (dependencies: `workspace:*`); `apps/demo_web` (devDependencies: `workspace:*`); `apps/bitcodex_admin_web` (dependencies: `workspace:*`); `apps/customer_dashboard` (dependencies: `workspace:*`); `apps/email_template_2` (dependencies: `workspace:*`); `apps/user_dashboard` (dependencies: `workspace:*`).
dependencies: `@floating-ui/dom@^1.7.4`; `@floating-ui/react@^0.27.16`; `@bitcodex/stdlib-js@0.0.2-rc.40` → `lib/stdlib_js` [local-name; registry/range declaration]; `classnames@^2.5.1`; `next@^16.1.1`; `react@^19.2.1`; `react-dom@^19.2.1`; `sass@^1.94.2`.
devDependencies: `@types/node@^24.10.1`; `@types/react@^19.2.7`; `@types/react-dom@^19.2.3`; `tsx@^4.20.3`; `typescript@^5.8.3`.

###### `apps/demo_web`
Name: `@bitcodex/demo-web`. Next.js multichain integration demo.
Direct declared consumers: none in existing root-listed manifests.
dependencies: `next@^16.1.1`; `react@^19.2.1`; `react-dom@^19.2.1`.
devDependencies: `@cosmjs/proto-signing@^0.33.1`; `@keplr-wallet/proto-types@^0.12.250`; `@bitcodex/dotenv@^0.0.2-alpha.29` → `lib/dotenv` [local-name; registry/range declaration]; `@bitcodex/bitcodex-common-ui@workspace:*` → `ui/bitcodex_common_ui` [workspace protocol]; `@bitcodex/bitcodex-sdk-core@workspace:*` → `sdk/bitcodex_sdk_core` [workspace protocol]; `@bitcodex/bitcodex-sdk-cosmos@workspace:*` → `sdk/bitcodex_sdk_cosmos` [workspace protocol]; `@bitcodex/bitcodex-sdk-eth@workspace:*` → `sdk/bitcodex_sdk_eth` [workspace protocol]; `@bitcodex/bitcodex-sdk-react@workspace:*` → `sdk/bitcodex_sdk_react` [workspace protocol]; `@bitcodex/bitcodex-sdk-svm@workspace:*` → `sdk/bitcodex_sdk_svm` [workspace protocol]; `@bitcodex/stdlib-js@^0.0.2-rc.44` → `lib/stdlib_js` [local-name; registry/range declaration]; `@types/node@^24.10.1`; `@types/react@^19.2.7`; `@types/react-dom@^19.2.3`; `dotenv@^16.4.5`; `sass@^1.94.2`; `tsx@^4.20.3`; `typescript@^5.8.3`; `zod@^4.1.12`.

###### `apps/attached_mobile_host_web`
Name: `@bitcodex/attached-mobile-host-web`. Vite mobile host and OAuth/RPC bridge (legacy Next-style files remain).
Direct declared consumers: none in existing root-listed manifests.
dependencies: `buffer@^6.0.3`; `pako@^2.1.0`; `react@^19.2.1`; `react-dom@^19.2.1`.
devDependencies: `@bitcodex/dotenv@^0.0.2-alpha.29` → `lib/dotenv` [local-name; registry/range declaration]; `@types/node@^24.10.1`; `@types/react@^19.2.7`; `@types/react-dom@^19.2.3`; `@vitejs/plugin-react@^4.5.2`; `tsx@^4.20.3`; `typescript@^5.8.3`; `vite@^6.3.5`; `zod@^4.1.12`.

###### `apps/bitcodex_admin_web`
Name: `@bitcodex/bitcodex-admin-web`. Next.js admin UI.
Direct declared consumers: none in existing root-listed manifests.
dependencies: `@bitcodex/dotenv@^0.0.2-alpha.29` → `lib/dotenv` [local-name; registry/range declaration]; `@bitcodex/bitcodex-common-ui@workspace:*` → `ui/bitcodex_common_ui` [workspace protocol]; `@bitcodex/bitcodex-pg-interface@workspace:*` → `backend/bitcodex_pg_interface` [workspace protocol]; `@bitcodex/stdlib-js@^0.0.2-rc.44` → `lib/stdlib_js` [local-name; registry/range declaration]; `@tanstack/react-query@^5.90.12`; `@tanstack/react-table@^8.21.3`; `next@^16.1.1`; `react@^19.2.1`; `react-dom@^19.2.1`; `react-hook-form@^7.65.0`; `react-intl@^7.1.14`; `zustand@^5.0.6`.
devDependencies: `@types/node@^24.10.1`; `@types/react@^19.2.7`; `@types/react-dom@^19.2.3`; `sass@^1.94.2`; `tsx@^4.20.3`; `typescript@^5.8.3`.

###### `apps/customer_dashboard`
Name: `@bitcodex/customer-dashboard`. Next.js customer/app/API-key dashboard.
Direct declared consumers: none in existing root-listed manifests.
dependencies: `@floating-ui/dom@^1.7.4`; `@floating-ui/react@^0.27.16`; `@bitcodex/dotenv@^0.0.2-alpha.29` → `lib/dotenv` [local-name; registry/range declaration]; `@bitcodex/bitcodex-common-ui@workspace:*` → `ui/bitcodex_common_ui` [workspace protocol]; `@bitcodex/stdlib-js@^0.0.2-rc.44` → `lib/stdlib_js` [local-name; registry/range declaration]; `@tanstack/react-query@^5.90.12`; `@tanstack/react-table@^8.21.3`; `next@^16.1.1`; `react@^19.2.1`; `react-dom@^19.2.1`; `react-hook-form@^7.65.0`; `sonner@^2.0.7`; `zustand@^5.0.6`.
devDependencies: `@types/node@^24.10.1`; `@types/react@^19.2.7`; `@types/react-dom@^19.2.3`; `sass@^1.94.2`; `tsx@^4.20.3`; `typescript@^5.8.3`.

###### `apps/docs_web`
Name: `@bitcodex/docs_web`. Docusaurus docs.
Direct declared consumers: none in existing root-listed manifests.
dependencies: `@docusaurus/core@3.9.2`; `@docusaurus/plugin-client-redirects@3.9.2`; `@docusaurus/preset-classic@3.9.2`; `@mdx-js/react@^3.0.0`; `@signalwire/docusaurus-plugin-llms-txt@2.0.0-alpha.7`; `@signalwire/docusaurus-theme-llms-txt@1.0.0-alpha.9`; `clsx@^2.0.0`; `prism-react-renderer@^2.3.0`; `react@^19.2.1`; `react-dom@^19.2.1`.
devDependencies: `@docusaurus/module-type-aliases@3.9.2`; `@docusaurus/tsconfig@3.9.2`; `@docusaurus/types@3.9.2`; `typescript@^5.8.3`.

###### `apps/email_template_2`
Name: `@bitcodex/email-template-2`. Email template authoring/static export.
Direct declared consumers: none in existing root-listed manifests.
dependencies: `@floating-ui/dom@^1.7.4`; `@floating-ui/react@^0.27.16`; `@bitcodex/dotenv@^0.0.2-alpha.29` → `lib/dotenv` [local-name; registry/range declaration]; `@bitcodex/bitcodex-common-ui@workspace:*` → `ui/bitcodex_common_ui` [workspace protocol]; `@bitcodex/stdlib-js@^0.0.2-rc.44` → `lib/stdlib_js` [local-name; registry/range declaration]; `@tanstack/react-query@^5.90.12`; `@tanstack/react-table@^8.21.3`; `next@^16.1.1`; `react@^19.2.1`; `react-dom@^19.2.1`; `react-hook-form@^7.65.0`; `zustand@^5.0.6`.
devDependencies: `@types/node@^24.10.1`; `@types/react@^19.2.7`; `@types/react-dom@^19.2.3`; `sass@^1.94.2`; `tsx@^4.20.3`; `typescript@^5.8.3`.

###### `apps/user_dashboard`
Name: `@bitcodex/user-dashboard`. Next.js asset/connected-app/export dashboard.
Direct declared consumers: none in existing root-listed manifests.
dependencies: `@floating-ui/dom@^1.7.4`; `@floating-ui/react@^0.27.16`; `@keplr-wallet/cosmos@0.12.297`; `@keplr-wallet/unit@0.12.297`; `@bitcodex/dotenv@^0.0.2-alpha.29` → `lib/dotenv` [local-name; registry/range declaration]; `@bitcodex/bitcodex-common-ui@workspace:*` → `ui/bitcodex_common_ui` [workspace protocol]; `@bitcodex/bitcodex-sdk-cosmos@^0.1.2-alpha.1` → `sdk/bitcodex_sdk_cosmos` [local-name; registry/range declaration]; `@bitcodex/bitcodex-sdk-eth@^0.1.2-alpha.1` → `sdk/bitcodex_sdk_eth` [local-name; registry/range declaration]; `@bitcodex/bitcodex-sdk-react@workspace:*` → `sdk/bitcodex_sdk_react` [workspace protocol]; `@bitcodex/bitcodex-sdk-svm@workspace:*` → `sdk/bitcodex_sdk_svm` [workspace protocol]; `@bitcodex/bitcodex-types@^0.1.2-alpha.2` → `common/bitcodex_types` [local-name; registry/range declaration]; `@bitcodex/stdlib-js@0.0.2-rc.41` → `lib/stdlib_js` [local-name; registry/range declaration]; `@solana/web3.js@^1.98.0`; `@tanstack/query-sync-storage-persister@^5.90.24`; `@tanstack/react-query@^5.90.21`; `@tanstack/react-query-persist-client@^5.90.24`; `@tanstack/react-table@^8.21.3`; `classnames@^2.5.1`; `lodash.throttle@^4.1.1`; `next@^16.1.1`; `qrcode.react@^4.2.0`; `react@^19.2.1`; `react-dom@^19.2.1`; `react-hook-form@^7.65.0`; `sonner@^2.0.7`; `utility-types@^3.11.0`; `zustand@^5.0.6`.
devDependencies: `@types/lodash.throttle@^4`; `@types/node@^24.10.1`; `@types/react@^19.2.7`; `@types/react-dom@^19.2.3`; `sass@^1.94.2`; `tsx@^4.20.3`; `typescript@^5.8.3`.

###### `common/bitcodex_types`
Name: `@bitcodex/bitcodex-types`. Shared API/crypto/wallet domain types.
Direct declared consumers: `e2e_tests` (dependencies: `workspace:*`); `key_share_node/ksn_interface` (dependencies: `^0.1.2-alpha.14`); `sdk/bitcodex_sdk_core` (dependencies: `^0.1.2-alpha.14`); `sdk/bitcodex_sdk_core_react_native` (dependencies: `^0.1.2-alpha.14`); `sdk/bitcodex_sdk_react` (dependencies: `^0.1.2-alpha.14`); `backend/bitcodex_api_error_codes` (dependencies: `^0.1.2-alpha.1`); `backend/bitcodex_api/server` (dependencies: `^0.1.2-alpha.1`); `backend/ct_dashboard_api` (dependencies: `^0.1.2-alpha.1`); `backend/bitcodex_pg_interface` (dependencies: `^0.1.2-alpha.1`); `backend/admin_api` (dependencies: `^0.1.2-alpha.1`); `backend/user_dashboard_api` (dependencies: `^0.1.2-alpha.1`); `apps/user_dashboard` (dependencies: `^0.1.2-alpha.2`); `crypto/tecdsa/cait_sith_cosmos_compat_hooks` (dependencies: `^0.1.2-alpha.1`); `crypto/tecdsa/api_lib` (dependencies: `^0.1.2-alpha.1`); `crypto/teddsa/teddsa_interface` (dependencies: `^0.1.2-alpha.1`); `crypto/teddsa/teddsa_hooks` (dependencies: `^0.1.2-alpha.1`); `crypto/teddsa/teddsa_addon` (dependencies: `^0.1.2-alpha.1`); `crypto/teddsa/api_lib` (dependencies: `^0.1.2-alpha.1`).
dependencies: `@bitcodex/bytes@^0.1.2-alpha.12` → `crypto/bytes` [local-name; registry/range declaration]; `@bitcodex/stdlib-js@0.0.2-rc.41` → `lib/stdlib_js` [local-name; registry/range declaration]; `@bitcodex/tecdsa-interface@0.0.2-alpha.22` → `crypto/tecdsa/tecdsa_interface` [local-name; registry/range declaration]; `del-cli@^6.0.0`; `tsc-alias@^1.8.16`; `viem@^2.41.2`.
devDependencies: `@types/jest@^29.5.14`; `@types/node@^24.10.1`; `typescript@^5.8.3`.

###### `lib/stdlib_js`
Name: `@bitcodex/stdlib-js`. Result/helpers/general JS utility library.
Direct declared consumers: `e2e_tests` (dependencies: `workspace:*`); `key_share_node/pg_interface` (dependencies: `^0.0.2-rc.44`); `key_share_node/server` (dependencies: `^0.0.2-rc.44`); `sdk/bitcodex_sdk_core` (dependencies: `^0.1.2-alpha.12`); `sdk/bitcodex_sdk_core_react_native` (dependencies: `^0.1.2-alpha.12`); `sdk/bitcodex_sdk_cosmos` (dependencies: `^0.1.2-alpha.12`); `sdk/bitcodex_sdk_eth` (dependencies: `^0.1.2-alpha.12`); `sdk/bitcodex_sdk_react` (dependencies: `^0.1.2-alpha.12`); `sdk/bitcodex_sdk_svm` (dependencies: `^0.0.2-rc.42`); `crypto/bytes` (dependencies: `^0.1.2-alpha.12`); `crypto/crypto_js` (dependencies: `^0.1.2-alpha.12`); `backend/bitcodex_api_error_codes` (dependencies: `0.0.2-rc.41`); `backend/bitcodex_api/server` (dependencies: `0.0.2-rc.41`); `backend/bitcodex_api_server_state` (dependencies: `0.0.2-rc.41`); `backend/ct_dashboard_api` (dependencies: `0.0.2-rc.41`); `backend/bitcodex_pg_interface` (dependencies: `0.0.2-rc.41`); `backend/admin_api` (dependencies: `0.0.2-rc.41`); `backend/user_dashboard_api` (dependencies: `0.0.2-rc.41`); `embed/bitcodex_attached` (dependencies: `0.0.2-rc.41`); `ui/bitcodex_common_ui` (dependencies: `0.0.2-rc.40`); `apps/demo_web` (devDependencies: `^0.0.2-rc.44`); `apps/bitcodex_admin_web` (dependencies: `^0.0.2-rc.44`); `apps/customer_dashboard` (dependencies: `^0.0.2-rc.44`); `apps/email_template_2` (dependencies: `^0.0.2-rc.44`); `apps/user_dashboard` (dependencies: `0.0.2-rc.41`); `common/bitcodex_types` (dependencies: `0.0.2-rc.41`); `lib/dotenv` (dependencies: `^0.1.2-alpha.12`); `lib/aws` (dependencies: `0.0.2-rc.41`); `lib/postgres_lib` (dependencies: `0.0.2-rc.41`); `crypto/tecdsa/cait_sith_cosmos_compat_addon` (devDependencies: `^0.0.2-rc.44`); `crypto/tecdsa/cait_sith_cosmos_compat_hooks` (dependencies: `^0.0.2-rc.44`); `crypto/teddsa/teddsa_hooks` (dependencies: `^0.0.2-rc.42`).
devDependencies: `@jest/globals@^29.7.0`; `@types/jest@^29.5.14`; `@types/node@^24.10.1`; `del-cli@^6.0.0`; `ts-jest@^29.4.5`; `tsc-alias@^1.8.16`; `typescript@^5.8.3`.

###### `lib/dotenv`
Name: `@bitcodex/dotenv`. Home-directory environment loading/validation helpers.
Direct declared consumers: `backend/bitcodex_api/server` (dependencies: `0.0.2-alpha.26`); `backend/bitcodex_pg_interface` (dependencies: `0.0.2-alpha.26`); `embed/bitcodex_attached` (dependencies: `^0.0.2-alpha.29`); `apps/demo_web` (devDependencies: `^0.0.2-alpha.29`); `apps/attached_mobile_host_web` (devDependencies: `^0.0.2-alpha.29`); `apps/bitcodex_admin_web` (dependencies: `^0.0.2-alpha.29`); `apps/customer_dashboard` (dependencies: `^0.0.2-alpha.29`); `apps/email_template_2` (dependencies: `^0.0.2-alpha.29`); `apps/user_dashboard` (dependencies: `^0.0.2-alpha.29`).
dependencies: `@bitcodex/stdlib-js@^0.1.2-alpha.12` → `lib/stdlib_js` [local-name; registry/range declaration]; `dotenv@^16.4.5`; `zod@^4.1.12`.
devDependencies: `@types/jest@^29.5.14`; `@types/node@^24.10.1`; `del-cli@^6.0.0`; `jest@^30.1.3`; `ts-jest@^29.4.5`; `tsc-alias@^1.8.16`; `tsx@^4.20.3`; `typescript@^5.8.3`.

###### `lib/aws`
Name: `@bitcodex/aws`. S3 upload adapter.
Direct declared consumers: `backend/ct_dashboard_api` (dependencies: `workspace:*`); `backend/admin_api` (dependencies: `workspace:*`); `backend/user_dashboard_api` (dependencies: `workspace:*`).
dependencies: `@aws-sdk/client-s3@^3.850.0`; `@bitcodex/stdlib-js@0.0.2-rc.41` → `lib/stdlib_js` [local-name; registry/range declaration]; `dotenv@^16.4.5`.
devDependencies: `@jest/globals@^29.7.0`; `@types/bcryptjs@^2.4.6`; `@types/jest@^29.5.14`; `@types/node@^24.10.1`; `jest@^30.1.3`; `ts-jest@^29.4.5`; `typescript@^5.8.3`.

###### `lib/postgres_lib`
Name: `@bitcodex/postgres-lib`. Reusable Postgres helpers.
Direct declared consumers: `e2e_tests` (dependencies: `workspace:*`); `backend/bitcodex_api/server` (dependencies: `workspace:*`); `backend/ct_dashboard_api` (dependencies: `workspace:*`); `backend/bitcodex_pg_interface` (dependencies: `workspace:*`); `backend/admin_api` (dependencies: `workspace:*`); `backend/user_dashboard_api` (dependencies: `workspace:*`).
dependencies: `@bitcodex/stdlib-js@0.0.2-rc.41` → `lib/stdlib_js` [local-name; registry/range declaration]; `cors@^2.8.5`; `dotenv@^16.4.5`; `express@^4.21.1`; `helmet@^8.0.0`; `jsonwebtoken@^9.0.2`; `morgan@^1.10.0`; `nodemailer@^7.0.4`; `pg@^8.16.3`; `swagger-ui-express@^5.0.1`; `uuid@^13.0.0`; `zod@^4.1.12`.
devDependencies: `@types/cors@^2.8.17`; `@types/express@^5.0.6`; `@types/jest@^29.5.14`; `@types/jsonwebtoken@^9.0.7`; `@types/morgan@^1.9.9`; `@types/node@^24.10.1`; `@types/nodemailer@^6.4.17`; `@types/supertest@^6.0.3`; `@types/swagger-jsdoc@^6.0.4`; `@types/swagger-ui-express@^4.1.8`; `jest@^30.1.3`; `supertest@^7.0.0`; `ts-jest@^29.4.5`; `typescript@^5.8.3`.

###### `crypto/tecdsa/server_example`
Name: `server_example`. ECDSA Express demo server.
Direct declared consumers: none in existing root-listed manifests.
dependencies: `@bitcodex/api-lib@workspace:*` → `crypto/tecdsa/api_lib` [workspace protocol]; `@bitcodex/cait-sith-cosmos-compat-addon@workspace:*` → `crypto/tecdsa/cait_sith_cosmos_compat_addon` [workspace protocol]; `@bitcodex/cait-sith-cosmos-compat-express@workspace:*` → `crypto/tecdsa/cait_sith_cosmos_compat_express` [workspace protocol]; `@bitcodex/tecdsa-interface@0.0.2-alpha.22` → `crypto/tecdsa/tecdsa_interface` [local-name; registry/range declaration]; `cors@^2.8.5`; `dotenv@^16.4.5`; `express@^4.21.1`; `helmet@^8.0.0`; `morgan@^1.10.0`.
devDependencies: `@types/cors@^2.8.17`; `@types/express@^5.0.6`; `@types/jest@^29.5.14`; `@types/morgan@^1.9.9`; `@types/node@^24.10.1`; `@types/supertest@^6.0.3`; `jest@^30.1.3`; `nodemon@^3.1.7`; `npm@^11.2.0`; `supertest@^7.0.0`; `ts-jest@^29.4.5`; `ts-node@^10.9.2`; `typescript@^5.8.3`.

###### `crypto/tecdsa/cait_sith_cosmos_compat_addon`
Name: `@bitcodex/cait-sith-cosmos-compat-addon`. ECDSA native-addon TS wrapper.
Direct declared consumers: `backend/bitcodex_api/server` (dependencies: `workspace:*`); `backend/bitcodex_pg_interface` (dependencies: `workspace:*`); `crypto/tecdsa/server_example` (dependencies: `workspace:*`); `crypto/tecdsa/cait_sith_cosmos_compat_express` (dependencies: `workspace:*`).
dependencies: `@bitcodex/api-lib@workspace:*` → `crypto/tecdsa/api_lib` [workspace protocol]; `cors@^2.8.5`; `dotenv@^16.4.5`; `express@^4.21.1`; `helmet@^8.0.0`; `morgan@^1.10.0`; `shamir-secret-sharing@^0.0.4`.
devDependencies: `@bitcodex/stdlib-js@^0.0.2-rc.44` → `lib/stdlib_js` [local-name; registry/range declaration]; `@types/cors@^2.8.17`; `@types/express@^5.0.6`; `@types/jest@^29.5.14`; `@types/morgan@^1.9.9`; `@types/node@^24.10.1`; `@types/supertest@^6.0.3`; `ethers@^5.7.2`; `jest@^30.1.3`; `nodemon@^3.1.7`; `supertest@^7.0.0`; `ts-jest@^29.4.5`; `ts-node@^10.9.2`; `typescript@^5.8.3`.

###### `crypto/tecdsa/cait_sith_cosmos_compat_express`
Name: `@bitcodex/cait-sith-cosmos-compat-express`. ECDSA Express sample handlers.
Direct declared consumers: `backend/bitcodex_pg_interface` (dependencies: `workspace:*`); `crypto/tecdsa/server_example` (dependencies: `workspace:*`).
dependencies: `@bitcodex/api-lib@workspace:*` → `crypto/tecdsa/api_lib` [workspace protocol]; `@bitcodex/cait-sith-cosmos-compat-addon@workspace:*` → `crypto/tecdsa/cait_sith_cosmos_compat_addon` [workspace protocol]; `@bitcodex/tecdsa-interface@0.0.2-alpha.22` → `crypto/tecdsa/tecdsa_interface` [local-name; registry/range declaration]; `cors@^2.8.5`; `dotenv@^16.4.5`; `express@^4.21.1`; `helmet@^8.0.0`; `morgan@^1.10.0`.
devDependencies: `@types/cors@^2.8.17`; `@types/express@^5.0.6`; `@types/jest@^29.5.14`; `@types/morgan@^1.9.9`; `@types/node@^24.10.1`; `@types/supertest@^6.0.3`; `jest@^30.1.3`; `nodemon@^3.1.7`; `supertest@^7.0.0`; `ts-jest@^29.4.5`; `ts-node@^10.9.2`; `typescript@^5.8.3`.

###### `crypto/tecdsa/cait_sith_cosmos_compat_hooks`
Name: `@bitcodex/cait-sith-cosmos-compat-hooks`. ECDSA client orchestration.
Direct declared consumers: `embed/bitcodex_attached` (dependencies: `workspace:*`); `crypto/tecdsa/client_example` (dependencies: `workspace:*`).
dependencies: `@bitcodex/api-lib@workspace:*` → `crypto/tecdsa/api_lib` [workspace protocol]; `@bitcodex/bytes@^0.1.2-alpha.1` → `crypto/bytes` [local-name; registry/range declaration]; `@bitcodex/cait-sith-cosmos-compat-wasm@workspace:*` → `crypto/tecdsa/cait_sith_cosmos_compat_wasm` [workspace protocol]; `@bitcodex/bitcodex-types@^0.1.2-alpha.1` → `common/bitcodex_types` [local-name; registry/range declaration]; `@bitcodex/stdlib-js@^0.0.2-rc.44` → `lib/stdlib_js` [local-name; registry/range declaration]; `@bitcodex/tecdsa-interface@0.0.2-alpha.22` → `crypto/tecdsa/tecdsa_interface` [local-name; registry/range declaration]; `classnames@^2.5.1`; `react@^19.2.1`; `react-dom@^19.2.1`.
devDependencies: `@types/node@^24.10.1`; `@types/react@^19.2.7`; `@types/react-dom@^19.2.3`; `eslint-config-next@^16.0.7`; `typescript@^5.8.3`.

###### `crypto/tecdsa/cait_sith_cosmos_compat_wasm`
Name: `@bitcodex/cait-sith-cosmos-compat-wasm`. ECDSA browser WASM wrapper/build.
Direct declared consumers: `embed/bitcodex_attached` (dependencies: `workspace:*`); `crypto/tecdsa/cait_sith_cosmos_compat_hooks` (dependencies: `workspace:*`); `crypto/tecdsa/client_example` (dependencies: `workspace:*`).
dependencies: `wasm-pack@^0.13.1`.
devDependencies: `@types/node@^24.10.1`; `typescript@^5.8.3`.

###### `crypto/tecdsa/client_example`
Name: `client_example`. ECDSA Next.js demo client.
Direct declared consumers: none in existing root-listed manifests.
dependencies: `@bitcodex/api-lib@workspace:*` → `crypto/tecdsa/api_lib` [workspace protocol]; `@bitcodex/cait-sith-cosmos-compat-hooks@workspace:*` → `crypto/tecdsa/cait_sith_cosmos_compat_hooks` [workspace protocol]; `@bitcodex/cait-sith-cosmos-compat-wasm@workspace:*` → `crypto/tecdsa/cait_sith_cosmos_compat_wasm` [workspace protocol]; `classnames@^2.5.1`; `next@^16.1.1`; `react@^19.2.1`; `react-dom@^19.2.1`.
devDependencies: `@types/node@^24.10.1`; `@types/react@^19.2.7`; `@types/react-dom@^19.2.3`; `eslint-config-next@^16.0.7`; `typescript@^5.8.3`.

###### `crypto/tecdsa/api_lib`
Name: `@bitcodex/api-lib`. ECDSA/TSS HTTP client (includes combined v2 keygen).
Direct declared consumers: `embed/bitcodex_attached` (dependencies: `workspace:*`); `crypto/tecdsa/server_example` (dependencies: `workspace:*`); `crypto/tecdsa/cait_sith_cosmos_compat_addon` (dependencies: `workspace:*`); `crypto/tecdsa/cait_sith_cosmos_compat_express` (dependencies: `workspace:*`); `crypto/tecdsa/cait_sith_cosmos_compat_hooks` (dependencies: `workspace:*`); `crypto/tecdsa/client_example` (dependencies: `workspace:*`).
dependencies: `@bitcodex/bitcodex-types@^0.1.2-alpha.1` → `common/bitcodex_types` [local-name; registry/range declaration].
devDependencies: `@types/node@^24.10.1`; `@types/react@^19.2.7`; `@types/react-dom@^19.2.3`; `typescript@^5.8.3`.

###### `crypto/teddsa/teddsa_interface_mock`
Declared workspace, package.json absent. Purpose/dependencies/consumers cannot be established as an installed workspace.

###### `crypto/teddsa/teddsa_wasm_mock`
Declared workspace, package.json absent. Purpose/dependencies/consumers cannot be established as an installed workspace.

###### `crypto/teddsa/teddsa_hooks_mock`
Declared workspace, package.json absent. Purpose/dependencies/consumers cannot be established as an installed workspace.

###### `crypto/teddsa/teddsa_cosmos_compat_addon_mock`
Declared workspace, package.json absent. Purpose/dependencies/consumers cannot be established as an installed workspace.

###### `crypto/teddsa/teddsa_interface`
Name: `@bitcodex/teddsa-interface`. FROST protocol TS interfaces.
Direct declared consumers: `backend/bitcodex_api/server` (dependencies: `workspace:*`); `embed/bitcodex_attached` (dependencies: `workspace:*`); `crypto/teddsa/teddsa_hooks` (dependencies: `workspace:*`); `crypto/teddsa/teddsa_addon` (dependencies: `workspace:*`).
dependencies: `@bitcodex/bytes@^0.1.2-alpha.1` → `crypto/bytes` [local-name; registry/range declaration]; `@bitcodex/bitcodex-types@^0.1.2-alpha.1` → `common/bitcodex_types` [local-name; registry/range declaration].
devDependencies: `@jest/globals@^29.7.0`; `@bitcodex/frost-ed25519-cosmos-compat-wasm@workspace:*` → `crypto/teddsa/frost_ed25519_cosmos_compat_wasm` [workspace protocol]; `@types/jest@^29.5.14`; `@types/node@^24.10.1`; `del-cli@^6.0.0`; `jest@^30.0.0-alpha.6`; `ts-jest@^29.4.0`; `tsc-alias@^1.8.16`; `typescript@^5.8.3`.

###### `crypto/teddsa/teddsa_hooks`
Name: `@bitcodex/teddsa-hooks`. FROST browser keygen/sign orchestration.
Direct declared consumers: `embed/bitcodex_attached` (dependencies: `workspace:*`).
dependencies: `@bitcodex/bytes@^0.1.2-alpha.1` → `crypto/bytes` [local-name; registry/range declaration]; `@bitcodex/frost-ed25519-cosmos-compat-wasm@workspace:*` → `crypto/teddsa/frost_ed25519_cosmos_compat_wasm` [workspace protocol]; `@bitcodex/bitcodex-types@^0.1.2-alpha.1` → `common/bitcodex_types` [local-name; registry/range declaration]; `@bitcodex/stdlib-js@^0.0.2-rc.42` → `lib/stdlib_js` [local-name; registry/range declaration]; `@bitcodex/teddsa-api-lib@workspace:*` → `crypto/teddsa/api_lib` [workspace protocol]; `@bitcodex/teddsa-interface@workspace:*` → `crypto/teddsa/teddsa_interface` [workspace protocol].
devDependencies: `@types/node@^24.10.1`; `typescript@^5.8.3`.

###### `crypto/teddsa/teddsa_addon`
Name: `@bitcodex/teddsa-addon`. FROST native-addon TS/server wrapper.
Direct declared consumers: `e2e_tests` (dependencies: `workspace:*`); `backend/bitcodex_api/server` (dependencies: `workspace:*`).
dependencies: `@bitcodex/bitcodex-types@^0.1.2-alpha.1` → `common/bitcodex_types` [local-name; registry/range declaration]; `@bitcodex/teddsa-interface@workspace:*` → `crypto/teddsa/teddsa_interface` [workspace protocol].
devDependencies: `@types/node@^24.10.1`; `typescript@^5.8.3`.

###### `crypto/teddsa/api_lib`
Name: `@bitcodex/teddsa-api-lib`. Ed25519 HTTP request client.
Direct declared consumers: `crypto/teddsa/teddsa_hooks` (dependencies: `workspace:*`).
dependencies: `@bitcodex/bitcodex-types@^0.1.2-alpha.1` → `common/bitcodex_types` [local-name; registry/range declaration].
devDependencies: `@types/node@^24.10.1`; `typescript@^5.8.3`.

###### `crypto/teddsa/frost_ed25519_cosmos_compat_wasm`
Name: `@bitcodex/frost-ed25519-cosmos-compat-wasm`. FROST browser WASM wrapper/build.
Direct declared consumers: `embed/bitcodex_attached` (dependencies: `workspace:*`); `crypto/teddsa/teddsa_interface` (devDependencies: `workspace:*`); `crypto/teddsa/teddsa_hooks` (dependencies: `workspace:*`).
dependencies: `wasm-pack@^0.13.1`.
devDependencies: `@types/node@^24.10.1`; `typescript@^5.8.3`.

###### `sandbox/sandbox_rialo`
Name: `@bitcodex/sandbox-rialo`. Development playground: sandbox rialo.
Direct declared consumers: none in existing root-listed manifests.
dependencies: `@bitcodex/bitcodex-sdk-svm@workspace:*` → `sdk/bitcodex_sdk_svm` [workspace protocol]; `@rialo/frost@^0.1.0`; `@rialo/ts-cdk@^0.1.0`; `@rialo/wallet-standard@^0.1.0`; `bs58@^6.0.0`; `next@^16.1.1`; `react@^19.0.0`; `react-dom@^19.0.0`.
devDependencies: `@tailwindcss/postcss@^4`; `@types/node@^22.0.0`; `@types/react@^19.0.0`; `@types/react-dom@^19.0.0`; `tailwindcss@^4.1.3`; `typescript@^5.8.3`.

###### `sandbox/sandbox_sol`
Name: `@bitcodex/sandbox-sol`. Development playground: sandbox sol.
Direct declared consumers: none in existing root-listed manifests.
dependencies: `@bitcodex/bitcodex-sdk-svm@workspace:*` → `sdk/bitcodex_sdk_svm` [workspace protocol]; `@solana/spl-token@^0.4.14`; `@solana/wallet-adapter-base@^0.9.23`; `@solana/wallet-adapter-react@^0.15.35`; `@solana/wallet-adapter-react-ui@^0.9.35`; `@solana/web3.js@^1.98.0`; `bs58@^6.0.0`; `next@^16.1.1`; `react@^19.0.0`; `react-dom@^19.0.0`; `zustand@^5.0.0`.
devDependencies: `@tailwindcss/postcss@^4`; `@types/node@^22.0.0`; `@types/react@^19.0.0`; `@types/react-dom@^19.0.0`; `tailwindcss@^4.1.3`; `typescript@^5.8.3`.

##### Cargo workspace graph

###### `crypto/tecdsa/cait_sith_cosmos_compat` — `cait_sith_cosmos_compat`
Threshold ECDSA via Triples
Rust consumers: `crypto/tecdsa/sandbox` (dependencies); `crypto/tecdsa/cait_sith_cosmos_compat_addon/addon` (dependencies); `crypto/tecdsa/cait_sith_cosmos_compat_wasm/wasm` (dependencies). Browser/Node bindings cross the language boundary described above.
- dependencies: `auto_ops` `"0.3.0"`
- dependencies: `ck-meow` `"0.1.0"`
- dependencies: `digest` `"0.10.7"`
- dependencies: `ecdsa` `{"features": ["digest", "hazmat"], "version": "0.16.8"}`
- dependencies: `elliptic-curve` `{"features": ["serde"], "version": "0.13.5"}`
- dependencies: `k256` `{"features": ["sha256", "ecdsa", "serde"], "optional": true, "version": "0.13.4"}`
- dependencies: `magikitten` `"0.2.0"`
- dependencies: `rmp-serde` `"1.1.2"`
- dependencies: `serde` `{"features": ["derive"], "version": "1.0.175"}`
- dependencies: `subtle` `"2.5.0"`
- dependencies: `rand_core` `{"features": ["getrandom"], "version": "0.6.4"}`
- dependencies: `getrandom` `{"features": ["js"], "version": "0.2"}`
- dependencies: `num-bigint` `"0.4"`
- dependencies: `num-traits` `"0.2"`
- dependencies: `thiserror` `"2.0.12"`
- dev-dependencies: `criterion` `"0.4"`
- dev-dependencies: `easy-parallel` `"3.2.0"`
- dev-dependencies: `haisou-chan` `{"git": "https://github.com/cronokirby/haisou-chan", "rev": "d28c46e51acfcb818236caae293f6e56dff41ad2"}`
- dev-dependencies: `structopt` `"0.3.26"`

###### `crypto/tecdsa/sandbox` — `cait_sith_cosmos_compat_sandbox`
Rust ECDSA playground
Rust consumers: none in root Cargo workspace. Browser/Node bindings cross the language boundary described above.
- dependencies: `cait_sith_cosmos_compat` `{"path": "../cait_sith_cosmos_compat"}` → `crypto/tecdsa/cait_sith_cosmos_compat`
- dependencies: `elliptic-curve` `{"features": ["serde"], "version": "0.13.5"}`
- dependencies: `k256` `{"features": ["sha256", "ecdsa", "serde"], "version": "0.13.4"}`
- dependencies: `serde` `{"features": ["derive"], "version": "1.0.175"}`
- dependencies: `subtle` `"2.5.0"`
- dependencies: `rand_core` `{"features": ["getrandom"], "version": "0.6.4"}`
- dependencies: `getrandom` `{"features": ["js"], "version": "0.2"}`

###### `crypto/tecdsa/cait_sith_cosmos_compat_addon/addon` — `addon`
Node N-API bridge to Cait-Sith ECDSA
Rust consumers: none in root Cargo workspace. Browser/Node bindings cross the language boundary described above.
- dependencies: `napi` `{"default-features": false, "features": ["napi4", "serde-json"], "version": "2.12.2"}`
- dependencies: `napi-derive` `"2.12.2"`
- dependencies: `serde` `{"features": ["derive"], "version": "1.0.175"}`
- dependencies: `serde_json` `"1.0"`
- dependencies: `bincode` `"1.3"`
- dependencies: `elliptic-curve` `{"features": ["serde"], "version": "0.13.5"}`
- dependencies: `ecdsa` `{"features": ["digest", "hazmat"], "version": "0.16.8"}`
- dependencies: `k256` `{"features": ["sha256", "ecdsa", "serde"], "version": "0.13.4"}`
- dependencies: `cait_sith_cosmos_compat` `{"member_options": {"features": ["k256"], "workspace": true}, "workspace_definition": {"path": "crypto/tecdsa/cait_sith_cosmos_compat", "version": "=0.0.2-rc.4"}}` → `crypto/tecdsa/cait_sith_cosmos_compat`
- build-dependencies: `napi-build` `"2.0.1"`

###### `crypto/tecdsa/cait_sith_cosmos_compat_wasm/wasm` — `cait_sith_cosmos_compat_wasm`
Browser WASM ECDSA and seed SSS exports
Rust consumers: none in root Cargo workspace. Browser/Node bindings cross the language boundary described above.
- dependencies: `cait_sith_cosmos_compat` `{"member_options": {"features": ["k256"], "workspace": true}, "workspace_definition": {"path": "crypto/tecdsa/cait_sith_cosmos_compat", "version": "=0.0.2-rc.4"}}` → `crypto/tecdsa/cait_sith_cosmos_compat`
- dependencies: `wasm-bindgen` `"0.2.100"`
- dependencies: `k256` `{"features": ["sha256", "ecdsa", "serde"], "version": "0.13.4"}`
- dependencies: `ecdsa` `{"features": ["digest", "hazmat"], "version": "0.16.8"}`
- dependencies: `serde` `{"features": ["derive"], "version": "1.0.175"}`
- dependencies: `serde_json` `"1.0"`
- dependencies: `gloo-utils` `"0.2.0"`
- dependencies: `web-sys` `{"features": ["console"], "version": "0.3.22"}`
- dev-dependencies: `wasm-bindgen-test` `"0.2.45"`
- dev-dependencies: `futures` `"0.1.27"`
- dev-dependencies: `js-sys` `"0.3.22"`
- dev-dependencies: `wasm-bindgen-futures` `"0.3.22"`
- target cfg(debug_assertions) dependencies: `console_error_panic_hook` `"0.1.5"`

###### `crypto/teddsa/frost_core` — `frost_core`
Types and traits to support implementing Flexible Round-Optimized Schnorr Threshold signature schemes (FROST).
Rust consumers: `crypto/teddsa/frost_ed25519_cosmos_compat` (dependencies); `crypto/teddsa/frost_ed25519_cosmos_compat` (dev-dependencies); `crypto/teddsa/frost_rerandomized` (dependencies). Browser/Node bindings cross the language boundary described above.
- dependencies: `byteorder` `{"default-features": false, "version": "1.4"}`
- dependencies: `const-crc32` `{"package": "const-crc32-nostd", "version": "1.2.0"}`
- dependencies: `document-features` `{"member_options": {"workspace": true}, "workspace_definition": "0.2.7"}`
- dependencies: `debugless-unwrap` `"0.0.4"`
- dependencies: `derive-getters` `"0.5.0"`
- dependencies: `hex` `{"member_options": {"workspace": true}, "workspace_definition": {"default-features": false, "features": ["alloc"], "version": "0.4.3"}}`
- dependencies: `postcard` `{"features": ["alloc"], "optional": true, "version": "1.0.0"}`
- dependencies: `rand_core` `{"default-features": false, "version": "0.6"}`
- dependencies: `serde` `{"default-features": false, "features": ["derive"], "optional": true, "version": "1.0.160"}`
- dependencies: `serdect` `{"optional": true, "version": "0.2.0"}`
- dependencies: `thiserror` `{"default-features": false, "version": "2.0.3"}`
- dependencies: `visibility` `"0.1.0"`
- dependencies: `zeroize` `{"default-features": false, "features": ["derive"], "version": "1.5.4"}`
- dependencies: `itertools` `{"default-features": false, "version": "0.14.0"}`
- dependencies: `proptest` `{"optional": true, "version": "1.0"}`
- dependencies: `serde_json` `{"optional": true, "version": "1.0"}`
- dependencies: `criterion` `{"member_options": {"optional": true, "workspace": true}, "workspace_definition": "0.6"}`
- dev-dependencies: `criterion` `{"member_options": {"workspace": true}, "workspace_definition": "0.6"}`
- dev-dependencies: `lazy_static` `{"member_options": {"workspace": true}, "workspace_definition": "1.4"}`
- dev-dependencies: `proptest` `{"member_options": {"workspace": true}, "workspace_definition": "1.0"}`
- dev-dependencies: `rand` `{"member_options": {"workspace": true}, "workspace_definition": "0.8"}`
- dev-dependencies: `rand_chacha` `{"member_options": {"workspace": true}, "workspace_definition": "0.3"}`
- dev-dependencies: `serde_json` `{"member_options": {"workspace": true}, "workspace_definition": "1.0"}`

###### `crypto/teddsa/frost_ed25519_cosmos_compat` — `frost_ed25519_cosmos_compat`
A Schnorr signature scheme over Ed25519 that supports FROST.
Rust consumers: `crypto/teddsa/teddsa_addon/addon` (dependencies); `crypto/teddsa/frost_ed25519_cosmos_compat_wasm/wasm` (dependencies). Browser/Node bindings cross the language boundary described above.
- dependencies: `frost_rerandomized` `{"member_options": {"workspace": true}, "workspace_definition": {"default-features": false, "path": "crypto/teddsa/frost_rerandomized", "version": "2.2.0"}}` → `crypto/teddsa/frost_rerandomized`
- dependencies: `frost_core` `{"member_options": {"workspace": true}, "workspace_definition": {"default-features": false, "path": "crypto/teddsa/frost_core", "version": "2.2.0"}}` → `crypto/teddsa/frost_core`
- dependencies: `curve25519-dalek` `{"features": ["rand_core"], "version": "=4.1.3"}`
- dependencies: `document-features` `{"member_options": {"workspace": true}, "workspace_definition": "0.2.7"}`
- dependencies: `rand_core` `{"member_options": {"workspace": true}, "workspace_definition": "0.6"}`
- dependencies: `serde` `{"member_options": {"optional": true, "workspace": true}, "workspace_definition": {"default-features": false, "features": ["derive", "alloc"], "version": "1.0"}}`
- dependencies: `sha2` `{"default-features": false, "version": "0.10.2"}`
- dev-dependencies: `frost_core` `{"member_options": {"features": ["test-impl"], "workspace": true}, "workspace_definition": {"default-features": false, "path": "crypto/teddsa/frost_core", "version": "2.2.0"}}` → `crypto/teddsa/frost_core`
- dev-dependencies: `frost_rerandomized` `{"member_options": {"features": ["test-impl"], "workspace": true}, "workspace_definition": {"default-features": false, "path": "crypto/teddsa/frost_rerandomized", "version": "2.2.0"}}` → `crypto/teddsa/frost_rerandomized`
- dev-dependencies: `criterion` `{"member_options": {"workspace": true}, "workspace_definition": "0.6"}`
- dev-dependencies: `ed25519-dalek` `"2.1.0"`
- dev-dependencies: `insta` `{"member_options": {"workspace": true}, "workspace_definition": {"features": ["yaml"], "version": "1.31.0"}}`
- dev-dependencies: `hex` `{"member_options": {"workspace": true}, "workspace_definition": {"default-features": false, "features": ["alloc"], "version": "0.4.3"}}`
- dev-dependencies: `lazy_static` `{"member_options": {"workspace": true}, "workspace_definition": "1.4"}`
- dev-dependencies: `proptest` `{"member_options": {"workspace": true}, "workspace_definition": "1.0"}`
- dev-dependencies: `rand` `{"member_options": {"workspace": true}, "workspace_definition": "0.8"}`
- dev-dependencies: `rand_chacha` `{"member_options": {"workspace": true}, "workspace_definition": "0.3"}`
- dev-dependencies: `serde_json` `{"member_options": {"workspace": true}, "workspace_definition": "1.0"}`

###### `crypto/teddsa/frost_rerandomized` — `frost_rerandomized`
Types and traits to support implementing a re-randomized variant of Flexible Round-Optimized Schnorr Threshold signature schemes (FROST).
Rust consumers: `crypto/teddsa/frost_ed25519_cosmos_compat` (dependencies); `crypto/teddsa/frost_ed25519_cosmos_compat` (dev-dependencies). Browser/Node bindings cross the language boundary described above.
- dependencies: `derive-getters` `"0.5.0"`
- dependencies: `document-features` `{"member_options": {"workspace": true}, "workspace_definition": "0.2.7"}`
- dependencies: `frost_core` `{"member_options": {"features": ["internals"], "workspace": true}, "workspace_definition": {"default-features": false, "path": "crypto/teddsa/frost_core", "version": "2.2.0"}}` → `crypto/teddsa/frost_core`
- dependencies: `hex` `{"member_options": {"workspace": true}, "workspace_definition": {"default-features": false, "features": ["alloc"], "version": "0.4.3"}}`
- dependencies: `rand_core` `{"member_options": {"workspace": true}, "workspace_definition": "0.6"}`

###### `crypto/teddsa/teddsa_addon/addon` — `teddsa_addon`
Node N-API FROST bridge
Rust consumers: none in root Cargo workspace. Browser/Node bindings cross the language boundary described above.
- dependencies: `napi` `{"default-features": false, "features": ["napi4", "serde-json"], "version": "2.12.2"}`
- dependencies: `napi-derive` `"2.12.2"`
- dependencies: `serde` `{"features": ["derive"], "version": "1.0"}`
- dependencies: `serde_json` `"1.0"`
- dependencies: `frost_ed25519_cosmos_compat` `{"member_options": {"features": ["serialization"], "workspace": true}, "workspace_definition": {"default-features": false, "path": "crypto/teddsa/frost_ed25519_cosmos_compat", "version": "2.2.0"}}` → `crypto/teddsa/frost_ed25519_cosmos_compat`
- dependencies: `rand_core` `{"member_options": {"features": ["getrandom"], "workspace": true}, "workspace_definition": "0.6"}`
- build-dependencies: `napi-build` `"2.0.1"`

###### `crypto/teddsa/frost_ed25519_cosmos_compat_wasm/wasm` — `frost_ed25519_cosmos_compat_wasm`
Browser FROST keygen/sign/SSS WASM exports
Rust consumers: none in root Cargo workspace. Browser/Node bindings cross the language boundary described above.
- dependencies: `frost_ed25519_cosmos_compat` `{"features": ["serde"], "path": "../../frost_ed25519_cosmos_compat"}` → `crypto/teddsa/frost_ed25519_cosmos_compat`
- dependencies: `wasm-bindgen` `"0.2.100"`
- dependencies: `curve25519-dalek` `{"features": ["rand_core"], "version": "=4.1.3"}`
- dependencies: `serde` `{"features": ["derive"], "version": "1.0"}`
- dependencies: `serde_json` `"1.0"`
- dependencies: `serde-wasm-bindgen` `"0.6"`
- dependencies: `rand_core` `{"features": ["getrandom"], "version": "0.6"}`
- dependencies: `getrandom` `{"features": ["js"], "version": "0.2"}`
- dependencies: `hex` `{"member_options": {"workspace": true}, "workspace_definition": {"default-features": false, "features": ["alloc"], "version": "0.4.3"}}`
- dependencies: `sha2` `{"default-features": false, "version": "0.10.2"}`
- dependencies: `web-sys` `{"features": ["console"], "version": "0.3.22"}`
- dev-dependencies: `wasm-bindgen-test` `"0.2.45"`
- dev-dependencies: `futures` `"0.1.27"`
- dev-dependencies: `js-sys` `"0.3.22"`
- dev-dependencies: `wasm-bindgen-futures` `"0.3.22"`
- target cfg(debug_assertions) dependencies: `console_error_panic_hook` `"0.1.5"`

###### `key_share_node/key_share_node_2/core` — `key-share-node-core`
Rust KSN prototype core types
Rust consumers: `key_share_node/key_share_node_2/server` (dependencies). Browser/Node bindings cross the language boundary described above.
- dependencies: `hex` `"0.4.3"`
- dependencies: `serde` `{"features": ["derive"], "version": "1.0.219"}`
- dependencies: `thiserror` `"2.0.12"`

###### `key_share_node/key_share_node_2/pg_interface` — `ksn-pg-interface`
Rust Postgres interface (not linked by current Rust server)
Rust consumers: none in root Cargo workspace. Browser/Node bindings cross the language boundary described above.
- dependencies: `tokio` `{"features": ["full"], "version": "1.0"}`
- dependencies: `tokio-postgres` `"0.7"`
- dependencies: `postgres-types` `{"features": ["derive", "with-uuid-1", "with-chrono-0_4", "with-serde_json-1"], "version": "0.2"}`
- dependencies: `serde` `{"features": ["derive"], "version": "1.0"}`
- dependencies: `serde_json` `"1.0"`
- dependencies: `uuid` `{"features": ["v4", "serde"], "version": "1.0"}`
- dependencies: `chrono` `{"features": ["serde"], "version": "0.4"}`
- dependencies: `thiserror` `"1.0"`
- dependencies: `anyhow` `"1.0"`

###### `key_share_node/key_share_node_2/server` — `key-share-node-server`
Axum ECDHE prototype; not TS KSN replacement
Rust consumers: none in root Cargo workspace. Browser/Node bindings cross the language boundary described above.
- dependencies: `axum` `"0.6.20"`
- dependencies: `tokio` `{"features": ["full"], "version": "1.32"}`
- dependencies: `elliptic-curve` `{"features": ["ecdh", "sec1"], "version": "0.12.3"}`
- dependencies: `k256` `{"features": ["ecdh"], "version": "0.11.6"}`
- dependencies: `rand` `"0.8.5"`
- dependencies: `serde` `{"features": ["derive"], "version": "1.0.190"}`
- dependencies: `serde_json` `"1.0.108"`
- dependencies: `tower` `"0.4.13"`
- dependencies: `tower-http` `{"features": ["cors"], "version": "0.4.4"}`
- dependencies: `hex` `"0.4.3"`
- dependencies: `once_cell` `"1.19.0"`
- dependencies: `base64ct` `"=1.6.0"`
- dependencies: `key-share-node-core` `{"path": "../core"}` → `key_share_node/key_share_node_2/core`
- dev-dependencies: `tokio-test` `"0.4.3"`
- dev-dependencies: `hyper` `{"features": ["full"], "version": "0.14"}`
- dev-dependencies: `tower` `{"features": ["util"], "version": "0.4"}`

##### Complete lexical SVM/Solana location index
All rg-visible files outside specs/lockfiles/generated dependency caches whose path or text matches svm, solana or wallet-standard (case-insensitive). Includes tests/docs/assets as candidates; not every candidate should be copied. Line numbers list every matching line. Path-only matches are marked. Binary assets are included by name.

- `AGENTS.md`: 25, 36, 37, 143
- `README.md`: 42
- `apps/demo_web/package.json`: 27
- `apps/demo_web/src/components/bitcodex_provider/bitcodex_provider.tsx`: 13
- `apps/demo_web/src/components/preview_panel/preview_panel.tsx`: 10, 24, 25, 31, 32, 82, 110
- `apps/demo_web/src/components/widgets/account_widget/account_widget.tsx`: 2, 39, 139
- `apps/demo_web/src/components/widgets/address_widget/address_row.tsx`: 13, 75
- `apps/demo_web/src/components/widgets/address_widget/address_widget.tsx`: 3, 19, 64, 65, 66
- `apps/demo_web/src/components/widgets/address_widget/view_chains_button.tsx`: 5, 17
- `apps/demo_web/src/components/widgets/solana_offchain_sign_widget/solana_offchain_sign_widget.tsx`: 1, 2, 7, 8, 11, 12, 16, 17, 23, 26, 31, 32
- `apps/demo_web/src/components/widgets/solana_onchain_sign_widget/solana_onchain_sign_widget.tsx`: 1, 2, 10, 16, 18, 19, 22, 23, 26, 27, 30, 34, 42, 49, 57, 60, 63, 67, 68
- `apps/demo_web/src/hooks/use_get_chain_infos.ts`: 22
- `apps/demo_web/src/hooks/wallet.ts`: 4, 5, 14, 21, 33, 34, 63, 66, 86, 89, 92, 96, 98, 102, 103, 106, 107, 112
- `apps/docs_web/docs/v0/api-reference/api-overview.md`: 271, 759, 761, 763
- `apps/docs_web/docs/v0/architecture.md`: 56, 89, 101, 103, 104, 164, 167, 169, 170, 172, 175, 176, 179, 182, 183
- `apps/docs_web/docs/v0/concepts/threshold-ecdsa.md`: 136
- `apps/docs_web/docs/v0/concepts/threshold-eddsa.md`: 8, 10, 11, 17, 30, 91, 123, 204, 206, 208, 218
- `apps/docs_web/docs/v0/getting-started/quick-start.md`: 8, 27, 28, 102, 104, 107, 113, 115, 116, 118, 122, 125, 128, 129, 132, 145, 150, 157, 159, 162, 172, 173, 178, 237, 248
- `apps/docs_web/docs/v0/getting-started/starter-templates.md`: 10, 16, 18
- `apps/docs_web/docs/v0/getting-started/supported-chains.md`: 8, 20, 30, 41, 43, 47, 48, 50, 53, 55, 57, 61
- `apps/docs_web/docs/v0/index.md`: 83, 107, 109, 111, 137
- `apps/docs_web/docs/v0/lifecycle.md`: 423, 425, 428, 434, 436, 437, 439, 444, 447, 450, 451, 454, 464
- `apps/docs_web/docs/v0/sdk-usage/mobile/react-native-integration.md`: 18, 80, 81, 341, 346, 349, 351, 353, 354, 360, 361, 362, 367, 368, 483, 484
- `apps/docs_web/docs/v0/sdk-usage/react-integration.md`: 13, 22, 37, 54, 172, 175, 177, 178, 180, 182, 188, 191, 297, 303, 316, 329, 364
- `apps/docs_web/docs/v0/sdk-usage/rialo-frost-kit-integration.md`: 14, 20, 38, 39, 43, 46, 54, 55, 71, 108, 111, 120, 121, 146, 328, 329
- `apps/docs_web/docs/v0/sdk-usage/sdk-overview.md`: 26, 27, 65, 68, 70, 72, 75, 78, 79, 131
- `apps/docs_web/docs/v0/sdk-usage/solana-integration.md`: 2, 6, 8, 12, 18, 24, 26, 27, 29, 35, 56, 58, 144, 147, 148, 150, 151, 152, 153, 154, 156, 157, 159, 160, 161, 162, 165, 166, 170, 172, 177, 178, 189, 190, 191, 197, 198, 205, 229, 230
- `apps/docs_web/docs/v0/sdk-usage/solana-wallet-adapter-integration.md`: 2, 6, 8, 9, 10, 14, 20, 25, 30, 33, 34, 36, 37, 38, 39, 40, 42, 43, 45, 46, 47, 48, 51, 52, 53, 57, 59, 67, 68, 76, 77, 84, 85, 86, 88, 97, 116, 120, 156, 157, 158, 159, 163
- `apps/user_dashboard/package.json`: 23, 26
- `apps/user_dashboard/src/app/export_private_key/page.tsx`: 15, 149, 150, 397, 404, 412, 418
- `apps/user_dashboard/src/app/transaction_history/constant.ts`: 3, 14
- `apps/user_dashboard/src/components/deposit_modal/deposit_modal.tsx`: 26, 33, 74, 75, 86, 92, 115, 116, 149, 150
- `apps/user_dashboard/src/components/bitcodex_provider/bitcodex_provider.tsx`: 15, 26
- `apps/user_dashboard/src/components/show_hide_chains_modal/components/filters.tsx`: 9
- `apps/user_dashboard/src/components/show_hide_chains_modal/show_hide_chains_modal.tsx`: 100, 102, 122, 123, 286, 287
- `apps/user_dashboard/src/components/widgets/account_widget/account_widget.tsx`: 4, 15, 28, 63, 64, 65, 68
- `apps/user_dashboard/src/fetch/spl_token_balances.ts`: 1
- `apps/user_dashboard/src/hooks/queries/use_addresses.ts`: 8, 42, 43, 46, 48, 51, 53, 97, 106, 107
- `apps/user_dashboard/src/hooks/queries/use_balances.ts`: 2, 8, 103, 488, 490, 493, 494, 498, 499, 505, 509, 514, 516, 522, 523, 527, 533, 549, 604, 615, 677, 679, 681, 688, 690, 716, 725, 737, 744, 753, 824
- `apps/user_dashboard/src/hooks/use_sign_out.ts`: 4, 14, 26, 29
- `apps/user_dashboard/src/state/chains.ts`: 14, 20
- `apps/user_dashboard/src/types/chain.ts`: 55, 72, 77, 88
- `apps/user_dashboard/src/utils/chain.ts`: 9, 10, 24, 35, 38, 39, 92, 93
- `apps/user_dashboard/src/utils/sdk.ts`: 3, 4, 6, 7, 10, 18, 19, 20, 21, 25, 33, 46, 47, 48, 49, 50
- `backend/bitcodex_api/server/src/api/tss/sign_ed25519/index.test.ts`: 521
- `crypto/teddsa/teddsa_addon/src/tests/ed25519_sign.test.ts`: 57
- `e2e_tests/src/scripts/test_seed_export.ts`: 12, 159, 165, 168, 171
- `embed/bitcodex_attached/package.json`: 50, 51, 52
- `embed/bitcodex_attached/src/analytics/events.ts`: 10, 72, 74, 107
- `embed/bitcodex_attached/src/analytics/types.ts`: 6, 11, 53
- `embed/bitcodex_attached/src/components/modal/modal_dialog.tsx`: 8, 94, 96
- `embed/bitcodex_attached/src/components/modal_variants/svm/all_tx_sig/make_all_tx_sig_modal.tsx`: 4, 7, 17, 63
- `embed/bitcodex_attached/src/components/modal_variants/svm/all_tx_sig/svm_all_tx_signature_content.tsx`: 3, 15, 16, 19
- `embed/bitcodex_attached/src/components/modal_variants/svm/all_tx_sig/use_all_tx_sig_modal.tsx`: 1, 6, 7, 12, 20
- `embed/bitcodex_attached/src/components/modal_variants/svm/common/signature_content.module.scss`: path match
- `embed/bitcodex_attached/src/components/modal_variants/svm/common/summary.module.scss`: path match
- `embed/bitcodex_attached/src/components/modal_variants/svm/make_signature_svm_modal.tsx`: 1, 8, 11, 14
- `embed/bitcodex_attached/src/components/modal_variants/svm/message_sig/make_message_sig_modal.tsx`: 4, 7, 13, 17, 25, 91, 93
- `embed/bitcodex_attached/src/components/modal_variants/svm/message_sig/siws_sig/make_siws_signature_content.tsx`: 4, 13, 17, 18, 22, 23, 27, 99, 100, 105
- `embed/bitcodex_attached/src/components/modal_variants/svm/message_sig/siws_sig/siws_sig_title_badge/index.tsx`: 4, 9, 11
- `embed/bitcodex_attached/src/components/modal_variants/svm/message_sig/siws_sig/siws_sig_title_badge/styles.module.scss`: 11
- `embed/bitcodex_attached/src/components/modal_variants/svm/message_sig/svm_message_signature_content.tsx`: 4, 10, 18, 19, 22, 23, 102
- `embed/bitcodex_attached/src/components/modal_variants/svm/message_sig/svm_message_summary.tsx`: 3, 10, 11, 14
- `embed/bitcodex_attached/src/components/modal_variants/svm/message_sig/use_message_sig_modal.tsx`: 1, 5, 6, 11, 19
- `embed/bitcodex_attached/src/components/modal_variants/svm/siws_message.ts`: 2, 3, 28, 54, 56, 197, 198, 201
- `embed/bitcodex_attached/src/components/modal_variants/svm/tx_sig/make_tx_sig_modal.tsx`: 4, 7, 8, 20, 45, 56, 74, 84
- `embed/bitcodex_attached/src/components/modal_variants/svm/tx_sig/msg/instructions.module.scss`: path match
- `embed/bitcodex_attached/src/components/modal_variants/svm/tx_sig/msg/instructions.tsx`: 15, 24, 84
- `embed/bitcodex_attached/src/components/modal_variants/svm/tx_sig/msg/staking/constants.ts`: 1
- `embed/bitcodex_attached/src/components/modal_variants/svm/tx_sig/msg/staking/staking_instruction.module.scss`: path match
- `embed/bitcodex_attached/src/components/modal_variants/svm/tx_sig/msg/staking/staking_instruction.tsx`: 9, 11, 181, 220, 257
- `embed/bitcodex_attached/src/components/modal_variants/svm/tx_sig/msg/staking/staking_operation_instruction.tsx`: 6
- `embed/bitcodex_attached/src/components/modal_variants/svm/tx_sig/msg/transfer/token_transfer.tsx`: 11, 48
- `embed/bitcodex_attached/src/components/modal_variants/svm/tx_sig/msg/transfer/transfer.tsx`: 7, 20, 27, 42
- `embed/bitcodex_attached/src/components/modal_variants/svm/tx_sig/msg/unknown/unknown.tsx`: 6
- `embed/bitcodex_attached/src/components/modal_variants/svm/tx_sig/svm_tx_fee.module.scss`: path match
- `embed/bitcodex_attached/src/components/modal_variants/svm/tx_sig/svm_tx_fee.tsx`: 4, 5, 17, 22
- `embed/bitcodex_attached/src/components/modal_variants/svm/tx_sig/svm_tx_signature_content.tsx`: 4, 10, 16, 19, 20, 26, 110
- `embed/bitcodex_attached/src/components/modal_variants/svm/tx_sig/svm_tx_summary.module.scss`: path match
- `embed/bitcodex_attached/src/components/modal_variants/svm/tx_sig/svm_tx_summary.tsx`: 4, 9, 14, 16, 17, 23
- `embed/bitcodex_attached/src/components/modal_variants/svm/tx_sig/use_parse_tx.ts`: 7
- `embed/bitcodex_attached/src/components/modal_variants/svm/tx_sig/use_tx_sig_modal.tsx`: 1, 5, 6, 11, 19
- `embed/bitcodex_attached/src/components/modal_variants/svm/use_svm_signature_base.tsx`: 2, 19, 45, 66, 90, 97, 99, 112, 116, 125, 129
- `embed/bitcodex_attached/src/constants/urls.ts`: 4
- `embed/bitcodex_attached/src/requests/chain_infos.ts`: 46, 48, 49, 50, 51, 58, 59
- `embed/bitcodex_attached/src/tx-parsers/svm/index.ts`: path match
- `embed/bitcodex_attached/src/tx-parsers/svm/instruction.ts`: 4, 5, 6, 12, 42
- `embed/bitcodex_attached/src/tx-parsers/svm/parser.ts`: 1
- `embed/bitcodex_attached/src/tx-parsers/svm/types.ts`: path match
- `embed/bitcodex_attached/src/web3/svm/queries/index.ts`: path match
- `embed/bitcodex_attached/src/web3/svm/queries/use_get_token_metadata.ts`: 18, 25, 28, 62, 63, 133, 137, 139, 140
- `embed/bitcodex_attached/src/web3/svm/use_calculate_fee.ts`: 5
- `examples/multi_ecosystem_react/package.json`: 21, 22
- `examples/multi_ecosystem_react/src/App.tsx`: 7, 14, 26
- `examples/multi_ecosystem_react/src/components/StatusBar.tsx`: 3, 9, 14, 43, 45, 46, 50
- `examples/multi_ecosystem_react/src/components/SvmBalance.tsx`: 1, 2, 5, 7, 8, 9, 12, 13, 15, 19
- `examples/multi_ecosystem_react/src/components/SvmTransactionForm.tsx`: 2, 3, 9, 29, 49, 50, 51, 73, 78, 87, 102, 127, 145, 151
- `examples/multi_ecosystem_react/src/constants/chains.ts`: 2, 64
- `examples/svm_nextjs/.env.example`: path match
- `examples/svm_nextjs/app/globals.css`: path match
- `examples/svm_nextjs/app/layout.tsx`: 16, 17
- `examples/svm_nextjs/app/page.tsx`: path match
- `examples/svm_nextjs/components/AccountInfo.tsx`: 4, 5, 19, 151, 155
- `examples/svm_nextjs/components/App.tsx`: path match
- `examples/svm_nextjs/components/Button.tsx`: path match
- `examples/svm_nextjs/components/ConnectedView.tsx`: path match
- `examples/svm_nextjs/components/LoginView.tsx`: 4, 12, 33
- `examples/svm_nextjs/components/Providers.tsx`: 16
- `examples/svm_nextjs/components/TransactionForm.tsx`: 4, 5, 34, 55, 78, 83, 107
- `examples/svm_nextjs/hooks/useConnection.ts`: 1
- `examples/svm_nextjs/next.config.ts`: path match
- `examples/svm_nextjs/package.json`: 2, 14, 15
- `examples/svm_nextjs/postcss.config.mjs`: path match
- `examples/svm_nextjs/public/icon.svg`: path match
- `examples/svm_nextjs/public/logo.svg`: path match
- `examples/svm_nextjs/tsconfig.json`: path match
- `internals/ci/src/cmds/build_sdk.ts`: 14
- `internals/ci/src/cmds/typecheck/index.ts`: 16, 40
- `internals/ci/src/paths.ts`: 41, 153, 155, 168, 176
- `lerna.json`: 33
- `package.json`: 18, 25
- `sandbox/sandbox_react_native/app/index.tsx`: 7, 8, 9, 24, 68, 506, 508, 509, 516, 517, 518, 520, 521, 523, 524, 527, 528, 529, 531, 532, 534, 535, 541, 542, 554, 556, 571, 579, 581, 587, 594, 600, 615, 622, 624, 629, 635, 642, 657, 667, 669, 682, 687, 689, 690, 698, 705, 720, 727, 733, 738, 750, 772, 784, 799, 812
- `sandbox/sandbox_react_native/package.json`: 22, 27
- `sandbox/sandbox_rialo/.env.example`: 4, 6
- `sandbox/sandbox_rialo/package.json`: 13, 16
- `sandbox/sandbox_rialo/src/components/Providers.tsx`: 4, 7, 16, 17, 42
- `sandbox/sandbox_simple_host/src/components/widgets/address_widget/view_chains_modal.tsx`: 13
- `sandbox/sandbox_sol/.env.example`: 4, 6
- `sandbox/sandbox_sol/package.json`: 13, 14, 15, 16, 17, 18
- `sandbox/sandbox_sol/src/app/globals.css`: 18, 19, 20
- `sandbox/sandbox_sol/src/app/layout.tsx`: 17
- `sandbox/sandbox_sol/src/app/page.tsx`: 5, 15
- `sandbox/sandbox_sol/src/app/wallet-adapter/page.tsx`: 3, 7, 11, 14, 42
- `sandbox/sandbox_sol/src/components/AccountInfo.tsx`: 3, 210, 214
- `sandbox/sandbox_sol/src/components/LoginView.tsx`: 27
- `sandbox/sandbox_sol/src/components/WalletAdapterProvider.tsx`: 6, 7, 8, 11, 22
- `sandbox/sandbox_sol/src/components/sign_message_widget.tsx`: 10, 11, 17, 27, 47
- `sandbox/sandbox_sol/src/components/sign_transaction_widget.tsx`: 10, 20, 29, 67, 81, 99, 146, 179, 249, 253
- `sandbox/sandbox_sol/src/components/siws_widget.tsx`: 7, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 26, 27, 28, 30, 31, 32, 33, 36, 37, 38, 45, 80, 85, 101, 112, 113, 116, 118, 119, 148, 151, 235, 243
- `sandbox/sandbox_sol/src/components/spl_token_transfer_widget.tsx`: 7, 8, 27, 36, 97, 114, 174, 234, 292, 296
- `sandbox/sandbox_sol/src/components/swap_demo_widget.tsx`: 8, 52, 60, 124
- `sandbox/sandbox_sol/src/components/test_transactions_widget.tsx`: 15, 89, 179, 244, 255, 341, 456, 511, 538, 564, 592, 620, 825, 830
- `sandbox/sandbox_sol/src/hooks/use_bitcodex_svm.ts`: 4, 7, 9, 10, 11, 12, 13, 15, 16, 17, 18, 19, 20, 25, 26, 28, 29, 30, 31, 34, 35, 36, 40, 43, 48, 68, 71, 74, 76, 80, 81, 84, 87, 88, 90, 92, 98, 100, 102, 105, 122, 127, 147, 148, 149, 152, 153, 154, 156, 159, 168, 171, 175, 178, 185, 189, 194, 201, 205
- `sandbox/sandbox_sol/src/lib/connection.ts`: 1, 3, 6
- `sandbox/sandbox_sol/src/store/sdk.ts`: 2, 7, 12, 19, 24
- `sdk/bitcodex_cosmos_kit/src/constant.ts`: 5
- `sdk/bitcodex_sdk_core/src/types/modal/make_sig/index.ts`: 12, 13, 14, 15, 20, 34, 36, 53, 56, 71, 90, 93
- `sdk/bitcodex_sdk_core/src/types/modal/make_sig/svm.ts`: 3, 4, 5, 8, 9, 10, 11, 13, 14, 16, 19, 20, 22, 25, 26, 28, 31, 35, 46, 57, 66
- `sdk/bitcodex_sdk_core/src/types/bitcodex_wallet.ts`: 31
- `sdk/bitcodex_sdk_core_react_native/README.md`: 60
- `sdk/bitcodex_sdk_core_react_native/src/index.ts`: 8, 10
- `sdk/bitcodex_sdk_react/package.json`: 23, 24, 25, 26, 56
- `sdk/bitcodex_sdk_react/scripts/build.ts`: 69, 80
- `sdk/bitcodex_sdk_react/src/index.ts`: 9
- `sdk/bitcodex_sdk_react/src/provider.tsx`: 15, 16, 42, 75, 167, 169, 170, 174, 175, 181, 184, 186, 192, 203, 262, 263, 264, 265, 266, 268, 269, 271, 274, 275, 276, 281, 283, 286, 289, 294
- `sdk/bitcodex_sdk_react/src/svm/context.ts`: 1, 4, 5, 11
- `sdk/bitcodex_sdk_react/src/svm/index.ts`: 1, 2
- `sdk/bitcodex_sdk_react/src/svm/use_bitcodex_svm.ts`: 1, 4, 6, 7, 13, 14, 17
- `sdk/bitcodex_sdk_react/src/types.ts`: 15, 22
- `sdk/bitcodex_sdk_svm/README.md`: 1
- `sdk/bitcodex_sdk_svm/jest.config.js`: path match
- `sdk/bitcodex_sdk_svm/package.json`: 2, 22, 23, 30, 41, 42, 43, 44, 45
- `sdk/bitcodex_sdk_svm/scripts/build.ts`: 100
- `sdk/bitcodex_sdk_svm/src/constructor.ts`: 2, 4, 7, 8, 9, 10, 13, 14, 16, 29, 30, 33, 45, 60, 73
- `sdk/bitcodex_sdk_svm/src/emitter.ts`: 4, 5, 6, 9, 10, 12, 17, 19, 24, 26, 31, 33, 38, 40, 45, 47
- `sdk/bitcodex_sdk_svm/src/errors/index.ts`: 1, 2, 26, 27
- `sdk/bitcodex_sdk_svm/src/index.ts`: 1, 4, 5, 7, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 25, 32, 34
- `sdk/bitcodex_sdk_svm/src/methods/connect.ts`: 1, 4, 5, 6, 8, 18, 41
- `sdk/bitcodex_sdk_svm/src/methods/disconnect.ts`: 2, 3, 4, 6, 7
- `sdk/bitcodex_sdk_svm/src/methods/make_signature.ts`: 2, 5, 8, 10, 11, 12, 14, 20, 24, 30, 31, 32, 38, 39, 63, 64, 83, 125, 142, 158, 159, 160, 161, 162, 171, 187, 193, 202, 207, 208, 236, 246, 248
- `sdk/bitcodex_sdk_svm/src/methods/send_transaction.ts`: 7, 9, 11, 14, 20, 21
- `sdk/bitcodex_sdk_svm/src/methods/sign_all_transactions.ts`: 1, 5, 6, 8, 12, 14, 15, 26, 27
- `sdk/bitcodex_sdk_svm/src/methods/sign_and_send_all_transactions.ts`: 7, 9, 11, 14, 20, 21
- `sdk/bitcodex_sdk_svm/src/methods/sign_and_send_transaction.ts`: 7, 9, 11, 14, 20, 21
- `sdk/bitcodex_sdk_svm/src/methods/sign_message.ts`: 3, 4, 6, 9, 13, 14, 25, 26
- `sdk/bitcodex_sdk_svm/src/methods/sign_transaction.ts`: 1, 5, 6, 8, 12, 14, 15, 26, 27
- `sdk/bitcodex_sdk_svm/src/private/lazy_init.ts`: 2, 4, 6, 7, 8, 11, 12, 26, 39
- `sdk/bitcodex_sdk_svm/src/static/init.ts`: 4, 5, 7, 8, 9, 12, 13, 14, 16, 18, 19, 25, 26, 37
- `sdk/bitcodex_sdk_svm/src/svm_wallet.ts`: 1, 11, 13, 15, 26
- `sdk/bitcodex_sdk_svm/src/tests/base.test.ts`: 1, 8, 9, 10, 12, 16, 18, 32, 34, 47, 49, 61, 63, 76, 78, 95, 97, 99, 102, 109, 111, 115
- `sdk/bitcodex_sdk_svm/src/tests/errors.test.ts`: 2, 3, 4, 6, 8, 9, 14, 15, 17, 21, 22, 31, 32
- `sdk/bitcodex_sdk_svm/src/tests/mock/index.ts`: 66, 79, 82, 95, 98
- `sdk/bitcodex_sdk_svm/src/tests/wallet-standard.test.ts`: 2, 5, 6, 11, 13, 36, 42, 57, 62, 64, 164, 305, 310, 312
- `sdk/bitcodex_sdk_svm/src/types/event.ts`: 1, 3, 10, 12, 13
- `sdk/bitcodex_sdk_svm/src/types/index.ts`: 2, 3, 4, 7, 8, 11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25
- `sdk/bitcodex_sdk_svm/src/types/internal.ts`: 1, 2, 4, 9, 12, 13, 15
- `sdk/bitcodex_sdk_svm/src/types/sign.ts`: 1, 3, 8, 13, 18, 19, 20, 21, 23, 28, 33, 38, 39, 40, 41
- `sdk/bitcodex_sdk_svm/src/types/svm_wallet.ts`: 13, 15, 16, 19, 20, 22, 28, 32, 35, 36, 38, 39, 42, 43, 45, 77, 79, 81, 83
- `sdk/bitcodex_sdk_svm/src/wallet-standard/account.ts`: 1, 3
- `sdk/bitcodex_sdk_svm/src/wallet-standard/chains.ts`: 1, 16, 17
- `sdk/bitcodex_sdk_svm/src/wallet-standard/features.ts`: 1, 2, 6, 21, 40, 70
- `sdk/bitcodex_sdk_svm/src/wallet-standard/icon.ts`: 1
- `sdk/bitcodex_sdk_svm/src/wallet-standard/index.ts`: 1
- `sdk/bitcodex_sdk_svm/src/wallet-standard/register.ts`: 1, 5, 10, 14
- `sdk/bitcodex_sdk_svm/src/wallet-standard/sign-in.ts`: 1, 3, 5, 8, 15, 68, 71, 96
- `sdk/bitcodex_sdk_svm/src/wallet-standard/wallet.ts`: 6, 11, 13, 22, 27, 90, 157
- `sdk/bitcodex_sdk_svm/tsconfig.json`: 26
- `ui/bitcodex_common_ui/src/icons/solana_circle_icon.tsx`: 5, 11, 12, 19
- `ui/bitcodex_common_ui/src/icons/solana_icon.tsx`: 5, 11, 12, 20
- `ui/bitcodex_common_ui/src/icons/x_icon.tsx`: 35

##### Hard-coded/configuration/branding location index
Search categories below include every matched line (paths and line numbers, values intentionally not copied). URL/domain/email scans include third-party/protocol/documentation values which require classification, not blind replacement; OAuth identifiers and analytics keys must not be copied to the new product. env examples included, private runtime env files excluded by rg ignore rules.

**OAuth/client IDs, Auth0, Telegram, Amplitude**

- `apps/attached_mobile_host_web/src/app/mobile/login/_client.tsx`: 9, 10, 11, 46, 47, 54
- `backend/bitcodex_api/server/bitcodex_api_server.env.example`: 36
- `backend/bitcodex_api/server/src/api/github.ts`: 7
- `backend/bitcodex_api/server/src/api/x.ts`: 6
- `backend/bitcodex_api/server/src/bin/launch.ts`: 85
- `backend/bitcodex_api/server/src/envs.ts`: 43
- `backend/bitcodex_api/server/src/middleware/auth/auth0_auth/client_id.ts`: 1, 2
- `backend/bitcodex_api/server/src/middleware/auth/auth0_auth/validate.ts`: 5, 6, 7, 34, 70, 71
- `backend/bitcodex_api/server/src/middleware/auth/google_auth/client_id.ts`: 1
- `backend/bitcodex_api/server/src/middleware/auth/google_auth/validate.ts`: 4, 59
- `backend/bitcodex_api/server/src/middleware/auth/telegram_auth/index.ts`: 47
- `backend/bitcodex_api/server/src/routes/social_login_v1/get_github_token.ts`: 15, 83
- `backend/bitcodex_api/server/src/routes/social_login_v1/get_x_token.ts`: 14, 78
- `backend/bitcodex_api_server_state/src/index.ts`: 102, 137
- `crypto/teddsa/teddsa_addon/addon/src/keygen.rs`: 244, 254, 257, 292
- `documentation/key_share_node.md`: 93
- `e2e_tests/src/setup/ksn.ts`: 35
- `embed/bitcodex_attached/bitcodex_attached.env.example`: 7, 9
- `embed/bitcodex_attached/package.json`: 22
- `embed/bitcodex_attached/src/analytics/amplitude.ts`: 1, 5, 6, 9, 18, 20, 32, 40, 46, 57
- `embed/bitcodex_attached/src/analytics/events.ts`: 3
- `embed/bitcodex_attached/src/components/attached_initialized/use_initialize_app.ts`: 13
- `embed/bitcodex_attached/src/components/export/telegram_reauth.tsx`: 16, 51
- `embed/bitcodex_attached/src/components/export/use_export_reauth.ts`: 7, 8, 9, 11, 79, 105, 130, 154
- `embed/bitcodex_attached/src/components/telegram/telegram_login_popup.tsx`: 9, 32
- `embed/bitcodex_attached/src/config/auth0.ts`: 3, 4, 5, 12, 13
- `embed/bitcodex_attached/src/config/oauth.ts`: 1, 3, 4, 5
- `embed/bitcodex_attached/src/config/telegram.ts`: 1
- `embed/bitcodex_attached/src/envs.ts`: 13, 15
- `embed/bitcodex_attached/src/global.d.ts`: 22, 24
- `embed/bitcodex_attached/src/lib/auth0/index.ts`: 3, 14, 51
- `embed/bitcodex_attached/src/main.tsx`: 11, 13, 14
- `embed/bitcodex_attached/src/window_msgs/generate_oauth_url.ts`: 12, 13, 14, 16, 28, 48, 67, 85
- `embed/bitcodex_attached/src/window_msgs/oauth_info_pass/discord.ts`: 5, 18
- `embed/bitcodex_attached/src/window_msgs/oauth_info_pass/index.ts`: 39
- `embed/bitcodex_attached/src/window_msgs/oauth_info_pass/token.ts`: 9, 10, 12, 24, 164, 206, 211
- `internals/docker/docker-compose.yml`: 53
- `internals/docker/env.example`: 42
- `key_share_node/docker/docker-compose.yml`: 37
- `key_share_node/docker/env.example`: 30
- `key_share_node/server/key_share_node.env.example`: 11
- `key_share_node/server/key_share_node_2.env.example`: 11
- `key_share_node/server/key_share_node_3.env.example`: 11
- `key_share_node/server/src/auth/auth0/client_id.ts`: 1, 2
- `key_share_node/server/src/auth/auth0/index.ts`: 6, 61, 85, 86
- `key_share_node/server/src/auth/google/client_id.ts`: 1
- `key_share_node/server/src/auth/google/index.ts`: 6, 71
- `key_share_node/server/src/auth/telegram/client_id.ts`: 1
- `key_share_node/server/src/auth/telegram/validate_jwt.ts`: 7, 92
- `key_share_node/server/src/auth/types.ts`: 10
- `key_share_node/server/src/bin/launch/index.ts`: 127
- `key_share_node/server/src/envs.ts`: 32, 48
- `key_share_node/server/src/middlewares/auth.ts`: 104
- `key_share_node/server/src/middlewares/commit_reveal.test.ts`: 162
- `key_share_node/server/src/routes/key_share_v2/commit.test.ts`: 66
- `key_share_node/server/src/routes/key_share_v2/e2e.test.ts`: 180
- `key_share_node/server/src/routes/pg_dump/index.test.ts`: 36, 90, 371
- `key_share_node/server/src/state/index.ts`: 8

**BitcodeX/Keplr domains, all URL literals and email addresses**

- `.github/workflows/claude-pr-review.yml`: 111
- `.github/workflows/codeql.yml`: 26, 27, 28, 55, 57, 78, 86
- `.gitignore`: 1, 2, 6, 86, 94, 98, 102, 108, 112, 116, 177, 196, 199, 205, 212, 249, 264, 314, 369, 385
- `README.md`: 3, 33, 39, 40, 41, 42, 43, 44, 49, 54, 61, 72
- `SECURITY.md`: 10
- `apps/attached_mobile_host_web/CLAUDE.md`: 32, 72
- `apps/attached_mobile_host_web/attached_mobile_host_web.env.example`: 2
- `apps/attached_mobile_host_web/src/app/mobile/_shared/build_iframe_src.ts`: 3
- `apps/attached_mobile_host_web/src/app/mobile/login/_client.tsx`: 9, 46
- `apps/attached_mobile_host_web/src/bin/launch.ts`: 25
- `apps/attached_mobile_host_web/src/oauth_callback.test.ts`: 33, 36, 83
- `apps/customer_dashboard/customer_dashboard.env.example`: 3, 4, 5, 6, 7
- `apps/customer_dashboard/src/app/layout.tsx`: 35, 41
- `apps/customer_dashboard/src/app/team/invite/success/page.tsx`: 14
- `apps/customer_dashboard/src/app/users/forgot_password/page.tsx`: 238, 286
- `apps/customer_dashboard/src/bin/launch.ts`: 29
- `apps/customer_dashboard/src/components/edit_info_form/edit_info_form.tsx`: 50
- `apps/customer_dashboard/src/components/invalid_link/invalid_link.tsx`: 9, 25, 26
- `apps/customer_dashboard/src/components/team_member_list/invite_modal.tsx`: 168
- `apps/demo_web/.gitignore`: 1
- `apps/demo_web/demo_web.env.example`: 3, 4, 5
- `apps/demo_web/src/app/layout.tsx`: 35, 41
- `apps/demo_web/src/bin/launch.ts`: 32
- `apps/demo_web/src/components/preview_panel/preview_panel.module.scss`: 22, 27
- `apps/demo_web/src/components/preview_panel/preview_panel.tsx`: 50, 51
- `apps/demo_web/src/components/widgets/account_widget/spinner.tsx`: 22
- `apps/demo_web/src/components/widgets/login_widget/login_default_view.tsx`: 63, 91
- `apps/demo_web/src/components/widgets/solana_onchain_sign_widget/solana_onchain_sign_widget.tsx`: 16
- `apps/demo_web/src/hooks/use_get_chain_infos.ts`: 4
- `apps/docs_web/README.md`: 3
- `apps/docs_web/backlog/index.md`: 11
- `apps/docs_web/docs/v0/api-reference/api-overview.md`: 42, 100, 118, 123, 146, 151, 175, 180, 665, 667, 691, 692, 700, 704, 706, 709
- `apps/docs_web/docs/v0/contributing.md`: 7
- `apps/docs_web/docs/v0/development/environment-setup.md`: 41, 59, 60, 83, 102, 104, 106
- `apps/docs_web/docs/v0/getting-started/quick-start.md`: 132
- `apps/docs_web/docs/v0/getting-started/starter-templates.md`: 14, 15, 16, 17, 18, 22
- `apps/docs_web/docs/v0/getting-started/supported-chains.md`: 13, 66, 80
- `apps/docs_web/docs/v0/lifecycle.md`: 55, 454
- `apps/docs_web/docs/v0/sdk-usage/cosmos-integration.md`: 12, 29, 118
- `apps/docs_web/docs/v0/sdk-usage/cosmos-kit-integration.md`: 13, 48, 146, 147, 148
- `apps/docs_web/docs/v0/sdk-usage/ethereum-integration.md`: 13, 33, 122
- `apps/docs_web/docs/v0/sdk-usage/interchain-kit-integration.md`: 16, 45, 173, 174, 175
- `apps/docs_web/docs/v0/sdk-usage/mobile/react-native-integration.md`: 136, 145, 443, 449
- `apps/docs_web/docs/v0/sdk-usage/rainbow-kit-integration.md`: 13, 20, 211, 225
- `apps/docs_web/docs/v0/sdk-usage/react-integration.md`: 13
- `apps/docs_web/docs/v0/sdk-usage/rialo-frost-kit-integration.md`: 9, 66, 67, 135, 136
- `apps/docs_web/docs/v0/sdk-usage/sdk-overview.md`: 120, 124
- `apps/docs_web/docs/v0/sdk-usage/solana-integration.md`: 12, 31, 58, 165, 166
- `apps/docs_web/docs/v0/sdk-usage/solana-wallet-adapter-integration.md`: 9, 14, 51, 52, 53
- `apps/docs_web/docs/v0/standalone/self-hosting-standalone.md`: 128, 149, 179, 181, 211, 240, 242, 289, 292, 303, 304, 311, 322, 327, 337, 342, 351, 356
- `apps/docs_web/docusaurus.config.ts`: 16, 50, 77, 86, 95
- `apps/email_template_2/src/app/bitcodex/page.tsx`: 75, 192
- `apps/email_template_2/src/app/bitcodex_code/page.tsx`: 67, 215
- `apps/email_template_2/src/app/bitcodex_wallet_code/page.tsx`: 67, 206
- `apps/email_template_2/src/app/remind_inactive/page.tsx`: 77, 170, 179, 196, 205, 222, 231, 300
- `apps/email_template_2/src/app/remind_unverified/page.tsx`: 109, 237, 345, 354, 378, 387, 411, 420, 483
- `apps/email_template_2/src/app/reset_pw_code/page.tsx`: 46, 150
- `apps/email_template_2/src/app/team_invite/page.tsx`: 9
- `apps/email_template_2/src/bin/launch.ts`: 32
- `apps/email_template_2/src/components/EmailCard.tsx`: 60, 69, 116, 125
- `apps/email_template_2/src/components/EmailCode.tsx`: 89
- `apps/email_template_2/src/components/EmailFooter.tsx`: 74, 82, 97, 105, 120, 129, 158
- `apps/bitcodex_admin_web/bitcodex_admin_web.env.example`: 3
- `apps/bitcodex_admin_web/src/app/layout.tsx`: 38, 44
- `apps/bitcodex_admin_web/src/bin/launch.ts`: 29
- `apps/bitcodex_admin_web/src/components/create_customer/create_customer_form.tsx`: 78, 88
- `apps/bitcodex_admin_web/src/components/create_customer/create_customer_header/create_customer_header.tsx`: 11
- `apps/bitcodex_admin_web/src/components/create_customer/use_create_customer_form.ts`: 127
- `apps/bitcodex_admin_web/src/components/create_ks_node/create_customer_form.tsx`: 96
- `apps/bitcodex_admin_web/src/components/create_ks_node/create_ks_node_header.tsx`: 13
- `apps/bitcodex_admin_web/src/components/create_ks_node/use_create_ks_node_form.ts`: 74, 79
- `apps/bitcodex_admin_web/src/components/keyshare_nodes/keyshare_nodes_view.tsx`: 108
- `apps/user_dashboard/src/app/layout.tsx`: 43, 49
- `apps/user_dashboard/src/app/transaction_history/constant.ts`: 10, 16, 22, 28, 34
- `apps/user_dashboard/src/bin/launch.ts`: 29
- `apps/user_dashboard/src/components/dashboard_header/dashboard_header.tsx`: 120, 122
- `apps/user_dashboard/src/components/left_bar/left_bar.tsx`: 20
- `apps/user_dashboard/src/components/spinner/spinner.tsx`: 20
- `apps/user_dashboard/src/constants/alchemy.ts`: 10
- `apps/user_dashboard/src/fetch/cw20_token_balances.ts`: 26
- `apps/user_dashboard/src/fetch/factory_token_meta.ts`: 5
- `apps/user_dashboard/src/fetch/osmosis_asset_list.ts`: 25
- `apps/user_dashboard/user_dashboard.env.example`: 4, 5, 6, 7, 8, 9, 10, 11, 15
- `backend/admin_api/src/auth/index.ts`: 10, 11
- `backend/admin_api/src/email/index.test.ts`: 21, 72, 88, 89
- `backend/admin_api/src/email/index.ts`: 97
- `backend/ct_dashboard_api/src/constants/index.ts`: 10, 11
- `backend/ct_dashboard_api/src/email/inactive_reminder.ts`: 14
- `backend/ct_dashboard_api/src/email/password_reset.ts`: 16
- `backend/ct_dashboard_api/src/email/team_invitation.ts`: 22
- `backend/ct_dashboard_api/src/email/unverified_reminder.ts`: 15
- `backend/ct_dashboard_api/src/email/verification.ts`: 20
- `backend/ct_dashboard_api/src/routes/v1/customer_auth.test.ts`: 34, 173
- `backend/bitcodex_api/server/bitcodex_api_server.env.example`: 9, 11, 38, 43
- `backend/bitcodex_api/server/src/api/github.ts`: 5, 6
- `backend/bitcodex_api/server/src/api/log/index.test.ts`: 27, 28
- `backend/bitcodex_api/server/src/api/tss/cosmos_compat_auth/index.ts`: 18, 19
- `backend/bitcodex_api/server/src/api/tss/ks_node/index.test.ts`: 37, 45
- `backend/bitcodex_api/server/src/api/tss/sign_ed25519/index.test.ts`: 39, 59, 224
- `backend/bitcodex_api/server/src/api/tss/tests.ts`: 7, 8
- `backend/bitcodex_api/server/src/api/tss/tss_session/index.test.ts`: 64, 125, 126, 180, 218, 277, 336, 391, 443, 468, 469
- `backend/bitcodex_api/server/src/api/tss/v1/keygen/index.test.ts`: 50, 115, 116, 191, 204, 229, 230, 277, 278, 319, 320, 363, 364
- `backend/bitcodex_api/server/src/api/tss/v1/presign/index.test.ts`: 109, 134, 597, 620, 671, 704, 705, 765, 797, 798, 858, 890, 891, 965, 1014, 1047, 1048, 1101, 1133, 1134, 1189, 1238, 1271, 1272, 1325, 1357, 1358
- `backend/bitcodex_api/server/src/api/tss/v1/sign/index.test.ts`: 116, 141, 619, 642, 693, 777, 860, 958, 1010, 1093
- `backend/bitcodex_api/server/src/api/tss/v1/triples/index.test.ts`: 100, 717, 736, 783, 866, 948, 1003, 1093, 1182, 1233, 1319, 1404, 1455, 1541, 1626, 1675, 1758, 1840, 1889, 1972, 2054, 2103, 2186, 2269, 2321, 2407, 2492, 2547, 2636, 2724, 2773, 2857, 2939
- `backend/bitcodex_api/server/src/api/tss/v1/user/index.test.ts`: 36, 82, 106, 134, 185, 235, 277, 296, 320, 366, 410, 476, 533
- `backend/bitcodex_api/server/src/api/tss/v2/keygen/index.test.ts`: 61, 132, 133, 263, 294, 295, 330, 358, 359, 419, 420, 477, 478, 533, 534, 590, 591, 645, 646, 689, 690, 720, 794, 795, 857, 858, 905, 983, 1100, 1104, 1118, 1129
- `backend/bitcodex_api/server/src/api/x.ts`: 4, 5
- `backend/bitcodex_api/server/src/middleware/auth/auth0_auth/client_id.ts`: 1
- `backend/bitcodex_api/server/src/middleware/auth/auth0_auth/validate.ts`: 34, 71
- `backend/bitcodex_api/server/src/middleware/auth/discord_auth/validate.ts`: 8
- `backend/bitcodex_api/server/src/middleware/auth/google_auth/validate.ts`: 23, 60
- `backend/bitcodex_api/server/src/middleware/auth/cosmos_compat_auth.test.ts`: 48
- `backend/bitcodex_api/server/src/middleware/auth/x_auth/validate.ts`: 42
- `backend/bitcodex_api/server/src/routes/log_v1/post_log.test.ts`: 43, 44
- `backend/bitcodex_api/server/src/routes/social_login_v1/referral_civitia.ts`: 15
- `backend/bitcodex_api/server/src/routes/tss_v1/keygen.test.ts`: 42, 43, 171, 172, 201, 202, 242, 243
- `backend/bitcodex_api/server/src/routes/tss_v1/presign.test.ts`: 70, 184, 288
- `backend/bitcodex_api/server/src/routes/tss_v1/sign.test.ts`: 68, 178
- `backend/bitcodex_api/server/src/routes/tss_v1/triples.test.ts`: 92, 276, 380, 484, 588, 692, 796, 900, 1004, 1109, 1215
- `backend/bitcodex_api/server/src/routes/tss_v1/tss_session.test.ts`: 68
- `backend/bitcodex_api/server/src/routes/tss_v1/user.test.ts`: 46, 47, 89, 149, 168, 192, 238, 330, 336, 352, 358, 395, 401
- `backend/bitcodex_api/server/src/routes/tss_v2/e2e.test.ts`: 456, 457, 638, 639
- `backend/bitcodex_api/server/src/routes/tss_v2/keygen_registration_threshold.test.ts`: 50, 51, 145
- `backend/bitcodex_api/server/src/routes/tss_v2/registration_reshare_scenario.test.ts`: 30, 151, 235, 305, 370, 430
- `backend/bitcodex_api/server/src/runtime/health_check_node.test.ts`: 50, 55, 60, 65, 70, 106, 107, 108, 109, 110, 161
- `backend/bitcodex_pg_interface/scripts/seed_backup/data/common.ts`: 14, 22, 50, 93, 98
- `backend/bitcodex_pg_interface/scripts/seed_backup/data/dev.ts`: 1, 2
- `backend/bitcodex_pg_interface/scripts/seed_backup/data/prod.ts`: 1, 2, 3
- `backend/bitcodex_pg_interface/seeds/data/common.ts`: 14, 22, 50, 91, 96
- `backend/bitcodex_pg_interface/seeds/data/dev.ts`: 1, 2
- `backend/bitcodex_pg_interface/seeds/data/prod.ts`: 1, 2, 3
- `backend/openapi/src/registry.ts`: 61, 65
- `backend/user_dashboard_api/src/constants/index.ts`: 8, 9
- `backend/user_dashboard_api/src/email/index.test.ts`: 21, 72, 88, 89
- `backend/user_dashboard_api/src/routes/user_auth.test.ts`: 34, 173
- `biome.json`: 2
- `crypto/bytes/package.json`: 12
- `crypto/tecdsa/README.md`: 5, 6, 7, 8
- `crypto/tecdsa/cait_sith_cosmos_compat/Cargo.toml`: 3, 4, 8, 46
- `crypto/tecdsa/cait_sith_cosmos_compat/README.md`: 1, 229
- `crypto/tecdsa/cait_sith_cosmos_compat/src/lib.rs`: 94
- `crypto/tecdsa/cait_sith_cosmos_compat_addon/.gitignore`: 23, 26, 32, 60
- `crypto/tecdsa/cait_sith_cosmos_compat_addon/addon/.gitignore`: 1, 2, 13, 32, 35, 41, 79, 92, 113, 115, 116, 151, 153, 154, 182
- `crypto/tecdsa/cait_sith_cosmos_compat_addon/addon/Cargo.toml`: 10
- `crypto/tecdsa/cait_sith_cosmos_compat_express/.gitignore`: 23, 26, 32, 60
- `crypto/tecdsa/cait_sith_cosmos_compat_hooks/.gitignore`: 1
- `crypto/tecdsa/cait_sith_cosmos_compat_wasm/.gitignore`: 1
- `crypto/tecdsa/client_example/.gitignore`: 1
- `crypto/tecdsa/server_example/.gitignore`: 23, 26, 32, 60
- `crypto/tecdsa/server_example/package.json`: 19, 22
- `crypto/teddsa/frost_core/CHANGELOG.md`: 19, 176
- `crypto/teddsa/frost_core/Cargo.toml`: 8, 9, 10, 11, 13
- `crypto/teddsa/frost_core/LICENSE`: 8
- `crypto/teddsa/frost_core/LICENSE.Apache-2.0`: 7
- `crypto/teddsa/frost_core/README.md`: 4
- `crypto/teddsa/frost_core/src/batch.rs`: 111
- `crypto/teddsa/frost_core/src/keys.rs`: 444, 505, 578, 869
- `crypto/teddsa/frost_core/src/keys/dkg.rs`: 28, 29, 30, 31
- `crypto/teddsa/frost_core/src/keys/refresh.rs`: 9, 20
- `crypto/teddsa/frost_core/src/keys/repairable.rs`: 3
- `crypto/teddsa/frost_core/src/lib.rs`: 3, 43, 66, 114, 115, 192, 241, 339, 494, 602
- `crypto/teddsa/frost_core/src/round1.rs`: 46, 325, 391, 445
- `crypto/teddsa/frost_core/src/round2.rs`: 61, 124
- `crypto/teddsa/frost_core/src/serialization.rs`: 218
- `crypto/teddsa/frost_core/src/traits.rs`: 54, 60, 74, 115, 122, 129, 138, 148, 149, 171, 178, 185, 192, 199
- `crypto/teddsa/frost_ed25519_cosmos_compat/Cargo.toml`: 8, 9, 10, 11, 13
- `crypto/teddsa/frost_ed25519_cosmos_compat/LICENSE`: 8
- `crypto/teddsa/frost_ed25519_cosmos_compat/LICENSE.Apache-2.0`: 7
- `crypto/teddsa/frost_ed25519_cosmos_compat/src/tss/keys/repairable.rs`: 3
- `crypto/teddsa/frost_ed25519_cosmos_compat/src/tss/mod.rs`: 112, 144, 162, 169, 176, 183, 190
- `crypto/teddsa/frost_ed25519_cosmos_compat/tests/integration_tests.rs`: 352
- `crypto/teddsa/frost_rerandomized/Cargo.toml`: 8, 9, 10, 11, 13
- `crypto/teddsa/frost_rerandomized/LICENSE`: 8
- `crypto/teddsa/frost_rerandomized/LICENSE.Apache-2.0`: 7
- `crypto/teddsa/frost_rerandomized/README.md`: 4, 19, 23
- `crypto/teddsa/teddsa_addon/.gitignore`: 23, 26, 32, 60
- `crypto/teddsa/teddsa_addon/addon/.gitignore`: 1, 2, 13, 32, 35, 41, 79, 92, 113, 115, 116, 151, 153, 154, 182
- `crypto/teddsa/teddsa_addon/addon/Cargo.toml`: 10
- `documentation/key_share_node.md`: 37, 95, 165, 190, 409, 474, 477
- `documentation/node_upgrade.md`: 94
- `e2e_tests/src/__tests__/handlers/add_ed25519_with_reshare.test.ts`: 564
- `e2e_tests/src/__tests__/scenarios/infra_and_session/active_nodes_below_threshold.test.ts`: 26
- `e2e_tests/src/__tests__/scenarios/registration_threshold_reshare.test.ts`: 388, 399
- `e2e_tests/src/utils/test_context.ts`: 82
- `embed/bitcodex_attached/.gitignore`: 1
- `embed/bitcodex_attached/index.html`: 19, 25
- `embed/bitcodex_attached/bitcodex_attached.env.example`: 3, 4, 5, 6, 10, 11, 13, 16
- `embed/bitcodex_attached/src/bin/launch2.ts`: 32
- `embed/bitcodex_attached/src/components/discord_callback/discord_callback.tsx`: 63
- `embed/bitcodex_attached/src/components/email/email_login_popup.tsx`: 67
- `embed/bitcodex_attached/src/components/email_callback/email_callback.tsx`: 67
- `embed/bitcodex_attached/src/components/export/email_reauth.tsx`: 262
- `embed/bitcodex_attached/src/components/export/telegram_reauth.tsx`: 65, 116, 152
- `embed/bitcodex_attached/src/components/export/use_export_reauth.ts`: 78, 103, 128, 153
- `embed/bitcodex_attached/src/components/github_callback/github_callback.tsx`: 62
- `embed/bitcodex_attached/src/components/google_callback/google_callback.tsx`: 62
- `embed/bitcodex_attached/src/components/login_popup/login_popup_error_view.tsx`: 58
- `embed/bitcodex_attached/src/components/modal_variants/error/error_modal.tsx`: 111
- `embed/bitcodex_attached/src/components/modal_variants/eth/tx_sig/sponsored_fee/base_sponsorship_background.module.scss`: 1
- `embed/bitcodex_attached/src/components/modal_variants/svm/siws_message.ts`: 4
- `embed/bitcodex_attached/src/components/sign_with_bitcodex_box/sign_with_bitcodex_box.tsx`: 11
- `embed/bitcodex_attached/src/components/telegram/telegram_login_popup.tsx`: 51, 80
- `embed/bitcodex_attached/src/components/telegram_callback/telegram_callback.tsx`: 36, 112
- `embed/bitcodex_attached/src/components/x_callback/x_callback.tsx`: 62
- `embed/bitcodex_attached/src/config/auth0.ts`: 3
- `embed/bitcodex_attached/src/constants/urls.ts`: 2
- `embed/bitcodex_attached/src/envs.ts`: 21, 27
- `embed/bitcodex_attached/src/requests/chain_infos.ts`: 6
- `embed/bitcodex_attached/src/requests/endpoints.ts`: 32, 33
- `embed/bitcodex_attached/src/requests/fee_sponsorship.ts`: 4, 5, 8
- `embed/bitcodex_attached/src/utils/favicon.ts`: 8
- `embed/bitcodex_attached/src/web3/ethereum/constants.ts`: 10, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29
- `embed/bitcodex_attached/src/web3/ethereum/decoder/selector.ts`: 32, 67
- `embed/bitcodex_attached/src/web3/svm/queries/use_get_token_metadata.ts`: 6
- `embed/bitcodex_attached/src/window_msgs/generate_oauth_url.ts`: 27, 46, 65, 84
- `embed/bitcodex_attached/src/window_msgs/oauth_info_pass/discord.ts`: 6, 63
- `embed/bitcodex_attached/src/window_msgs/oauth_info_pass/github.ts`: 56
- `embed/bitcodex_attached/src/window_msgs/oauth_info_pass/token.ts`: 20, 24, 158, 206
- `examples/README.md`: 27
- `examples/cosmos_nextjs/.env.example`: 2
- `examples/cosmos_nextjs/.gitignore`: 1
- `examples/cosmos_nextjs/README.md`: 27, 36
- `examples/cosmos_nextjs/components/AccountInfo.tsx`: 106, 129, 154, 163
- `examples/cosmos_nextjs/components/TransactionForm.tsx`: 86, 316, 331
- `examples/cosmos_nextjs/constants/chain.ts`: 4, 5, 9, 24, 32, 39, 48
- `examples/cosmoskit_nextjs/.env.example`: 2
- `examples/cosmoskit_nextjs/.gitignore`: 1
- `examples/cosmoskit_nextjs/README.md`: 27, 36
- `examples/cosmoskit_nextjs/components/AccountInfo.tsx`: 36, 119, 142, 167, 176
- `examples/cosmoskit_nextjs/components/TransactionForm.tsx`: 77, 297, 312
- `examples/evm_nextjs/.env.example`: 2
- `examples/evm_nextjs/.gitignore`: 1
- `examples/evm_nextjs/README.md`: 27, 36
- `examples/evm_nextjs/components/AccountInfo.tsx`: 105, 128, 153, 162
- `examples/evm_nextjs/components/TransactionForm.tsx`: 67, 291, 306
- `examples/evm_wagmi_nextjs/.env.example`: 2
- `examples/evm_wagmi_nextjs/.gitignore`: 1
- `examples/evm_wagmi_nextjs/README.md`: 28, 30, 39
- `examples/evm_wagmi_nextjs/components/TransactionForm.tsx`: 90, 289, 304
- `examples/evm_wagmi_nextjs/components/wagmiConfig.ts`: 31
- `examples/interchainkit_nextjs/.env.example`: 2
- `examples/interchainkit_nextjs/.gitignore`: 1
- `examples/interchainkit_nextjs/README.md`: 27, 36
- `examples/interchainkit_nextjs/components/AccountInfo.tsx`: 36, 119, 142, 167, 176
- `examples/interchainkit_nextjs/components/TransactionForm.tsx`: 75, 296, 311
- `examples/multi_ecosystem_react/.env.example`: 2
- `examples/multi_ecosystem_react/README.md`: 26, 35
- `examples/multi_ecosystem_react/src/components/CopyableAddress.tsx`: 45, 68
- `examples/multi_ecosystem_react/src/components/CosmosTransactionForm.tsx`: 82
- `examples/multi_ecosystem_react/src/components/EvmTransactionForm.tsx`: 51
- `examples/multi_ecosystem_react/src/components/SvmTransactionForm.tsx`: 73
- `examples/multi_ecosystem_react/src/components/TxResult.tsx`: 27, 42
- `examples/multi_ecosystem_react/src/constants/chains.ts`: 7, 8, 12, 27, 35, 42, 51
- `examples/multi_ecosystem_react/vite.config.ts`: 5
- `examples/svm_nextjs/.env.example`: 2
- `examples/svm_nextjs/components/AccountInfo.tsx`: 103, 126, 151, 160
- `examples/svm_nextjs/components/TransactionForm.tsx`: 78, 296, 311
- `internals/docker/env.example`: 20, 22, 44, 48
- `internals/docker/bitcodex_api_server.Dockerfile`: 22
- `internals/github/.event.json`: 6, 7
- `internals/github/README.md`: 13, 25, 45, 46
- `key_share_node/docker/env.example`: 32
- `key_share_node/key_share_node_2/server/src/main.rs`: 15
- `key_share_node/ksn_interface/package.json`: 54
- `key_share_node/server/key_share_node.env.example`: 12
- `key_share_node/server/key_share_node_2.env.example`: 12
- `key_share_node/server/key_share_node_3.env.example`: 12
- `key_share_node/server/src/api/key_share/v1.test.ts`: 79, 97, 165, 186, 241, 265, 294, 361, 400, 449, 502, 529, 562, 605
- `key_share_node/server/src/auth/auth0/client_id.ts`: 1
- `key_share_node/server/src/auth/auth0/index.ts`: 86, 192
- `key_share_node/server/src/auth/discord/index.ts`: 11
- `key_share_node/server/src/auth/github/index.ts`: 5
- `key_share_node/server/src/auth/google/index.ts`: 24, 72
- `key_share_node/server/src/auth/telegram/validate_jwt.ts`: 10, 11
- `key_share_node/server/src/auth/x/index.ts`: 5
- `key_share_node/server/src/bin/launch/check_db_backup.ts`: 85
- `key_share_node/server/src/openapi/doc.ts`: 31, 35
- `key_share_node/server/src/openapi/schema/key_share_v1.ts`: 73
- `key_share_node/server/src/openapi/schema/key_share_v2.ts`: 88
- `key_share_node/server/src/routes/pg_dump/index.test.ts`: 463, 464, 465, 466, 467
- `lib/aws/src/s3/index.test.ts`: 30
- `lib/aws/src/s3/index.ts`: 46
- `lib/dotenv/package.json`: 15
- `lib/stdlib_js/package.json`: 31
- `sandbox/sandbox_cosmos_kit/.env.example`: 2
- `sandbox/sandbox_cosmos_kit/.gitignore`: 1
- `sandbox/sandbox_cosmos_kit/README.md`: 27, 36
- `sandbox/sandbox_cosmos_kit/components/AccountInfo.tsx`: 36, 119, 142, 167, 176
- `sandbox/sandbox_cosmos_kit/components/TransactionForm.tsx`: 77, 297, 312
- `sandbox/sandbox_evm/.env.local.example`: 11, 14
- `sandbox/sandbox_evm/.gitignore`: 1
- `sandbox/sandbox_evm/launch.ts`: 18
- `sandbox/sandbox_evm/scaffold.config.ts`: 28, 33, 34, 73, 82, 85
- `sandbox/sandbox_evm/src/app/debug/_components/contract/TxReceipt.tsx`: 22
- `sandbox/sandbox_evm/src/app/playground/_components/SiweSignWidget.tsx`: 27, 28, 29
- `sandbox/sandbox_evm/src/components/Footer.tsx`: 30
- `sandbox/sandbox_evm/src/hooks/scaffold-eth/usePermit.ts`: 217
- `sandbox/sandbox_evm/src/services/web3/wagmiConfig.tsx`: 46
- `sandbox/sandbox_evm/src/utils/scaffold-eth/common.ts`: 3
- `sandbox/sandbox_evm/src/utils/scaffold-eth/getMetadata.ts`: 4, 5
- `sandbox/sandbox_evm/src/utils/scaffold-eth/networks.ts`: 33, 128
- `sandbox/sandbox_interchain_kit/.env.example`: 2
- `sandbox/sandbox_interchain_kit/.gitignore`: 1
- `sandbox/sandbox_interchain_kit/README.md`: 27, 36
- `sandbox/sandbox_interchain_kit/app/page.tsx`: 38, 39
- `sandbox/sandbox_interchain_kit/components/AccountInfo.tsx`: 36, 119, 142, 167, 176
- `sandbox/sandbox_interchain_kit/components/TransactionForm.tsx`: 75, 296, 311
- `sandbox/sandbox_react_native/.gitignore`: 1
- `sandbox/sandbox_react_native/README.md`: 3, 21, 22, 23, 24, 26, 42, 43, 49, 50
- `sandbox/sandbox_react_native/android/app/build.gradle`: 52, 67, 114
- `sandbox/sandbox_react_native/android/app/proguard-rules.pro`: 8
- `sandbox/sandbox_react_native/android/app/src/debugOptimized/AndroidManifest.xml`: 1, 2
- `sandbox/sandbox_react_native/android/app/src/main/AndroidManifest.xml`: 1
- `sandbox/sandbox_react_native/android/app/src/main/java/com/eldeniyenden/sandbox_react_native/MainActivity.kt`: 50
- `sandbox/sandbox_react_native/android/app/src/main/res/drawable/ic_launcher_background.xml`: 1
- `sandbox/sandbox_react_native/android/app/src/main/res/drawable/rn_edit_text_material.xml`: 8, 16, 25, 31
- `sandbox/sandbox_react_native/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml`: 2
- `sandbox/sandbox_react_native/android/app/src/main/res/mipmap-anydpi-v26/ic_launcher_round.xml`: 2
- `sandbox/sandbox_react_native/android/app/src/main/res/values/styles.xml`: 1
- `sandbox/sandbox_react_native/android/build.gradle`: 19
- `sandbox/sandbox_react_native/android/gradle.properties`: 8, 17, 22
- `sandbox/sandbox_react_native/android/gradlew`: 10, 60, 63, 88
- `sandbox/sandbox_react_native/android/gradlew.bat`: 8
- `sandbox/sandbox_react_native/app-example/app/(tabs)/explore.tsx`: 44, 64, 74
- `sandbox/sandbox_react_native/app-example/app/_layout.tsx`: 16
- `sandbox/sandbox_react_native/app-example/components/ui/icon-symbol.tsx`: 13, 14
- `sandbox/sandbox_react_native/app-example/constants/theme.ts`: 3
- `sandbox/sandbox_react_native/app-example/hooks/use-theme-color.ts`: 3
- `sandbox/sandbox_react_native/app/index.tsx`: 24
- `sandbox/sandbox_react_native/eslint.config.js`: 1
- `sandbox/sandbox_rialo/.env.example`: 2, 5, 6
- `sandbox/sandbox_rialo/src/components/AccountInfo.tsx`: 99, 122, 162, 185, 194
- `sandbox/sandbox_rialo/src/components/Providers.tsx`: 31, 32
- `sandbox/sandbox_rialo/src/components/sign_transaction_widget.tsx`: 150, 159
- `sandbox/sandbox_simple_host/.env`: 1
- `sandbox/sandbox_simple_host/src/components/spinner/spinner.tsx`: 20
- `sandbox/sandbox_simple_host/src/components/widgets/login_widget/login_widget.tsx`: 160, 176
- `sandbox/sandbox_simple_host/src/constants.ts`: 2, 3
- `sandbox/sandbox_sol/.env.example`: 2, 5, 6
- `sandbox/sandbox_sol/src/components/AccountInfo.tsx`: 124, 147, 187, 210, 219
- `sandbox/sandbox_sol/src/components/sign_transaction_widget.tsx`: 249, 258
- `sandbox/sandbox_sol/src/components/siws_widget.tsx`: 36, 37, 38, 203
- `sandbox/sandbox_sol/src/components/spl_token_transfer_widget.tsx`: 292, 301
- `sandbox/sandbox_sol/src/components/test_transactions_widget.tsx`: 825
- `sandbox/sandbox_sol/src/hooks/use_bitcodex_svm.ts`: 34, 35, 36
- `sandbox/sandbox_sol/src/lib/connection.ts`: 3
- `sdk/bitcodex_cosmos_kit/package.json`: 7
- `sdk/bitcodex_interchain_kit/package.json`: 7
- `sdk/bitcodex_sdk_core/package.json`: 30
- `sdk/bitcodex_sdk_core/src/event/emitter.test.ts`: 49, 55, 68, 85, 98, 117, 153, 193, 212, 237, 267, 322, 341, 364
- `sdk/bitcodex_sdk_core/src/static/init.ts`: 12
- `sdk/bitcodex_sdk_core/src/ui/signin_modal/components/default_view.ts`: 41
- `sdk/bitcodex_sdk_core/src/ui/signin_modal/components/icons.ts`: 4, 13, 20, 26, 32, 45, 58, 64, 70, 76, 82, 88, 94, 100, 106, 112
- `sdk/bitcodex_sdk_core/src/ui/signin_modal/icons.ts`: 2
- `sdk/bitcodex_sdk_core_react_native/README.md`: 3, 75, 76
- `sdk/bitcodex_sdk_core_react_native/android/src/main/AndroidManifest.xml`: 1
- `sdk/bitcodex_sdk_core_react_native/package.json`: 29
- `sdk/bitcodex_sdk_core_react_native/src/BitcodeXWalletProvider.tsx`: 11
- `sdk/bitcodex_sdk_core_react_native/src/BitcodeXWalletRN.ts`: 39
- `sdk/bitcodex_sdk_core_react_native/src/chain_info.ts`: 3
- `sdk/bitcodex_sdk_core_react_native/src/methods/sign_out.test.ts`: 8, 12, 18
- `sdk/bitcodex_sdk_cosmos/package.json`: 32
- `sdk/bitcodex_sdk_cosmos/src/tests/test-data.ts`: 35, 36, 70, 71
- `sdk/bitcodex_sdk_eth/package.json`: 31
- `sdk/bitcodex_sdk_eth/src/tests/hardhat/index.ts`: 15, 20, 32, 37, 342, 372
- `sdk/bitcodex_sdk_eth/src/tests/mock.test.ts`: 180, 239, 300
- `sdk/bitcodex_sdk_eth/src/tests/mock/index.ts`: 234, 243, 252, 261
- `sdk/bitcodex_sdk_eth/src/types/account.ts`: 8
- `sdk/bitcodex_sdk_react/package.json`: 44
- `sdk/bitcodex_sdk_svm/package.json`: 29
- `sdk/bitcodex_sdk_svm/src/tests/mock/index.ts`: 38, 44, 47, 53
- `sdk/bitcodex_sdk_svm/src/tests/wallet-standard.test.ts`: 30, 31, 261, 269, 275, 284, 285
- `ui/bitcodex_common_ui/src/icons/alert_triangle_icon.tsx`: 16
- `ui/bitcodex_common_ui/src/icons/apple_icon.tsx`: 6
- `ui/bitcodex_common_ui/src/icons/arrow_right_outlined.tsx`: 9
- `ui/bitcodex_common_ui/src/icons/arrow_up_right.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/book_open.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/chart_outlined.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/check_circle_outlined.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/check_icon.tsx`: 6
- `ui/bitcodex_common_ui/src/icons/check_thin_icon.tsx`: 6
- `ui/bitcodex_common_ui/src/icons/chevron_down.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/chevron_left.tsx`: 10
- `ui/bitcodex_common_ui/src/icons/chevron_right.tsx`: 10
- `ui/bitcodex_common_ui/src/icons/chevron_up.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/close_button_icon.tsx`: 16
- `ui/bitcodex_common_ui/src/icons/code.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/compass.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/contract_edit.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/copy_outlined.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/discord_icon.tsx`: 6
- `ui/bitcodex_common_ui/src/icons/door_outlined.tsx`: 11
- `ui/bitcodex_common_ui/src/icons/dots_horizontal.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/edit.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/empty_state_icon.tsx`: 11
- `ui/bitcodex_common_ui/src/icons/error_icon.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/external_link_outlined.tsx`: 11
- `ui/bitcodex_common_ui/src/icons/eye.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/eye_off.tsx`: 10
- `ui/bitcodex_common_ui/src/icons/file_icon.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/github_icon.tsx`: 6
- `ui/bitcodex_common_ui/src/icons/home_outlined.tsx`: 13
- `ui/bitcodex_common_ui/src/icons/info_circle.tsx`: 11
- `ui/bitcodex_common_ui/src/icons/loading.tsx`: 13
- `ui/bitcodex_common_ui/src/icons/loading_circle_icon.tsx`: 17
- `ui/bitcodex_common_ui/src/icons/log_out_04.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/logout.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/mailbox.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/menu.tsx`: 10
- `ui/bitcodex_common_ui/src/icons/moon_icon.tsx`: 10
- `ui/bitcodex_common_ui/src/icons/password.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/paths.ts`: 2
- `ui/bitcodex_common_ui/src/icons/plus.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/qr_code_icon.tsx`: 11
- `ui/bitcodex_common_ui/src/icons/search.tsx`: 11
- `ui/bitcodex_common_ui/src/icons/setting_icon.tsx`: 17
- `ui/bitcodex_common_ui/src/icons/sun_icon.tsx`: 10
- `ui/bitcodex_common_ui/src/icons/telegram_icon.tsx`: 8
- `ui/bitcodex_common_ui/src/icons/three_dots_vertical.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/trash.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/user.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/user_plus.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/user_right.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/users.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/wallet.tsx`: 10
- `ui/bitcodex_common_ui/src/icons/warning_icon.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/x_close.tsx`: 12
- `ui/bitcodex_common_ui/src/icons/x_icon.tsx`: 13, 14
- `ui/bitcodex_common_ui/src/styles/animation.scss`: 3

**S3/buckets, email sender, SMTP, branding storage/protocol**

- `.github/workflows/deploy_bitcodex_attached.yml`: 4
- `AGENTS.md`: 19, 33, 34, 35, 36, 37, 38, 58, 70, 84, 164
- `README.md`: 3, 39, 40, 41, 42, 43, 44
- `apps/attached_mobile_host_web/CLAUDE.md`: 3, 5, 9, 32, 53, 61, 62, 96
- `apps/attached_mobile_host_web/README.md`: 3
- `apps/attached_mobile_host_web/src/app/mobile/_shared/rpc_codec.ts`: 6, 25, 26, 53, 59, 102, 104, 107
- `apps/attached_mobile_host_web/src/app/mobile/_shared/use_attached_init.ts`: 40
- `apps/attached_mobile_host_web/src/app/mobile/login/_client.tsx`: 126
- `apps/attached_mobile_host_web/src/app/mobile/login/complete/_client.tsx`: 131, 142, 201, 238, 257
- `apps/attached_mobile_host_web/src/app/mobile/rpc/_client.tsx`: 53, 79
- `apps/attached_mobile_host_web/src/app/mobile/sign-out/_client.tsx`: 33
- `apps/customer_dashboard/src/app/layout.tsx`: 41
- `apps/customer_dashboard/src/app/team/invite/success/page.tsx`: 14
- `apps/customer_dashboard/src/components/invalid_link/invalid_link.tsx`: 9
- `apps/demo_web/demo_web.env.example`: 3, 5
- `apps/demo_web/global.d.ts`: 5
- `apps/demo_web/src/app/layout.tsx`: 41
- `apps/demo_web/src/components/left_bar/integration_card/integration_card.tsx`: 38
- `apps/demo_web/src/components/bitcodex_provider/bitcodex_provider.tsx`: 10
- `apps/demo_web/src/components/widgets/user_data_widget/user_data_widget.tsx`: 34
- `apps/demo_web/src/envs.ts`: 8, 10
- `apps/docs_web/docs/v0/api-reference/api-overview.md`: 660, 663, 664, 665, 666, 667, 727
- `apps/docs_web/docs/v0/development/environment-setup.md`: 123, 127
- `apps/docs_web/docs/v0/sdk-usage/cosmos-integration.md`: 29
- `apps/docs_web/docs/v0/sdk-usage/ethereum-integration.md`: 33
- `apps/docs_web/docs/v0/sdk-usage/mobile/react-native-integration.md`: 48, 50, 377
- `apps/docs_web/docs/v0/sdk-usage/rialo-frost-kit-integration.md`: 148
- `apps/docs_web/docs/v0/sdk-usage/sdk-overview.md`: 115
- `apps/docs_web/docs/v0/sdk-usage/solana-integration.md`: 31
- `apps/docs_web/docs/v0/standalone/self-hosting-standalone.md`: 39, 62, 177, 178, 179, 180, 181, 185, 186, 187, 188, 238, 239, 240, 241, 242, 246, 247, 248, 249, 295, 299, 322, 363
- `apps/docs_web/docusaurus.config.ts`: 50
- `apps/email_template_2/src/app/bitcodex/page.tsx`: 75
- `apps/email_template_2/src/app/bitcodex_code/page.tsx`: 67, 215
- `apps/email_template_2/src/app/bitcodex_wallet_code/page.tsx`: 67, 206
- `apps/email_template_2/src/app/remind_inactive/page.tsx`: 77, 170, 196, 222, 300
- `apps/email_template_2/src/app/remind_unverified/page.tsx`: 109, 345, 378, 411, 483
- `apps/email_template_2/src/app/reset_pw_code/page.tsx`: 46, 150
- `apps/email_template_2/src/app/team_invite/page.tsx`: 8, 9, 14, 97, 237
- `apps/email_template_2/src/components/EmailCard.tsx`: 60, 69, 116, 125
- `apps/email_template_2/src/components/EmailCode.tsx`: 89
- `apps/email_template_2/src/components/EmailFooter.tsx`: 74, 97, 120, 158
- `apps/bitcodex_admin_web/src/app/layout.tsx`: 44
- `apps/user_dashboard/global.d.ts`: 5, 11
- `apps/user_dashboard/next.config.ts`: 7, 11
- `apps/user_dashboard/src/app/export_private_key/page.tsx`: 541
- `apps/user_dashboard/src/app/layout.tsx`: 49
- `apps/user_dashboard/src/components/connected_apps/connected_apps.tsx`: 10, 13, 14, 15, 16
- `apps/user_dashboard/src/components/dashboard_header/dashboard_header.tsx`: 120, 122
- `apps/user_dashboard/src/components/left_bar/left_bar.tsx`: 20
- `apps/user_dashboard/src/components/my_assets/components/token_list/token_list.tsx`: 10, 119, 120
- `apps/user_dashboard/src/components/bitcodex_provider/bitcodex_provider.tsx`: 10, 11, 17, 18, 22, 23
- `apps/user_dashboard/src/components/search_empty_view/search_empty_view.tsx`: 6, 8, 9
- `apps/user_dashboard/src/components/sign_in_image/sign_in_image.tsx`: 4, 14
- `apps/user_dashboard/src/envs.ts`: 8, 14
- `apps/user_dashboard/src/fetch/index.ts`: 13, 14, 15
- `apps/user_dashboard/src/hooks/use_connected_apps.ts`: 41
- `apps/user_dashboard/user_dashboard.env.example`: 3, 4, 10
- `backend/admin_api/src/api/customer/index.ts`: 59, 162, 634
- `backend/admin_api/src/email/index.test.ts`: 26, 27, 28, 39, 40, 41, 42, 46, 58, 66, 67, 68, 69, 72, 95, 96, 97, 98, 101
- `backend/admin_api/src/email/index.ts`: 18, 22, 23, 25, 26, 90, 91, 97, 108, 113
- `backend/admin_api/src/routes/create_customer.ts`: 104, 105, 106, 107, 110, 112, 113, 114, 115
- `backend/admin_api/src/routes/create_customer_by_typeform.ts`: 96, 97, 98, 99, 102, 104, 105, 106, 107
- `backend/admin_api/src/routes/resend_customer_user_password.ts`: 127, 129, 130, 131, 132
- `backend/ct_dashboard_api/src/api/customer_auth.ts`: 27, 28, 29, 30, 31, 94, 95, 96, 97, 98, 99
- `backend/ct_dashboard_api/src/api/customer_info.ts`: 22, 23, 24, 25, 166, 167, 168, 169
- `backend/ct_dashboard_api/src/api/customer_password.ts`: 31, 32, 33, 34, 70, 71, 140, 142
- `backend/ct_dashboard_api/src/api/team_invitation.ts`: 35, 36, 37, 38, 43, 44, 396, 397, 522, 523
- `backend/ct_dashboard_api/src/email/inactive_reminder.ts`: 14
- `backend/ct_dashboard_api/src/email/password_reset.ts`: 9, 11, 16, 27, 32
- `backend/ct_dashboard_api/src/email/send.ts`: 120, 122
- `backend/ct_dashboard_api/src/email/team_invitation.ts`: 22
- `backend/ct_dashboard_api/src/email/unverified_reminder.ts`: 15
- `backend/ct_dashboard_api/src/email/verification.ts`: 13, 15, 20, 31, 36
- `backend/ct_dashboard_api/src/routes/v1/forgot_password.ts`: 83, 84, 85, 86, 87, 88
- `backend/ct_dashboard_api/src/routes/v1/invite_team_member.ts`: 78, 79, 80, 81, 82, 83
- `backend/ct_dashboard_api/src/routes/v1/resend_invitation.ts`: 71, 72, 73, 74, 75, 76
- `backend/ct_dashboard_api/src/routes/v1/send_code.ts`: 77, 78, 79, 80, 81, 82
- `backend/ct_dashboard_api/src/routes/v1/signin.ts`: 88, 89, 90, 91, 92
- `backend/ct_dashboard_api/src/routes/v1/update_customer_info.ts`: 124, 125, 126, 127
- `backend/bitcodex_api/server/bitcodex_api_server.env.example`: 7, 8, 9, 10, 11, 15, 16, 17, 18
- `backend/bitcodex_api/server/src/bin/launch.ts`: 61, 62, 63, 64, 65, 68, 69, 70, 71, 107, 108, 109, 110, 112, 119, 120, 121, 122, 124
- `backend/bitcodex_api/server/src/envs.ts`: 13, 14, 15, 16, 17, 21, 22, 23, 24
- `backend/bitcodex_api_server_state/src/index.ts`: 21, 43, 68, 90, 91, 92, 93, 94, 96, 97, 98, 99, 114, 115, 116, 117, 118, 120, 121, 122, 123
- `backend/user_dashboard_api/src/email/index.test.ts`: 26, 27, 28, 39, 40, 41, 42, 46, 58, 66, 67, 68, 69, 72, 95, 96, 97, 98, 101
- `backend/user_dashboard_api/src/email/index.ts`: 17, 21, 22, 24, 25, 58, 60, 99, 105
- `backend/user_dashboard_api/src/email/send.ts`: 118, 120
- `common/bitcodex_types/src/admin/email.ts`: 2, 3, 4, 5
- `common/bitcodex_types/src/ct_dashboard/email_verification.ts`: 54, 55
- `e2e_tests/src/scripts/test_seed_export.ts`: 53
- `embed/bitcodex_attached/index.html`: 25
- `embed/bitcodex_attached/bitcodex_attached.env.example`: 10
- `embed/bitcodex_attached/src/components/attached_initialized/use_initialize_app.ts`: 72, 128, 154, 235, 269
- `embed/bitcodex_attached/src/components/email/email_login.tsx`: 106
- `embed/bitcodex_attached/src/components/email_callback/use_callback.tsx`: 300
- `embed/bitcodex_attached/src/components/export/use_export_reauth.ts`: 54
- `embed/bitcodex_attached/src/components/modal_variants/eth/arbitrary_sig/siwe_sig/siwe_sig_title_badge/index.tsx`: 6, 15, 16, 19, 20
- `embed/bitcodex_attached/src/components/modal_variants/eth/tx_sig/sponsored_fee/base_sponsorship_background.module.scss`: 1
- `embed/bitcodex_attached/src/components/oauth_callback/send_oauth_payload.ts`: 20, 58
- `embed/bitcodex_attached/src/components/telegram/telegram_login.tsx`: 66
- `embed/bitcodex_attached/src/components/telegram_callback/use_callback.tsx`: 182
- `embed/bitcodex_attached/src/constants/urls.ts`: 1, 2, 4
- `embed/bitcodex_attached/src/envs.ts`: 3, 4
- `embed/bitcodex_attached/src/global.d.ts`: 25
- `embed/bitcodex_attached/src/requests/endpoints.ts`: 42, 43
- `embed/bitcodex_attached/src/store/app.ts`: 6
- `embed/bitcodex_attached/src/store/memory/index.ts`: 10, 61
- `embed/bitcodex_attached/src/window_msgs/export_private_key.ts`: 19, 41
- `embed/bitcodex_attached/src/window_msgs/generate_oauth_url.ts`: 8, 171, 182
- `embed/bitcodex_attached/src/window_msgs/get_auth_type.ts`: 3, 25
- `embed/bitcodex_attached/src/window_msgs/get_connected_apps.ts`: 3, 21, 32, 54, 71, 78
- `embed/bitcodex_attached/src/window_msgs/get_cosmos_chain_info.ts`: 8, 50, 66
- `embed/bitcodex_attached/src/window_msgs/get_email.ts`: 3, 25
- `embed/bitcodex_attached/src/window_msgs/get_eth_chain_info.ts`: 7, 54, 70
- `embed/bitcodex_attached/src/window_msgs/get_name.ts`: 3, 25
- `embed/bitcodex_attached/src/window_msgs/get_public_key.ts`: 3, 25
- `embed/bitcodex_attached/src/window_msgs/get_public_key_ed25519.ts`: 3, 25
- `embed/bitcodex_attached/src/window_msgs/get_wallet_info.ts`: 3, 30
- `embed/bitcodex_attached/src/window_msgs/index.ts`: 23, 41, 81, 113, 151, 255
- `embed/bitcodex_attached/src/window_msgs/oauth_info_pass/errors.ts`: 9, 28
- `embed/bitcodex_attached/src/window_msgs/oauth_info_pass/index.ts`: 43, 44, 156, 180, 399, 423
- `embed/bitcodex_attached/src/window_msgs/send.ts`: 3, 35
- `embed/bitcodex_attached/src/window_msgs/set_code_verifier.ts`: 6, 24
- `embed/bitcodex_attached/src/window_msgs/set_oauth_nonce.ts`: 6, 24
- `embed/bitcodex_attached/src/window_msgs/sign_out.ts`: 3, 17, 40
- `embed/bitcodex_attached/src/window_msgs/target.ts`: 1, 3
- `examples/cosmos_nextjs/.env.example`: 2
- `examples/cosmos_nextjs/components/Providers.tsx`: 15
- `examples/cosmoskit_nextjs/.env.example`: 2
- `examples/evm_nextjs/.env.example`: 2
- `examples/evm_nextjs/components/Providers.tsx`: 15
- `examples/evm_wagmi_nextjs/.env.example`: 2
- `examples/evm_wagmi_nextjs/components/wagmiConfig.ts`: 20
- `examples/interchainkit_nextjs/.env.example`: 2
- `examples/interchainkit_nextjs/app/page.tsx`: 26
- `examples/multi_ecosystem_react/.env.example`: 2
- `examples/multi_ecosystem_react/src/App.tsx`: 11
- `examples/svm_nextjs/.env.example`: 2
- `examples/svm_nextjs/components/Providers.tsx`: 15
- `internals/ci/src/cmds/build_cs.ts`: 25
- `internals/ci/src/cmds/build_frost.ts`: 25
- `internals/ci/src/cmds/deploy.ts`: 15
- `internals/ci/src/cmds/typecheck/index.ts`: 23
- `internals/ci/src/paths.ts`: 32, 34, 38, 41, 43, 45, 99, 187
- `internals/docker/docker-compose.yml`: 30, 31, 32, 33, 34, 36, 37, 38, 39
- `internals/docker/env.example`: 18, 19, 20, 21, 22, 26, 27, 28, 29
- `internals/tmux/README.md`: 19, 43
- `internals/tmux/tmux_e2e_start.sh`: 104, 105, 120
- `lerna.json`: 16, 28, 29, 30, 31, 32, 33
- `lib/aws/src/s3/index.test.ts`: 8, 9, 10, 11, 13, 15, 25, 30
- `lib/aws/src/s3/index.ts`: 8, 22, 37, 46
- `package.json`: 13, 14, 15, 16, 17, 18, 42
- `sandbox/sandbox_cosmos_kit/.env.example`: 2
- `sandbox/sandbox_evm/.env.local.example`: 14
- `sandbox/sandbox_evm/src/services/web3/wagmiConfig.tsx`: 36
- `sandbox/sandbox_evm/tsconfig.json`: 23, 24
- `sandbox/sandbox_interchain_kit/.env.example`: 2
- `sandbox/sandbox_interchain_kit/app/page.tsx`: 24
- `sandbox/sandbox_react_native/app/_layout.tsx`: 6
- `sandbox/sandbox_rialo/.env.example`: 2
- `sandbox/sandbox_rialo/src/components/Providers.tsx`: 44
- `sandbox/sandbox_simple_host/.env`: 1
- `sandbox/sandbox_simple_host/src/components/widgets/error_widget/error_widget.tsx`: 20
- `sandbox/sandbox_simple_host/src/state/sdk.ts`: 49, 84
- `sandbox/sandbox_simple_host/src/vite-env.d.ts`: 4
- `sandbox/sandbox_simple_host/tsconfig.json`: 19, 20, 21
- `sandbox/sandbox_sol/.env.example`: 2
- `sandbox/sandbox_sol/src/hooks/use_bitcodex_svm.ts`: 70
- `sdk/bitcodex_sdk_core/README.md`: 1
- `sdk/bitcodex_sdk_core/jest.config.js`: 17
- `sdk/bitcodex_sdk_core/package.json`: 31
- `sdk/bitcodex_sdk_core/src/methods/get_auth_type.ts`: 4, 12
- `sdk/bitcodex_sdk_core/src/methods/get_email.ts`: 2, 10
- `sdk/bitcodex_sdk_core/src/methods/get_name.ts`: 2, 10
- `sdk/bitcodex_sdk_core/src/methods/get_public_key.ts`: 2, 10
- `sdk/bitcodex_sdk_core/src/methods/get_public_key_ed25519.ts`: 2, 10
- `sdk/bitcodex_sdk_core/src/methods/get_wallet_info.ts`: 5, 13
- `sdk/bitcodex_sdk_core/src/methods/open_modal.ts`: 127, 255, 322
- `sdk/bitcodex_sdk_core/src/methods/send_msg_to_iframe.ts`: 43
- `sdk/bitcodex_sdk_core/src/methods/set_theme.ts`: 22
- `sdk/bitcodex_sdk_core/src/methods/sign_in/discord.ts`: 38, 80
- `sdk/bitcodex_sdk_core/src/methods/sign_in/email.ts`: 12, 44, 98
- `sdk/bitcodex_sdk_core/src/methods/sign_in/github.ts`: 38, 75
- `sdk/bitcodex_sdk_core/src/methods/sign_in/google.ts`: 38, 77
- `sdk/bitcodex_sdk_core/src/methods/sign_in/telegram.ts`: 11, 44, 89
- `sdk/bitcodex_sdk_core/src/methods/sign_in/x.ts`: 34, 73
- `sdk/bitcodex_sdk_core/src/methods/sign_out.ts`: 2, 8
- `sdk/bitcodex_sdk_core/src/types/msg/get_conn_apps.ts`: 2, 36
- `sdk/bitcodex_sdk_core/src/types/msg/index.ts`: 21, 27, 33, 39, 45, 51, 57, 63, 69, 75, 81, 87, 93, 99, 105, 111, 117, 123, 129, 135, 141, 147, 153, 159, 172, 178, 184, 190, 196, 204, 210, 218, 224, 230, 238, 252, 258, 304
- `sdk/bitcodex_sdk_core/src/types/bitcodex_wallet.ts`: 64
- `sdk/bitcodex_sdk_core/src/types/protected/export_priv_key.ts`: 4, 23
- `sdk/bitcodex_sdk_core/src/ui/signin_modal/components/default_view.ts`: 2, 28, 34
- `sdk/bitcodex_sdk_core/src/ui/signin_modal/icons.ts`: 1, 2, 4, 5, 6, 9, 10, 11
- `sdk/bitcodex_sdk_core/src/window_msg/listener.ts`: 32
- `sdk/bitcodex_sdk_core/src/window_msg/target.ts`: 1
- `sdk/bitcodex_sdk_core_react_native/package.json`: 30
- `sdk/bitcodex_sdk_core_react_native/src/BitcodeXWalletRN.ts`: 126, 132, 146, 152, 175
- `sdk/bitcodex_sdk_core_react_native/src/codec/rpc_codec.ts`: 8, 9, 30, 31, 58, 64, 107, 109, 112
- `sdk/bitcodex_sdk_cosmos/README.md`: 1
- `sdk/bitcodex_sdk_cosmos/jest.config.js`: 19
- `sdk/bitcodex_sdk_cosmos/package.json`: 33
- `sdk/bitcodex_sdk_cosmos/src/methods/open_modal.ts`: 17
- `sdk/bitcodex_sdk_cosmos/src/utils/chain.ts`: 17
- `sdk/bitcodex_sdk_cosmos/tsconfig.json`: 26
- `sdk/bitcodex_sdk_eth/README.md`: 1
- `sdk/bitcodex_sdk_eth/package.json`: 32
- `sdk/bitcodex_sdk_eth/src/chains.ts`: 44
- `sdk/bitcodex_sdk_eth/src/methods/make_signature.ts`: 123
- `sdk/bitcodex_sdk_eth/tsconfig.json`: 27
- `sdk/bitcodex_sdk_react/package.json`: 45
- `sdk/bitcodex_sdk_svm/README.md`: 1
- `sdk/bitcodex_sdk_svm/package.json`: 30
- `sdk/bitcodex_sdk_svm/src/methods/make_signature.ts`: 168
- `sdk/bitcodex_sdk_svm/tsconfig.json`: 27
- `ui/bitcodex_common_ui/src/icons/arbitrum_icon.tsx`: 3, 11
- `ui/bitcodex_common_ui/src/icons/base_icon.tsx`: 3, 8
- `ui/bitcodex_common_ui/src/icons/cosmos_icon.tsx`: 3, 11
- `ui/bitcodex_common_ui/src/icons/ethereum_blue_icon.tsx`: 3, 11
- `ui/bitcodex_common_ui/src/icons/ethereum_icon.tsx`: 3, 11
- `ui/bitcodex_common_ui/src/icons/google_icon.tsx`: 3, 11
- `ui/bitcodex_common_ui/src/icons/initia_icon.tsx`: 3, 11
- `ui/bitcodex_common_ui/src/icons/cosmos_compat_icon.tsx`: 1, 6
- `ui/bitcodex_common_ui/src/icons/leap_icon.tsx`: 3, 8
- `ui/bitcodex_common_ui/src/icons/logo_text_icon.tsx`: 3, 12
- `ui/bitcodex_common_ui/src/icons/metamask_icon.tsx`: 1, 9
- `ui/bitcodex_common_ui/src/icons/bitcodex_logo_color_icon.tsx`: 3, 18, 19
- `ui/bitcodex_common_ui/src/icons/bitcodex_logo_icon.tsx`: 3, 18, 19
- `ui/bitcodex_common_ui/src/icons/bitcodex_logo_with_name_icon.tsx`: 3, 18, 19
- `ui/bitcodex_common_ui/src/icons/bitcodex_product_logo_icon.tsx`: 1, 19, 20
- `ui/bitcodex_common_ui/src/icons/osmosis_icon.tsx`: 3, 11
- `ui/bitcodex_common_ui/src/icons/paths.ts`: 1, 2
- `ui/bitcodex_common_ui/src/icons/rialo_icon.tsx`: 3, 8
- `ui/bitcodex_common_ui/src/icons/solana_circle_icon.tsx`: 3, 11
- `ui/bitcodex_common_ui/src/icons/solana_icon.tsx`: 3, 11
- `ui/bitcodex_common_ui/src/icons/zigchain_icon.tsx`: 3, 11

**Shutdown and signup-disabled branches**

- `apps/attached_mobile_host_web/src/app/mobile/login/complete/_client.tsx`: 322, 323
- `apps/customer_dashboard/src/app/page.tsx`: 10, 45
- `apps/customer_dashboard/src/components/service_shutdown_modal/service_shutdown_modal.tsx`: 11, 15, 61
- `apps/demo_web/src/components/widgets/account_widget/account_widget.tsx`: 17, 85, 86, 122
- `apps/demo_web/src/components/widgets/account_widget/auth_progress_widget.tsx`: 21, 32, 73
- `apps/user_dashboard/src/app/layout.tsx`: 11, 68
- `apps/user_dashboard/src/components/service_shutdown_modal/service_shutdown_modal.tsx`: 12, 14, 26, 34, 44, 70
- `apps/user_dashboard/src/components/widgets/account_widget/account_widget.tsx`: 23, 78, 79, 114
- `apps/user_dashboard/src/components/widgets/account_widget/auth_progress_widget.tsx`: 19, 30, 65
- `backend/bitcodex_api/server/src/routes/tss_v1/keygen.ts`: 12, 101, 102, 104, 105, 109
- `backend/bitcodex_api/server/src/routes/tss_v2/keygen.ts`: 12, 92, 93, 95, 96, 100
- `backend/bitcodex_api_error_codes/src/index.ts`: 66
- `common/bitcodex_types/src/api_response/index.ts`: 77
- `embed/bitcodex_attached/src/components/modal_variants/error/error_modal.tsx`: 79
- `embed/bitcodex_attached/src/window_msgs/oauth_info_pass/handlers/new_user.ts`: 212, 215
- `embed/bitcodex_attached/src/window_msgs/oauth_info_pass/user.ts`: 266, 269
- `sdk/bitcodex_sdk_core/src/types/sign_in.ts`: 37

**Logo/icon/brand asset filename inventory**

- `apps/attached_mobile_host_web/public/bitcodex_favicon.svg`
- `apps/customer_dashboard/public/bitcodex_favicon.svg`
- `apps/demo_web/public/bitcodex_favicon.svg`
- `apps/docs_web/static/img/bitcodex-favicon.svg`
- `apps/docs_web/static/img/bitcodex-logo-dark.svg`
- `apps/docs_web/static/img/bitcodex-logo-light.svg`
- `apps/bitcodex_admin_web/public/bitcodex_favicon.svg`
- `apps/user_dashboard/public/bitcodex_favicon.svg`
- `backend/admin_api/src/routes/user_logout.ts`
- `crypto/tecdsa/cait_sith_cosmos_compat/logo.svg`
- `crypto/tecdsa/client_example/src/app/favicon.svg`
- `embed/bitcodex_attached/public/bitcodex_favicon.svg`
- `embed/bitcodex_attached/src/utils/favicon.ts`
- `examples/cosmos_nextjs/public/logo.svg`
- `examples/cosmoskit_nextjs/public/logo.svg`
- `examples/evm_nextjs/public/logo.svg`
- `examples/evm_wagmi_nextjs/public/logo.svg`
- `examples/interchainkit_nextjs/public/logo.svg`
- `examples/multi_ecosystem_react/public/logo.svg`
- `examples/svm_nextjs/public/logo.svg`
- `sandbox/sandbox_cosmos_kit/public/logo.svg`
- `sandbox/sandbox_evm/public/favicon.svg`
- `sandbox/sandbox_evm/public/logo.svg`
- `sandbox/sandbox_evm/public/manifest.json`
- `sandbox/sandbox_interchain_kit/public/logo.svg`
- `sandbox/sandbox_react_native/android/app/src/debugOptimized/AndroidManifest.xml`
- `sandbox/sandbox_react_native/android/app/src/main/AndroidManifest.xml`
- `sandbox/sandbox_react_native/android/app/src/main/res/drawable-hdpi/splashscreen_logo.svg`
- `sandbox/sandbox_react_native/android/app/src/main/res/drawable-mdpi/splashscreen_logo.svg`
- `sandbox/sandbox_react_native/android/app/src/main/res/drawable-xhdpi/splashscreen_logo.svg`
- `sandbox/sandbox_react_native/android/app/src/main/res/drawable-xxhdpi/splashscreen_logo.svg`
- `sandbox/sandbox_react_native/android/app/src/main/res/drawable-xxxhdpi/splashscreen_logo.svg`
- `sandbox/sandbox_react_native/assets/images/favicon.svg`
- `sandbox/sandbox_react_native/assets/images/partial-react-logo.svg`
- `sandbox/sandbox_react_native/assets/images/react-logo.svg`
- `sandbox/sandbox_react_native/assets/images/react-logo@2x.png`
- `sandbox/sandbox_react_native/assets/images/react-logo@3x.png`
- `sandbox/sandbox_rialo/public/logo.svg`
- `sandbox/sandbox_simple_host/public/favicon.svg`
- `sandbox/sandbox_sol/public/logo.svg`
- `sdk/bitcodex_sdk_core_react_native/android/src/main/AndroidManifest.xml`
- `sdk/bitcodex_sdk_svm/src/wallet-standard/icon.ts`
- `ui/bitcodex_common_ui/src/icons/logo_text_icon.tsx`
- `ui/bitcodex_common_ui/src/icons/logout.tsx`
- `ui/bitcodex_common_ui/src/icons/bitcodex_logo_color_icon.tsx`
- `ui/bitcodex_common_ui/src/icons/bitcodex_logo_icon.tsx`
- `ui/bitcodex_common_ui/src/icons/bitcodex_logo_with_name_icon.tsx`
- `ui/bitcodex_common_ui/src/icons/bitcodex_product_logo_icon.tsx`
- `ui/bitcodex_common_ui/src/logo/logo.module.scss`
- `ui/bitcodex_common_ui/src/logo/logo.tsx`

##### postMessage literal index
All message-type literals found in TS/JS source, including mobile/legacy/example/test contracts; this is a superset of the active dispatcher. It prevents assuming that every declared message is implemented.

- `__export_display_copy__`: `embed/bitcodex_attached/src/components/export/export_display.tsx:220`, `sdk/bitcodex_sdk_core/src/types/protected/export_display.ts:17`
- `__export_display_copy_error__`: `embed/bitcodex_attached/src/components/export/export_display.tsx:226`, `sdk/bitcodex_sdk_core/src/types/protected/export_display.ts:23`
- `__export_display_error__`: `embed/bitcodex_attached/src/components/export/export_display.tsx:148`, `sdk/bitcodex_sdk_core/src/types/protected/export_display.ts:11`
- `__export_display_resize__`: `embed/bitcodex_attached/src/components/export/export_display.tsx:177`, `sdk/bitcodex_sdk_core/src/types/protected/export_display.ts:5`
- `__export_private_key__`: `apps/user_dashboard/src/app/export_private_key/page.tsx:542`, `sdk/bitcodex_sdk_core/src/types/protected/export_priv_key.ts:5`
- `__export_private_key_ack__`: `embed/bitcodex_attached/src/window_msgs/export_private_key.ts:42`, `sdk/bitcodex_sdk_core/src/types/protected/export_priv_key.ts:24`
- `__export_reauth_received__`: `embed/bitcodex_attached/src/window_msgs/export_private_key.ts:110`
- `__get_connected_apps__`: `apps/user_dashboard/src/hooks/use_connected_apps.ts:42`, `sdk/bitcodex_sdk_core/src/types/msg/get_conn_apps.ts:3`
- `__get_connected_apps_ack__`: `embed/bitcodex_attached/src/window_msgs/get_connected_apps.ts:22`, `embed/bitcodex_attached/src/window_msgs/get_connected_apps.ts:33`, `embed/bitcodex_attached/src/window_msgs/get_connected_apps.ts:55`, `embed/bitcodex_attached/src/window_msgs/get_connected_apps.ts:72`, `embed/bitcodex_attached/src/window_msgs/get_connected_apps.ts:79`, `sdk/bitcodex_sdk_core/src/types/msg/get_conn_apps.ts:37`
- `generate_oauth_url`: `apps/attached_mobile_host_web/src/app/mobile/login/_client.tsx:127`, `sdk/bitcodex_sdk_core/src/methods/sign_in/discord.ts:39`, `sdk/bitcodex_sdk_core/src/methods/sign_in/github.ts:39`, `sdk/bitcodex_sdk_core/src/methods/sign_in/google.ts:39`, `sdk/bitcodex_sdk_core/src/methods/sign_in/x.ts:35`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:239`
- `generate_oauth_url_ack`: `embed/bitcodex_attached/src/window_msgs/generate_oauth_url.ts:172`, `embed/bitcodex_attached/src/window_msgs/generate_oauth_url.ts:183`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:253`
- `get_auth_type`: `sdk/bitcodex_sdk_core/src/methods/get_auth_type.ts:13`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:185`
- `get_auth_type_ack`: `embed/bitcodex_attached/src/window_msgs/get_auth_type.ts:26`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:191`
- `get_cosmos_chain_info`: `sdk/bitcodex_sdk_core/src/types/msg/index.ts:197`, `sdk/bitcodex_sdk_cosmos/src/utils/chain.ts:18`
- `get_cosmos_chain_info_ack`: `embed/bitcodex_attached/src/window_msgs/get_cosmos_chain_info.ts:51`, `embed/bitcodex_attached/src/window_msgs/get_cosmos_chain_info.ts:67`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:205`, `sdk/bitcodex_sdk_core_react_native/src/BitcodeXWalletRN.ts:147`, `sdk/bitcodex_sdk_core_react_native/src/BitcodeXWalletRN.ts:153`
- `get_email`: `sdk/bitcodex_sdk_core/src/methods/get_email.ts:11`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:142`
- `get_email_ack`: `embed/bitcodex_attached/src/window_msgs/get_email.ts:26`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:148`
- `get_eth_chain_info`: `sdk/bitcodex_sdk_core/src/types/msg/index.ts:211`, `sdk/bitcodex_sdk_eth/src/chains.ts:45`
- `get_eth_chain_info_ack`: `embed/bitcodex_attached/src/window_msgs/get_eth_chain_info.ts:55`, `embed/bitcodex_attached/src/window_msgs/get_eth_chain_info.ts:71`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:219`, `sdk/bitcodex_sdk_core_react_native/src/BitcodeXWalletRN.ts:127`, `sdk/bitcodex_sdk_core_react_native/src/BitcodeXWalletRN.ts:133`
- `get_name`: `sdk/bitcodex_sdk_core/src/methods/get_name.ts:11`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:154`
- `get_name_ack`: `embed/bitcodex_attached/src/window_msgs/get_name.ts:26`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:160`
- `get_public_key`: `sdk/bitcodex_sdk_core/src/methods/get_public_key.ts:11`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:22`
- `get_public_key_ack`: `embed/bitcodex_attached/src/window_msgs/get_public_key.ts:26`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:28`
- `get_public_key_ed25519`: `apps/attached_mobile_host_web/src/app/mobile/login/complete/_client.tsx:258`, `sdk/bitcodex_sdk_core/src/methods/get_public_key_ed25519.ts:11`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:34`
- `get_public_key_ed25519_ack`: `embed/bitcodex_attached/src/window_msgs/get_public_key_ed25519.ts:26`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:40`
- `get_wallet_info`: `apps/attached_mobile_host_web/src/app/mobile/login/complete/_client.tsx:239`, `sdk/bitcodex_sdk_core/src/methods/get_wallet_info.ts:14`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:173`
- `get_wallet_info_ack`: `embed/bitcodex_attached/src/window_msgs/get_wallet_info.ts:31`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:179`
- `hide_modal`: `sdk/bitcodex_sdk_core/src/types/msg/index.ts:118`
- `hide_modal_ack`: `sdk/bitcodex_sdk_core/src/types/msg/index.ts:124`
- `import_private_key`: `sdk/bitcodex_sdk_core/src/types/msg/index.ts:225`
- `import_private_key_ack`: `sdk/bitcodex_sdk_core/src/types/msg/index.ts:231`
- `init`: `embed/bitcodex_attached/src/components/attached_initialized/use_initialize_app.ts:129`, `embed/bitcodex_attached/src/components/attached_initialized/use_initialize_app.ts:155`, `embed/bitcodex_attached/src/components/attached_initialized/use_initialize_app.ts:236`, `embed/bitcodex_attached/src/components/attached_initialized/use_initialize_app.ts:270`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:130`
- `init_ack`: `apps/attached_mobile_host_web/src/app/mobile/_shared/use_attached_init.ts:41`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:136`, `sdk/bitcodex_sdk_core/src/window_msg/listener.ts:33`
- `oauth_info_pass`: `apps/attached_mobile_host_web/src/app/mobile/login/complete/_client.tsx:143`, `embed/bitcodex_attached/src/components/oauth_callback/send_oauth_payload.ts:21`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:82`
- `oauth_info_pass_ack`: `embed/bitcodex_attached/src/window_msgs/oauth_info_pass/index.ts:181`, `embed/bitcodex_attached/src/window_msgs/oauth_info_pass/index.ts:424`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:88`
- `oauth_sign_in_update`: `embed/bitcodex_attached/src/window_msgs/oauth_info_pass/errors.ts:29`, `embed/bitcodex_attached/src/window_msgs/oauth_info_pass/index.ts:157`, `embed/bitcodex_attached/src/window_msgs/oauth_info_pass/index.ts:400`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:70`
- `oauth_sign_in_update_ack`: `apps/attached_mobile_host_web/src/app/mobile/login/complete/_client.tsx:202`, `sdk/bitcodex_sdk_core/src/methods/sign_in/discord.ts:81`, `sdk/bitcodex_sdk_core/src/methods/sign_in/email.ts:99`, `sdk/bitcodex_sdk_core/src/methods/sign_in/github.ts:76`, `sdk/bitcodex_sdk_core/src/methods/sign_in/google.ts:78`, `sdk/bitcodex_sdk_core/src/methods/sign_in/telegram.ts:90`, `sdk/bitcodex_sdk_core/src/methods/sign_in/x.ts:74`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:76`
- `open_modal`: `sandbox/sandbox_simple_host/src/components/widgets/error_widget/error_widget.tsx:21`, `sdk/bitcodex_sdk_core/src/methods/sign_in/email.ts:45`, `sdk/bitcodex_sdk_core/src/methods/sign_in/telegram.ts:45`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:106`, `sdk/bitcodex_sdk_cosmos/src/methods/open_modal.ts:18`, `sdk/bitcodex_sdk_eth/src/methods/make_signature.ts:124`, `sdk/bitcodex_sdk_svm/src/methods/make_signature.ts:169`
- `open_modal_ack`: `embed/bitcodex_attached/src/components/email_callback/use_callback.tsx:301`, `embed/bitcodex_attached/src/components/telegram_callback/use_callback.tsx:183`, `embed/bitcodex_attached/src/store/memory/index.ts:62`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:112`
- `popup_ready`: `embed/bitcodex_attached/src/components/email/email_login.tsx:107`, `embed/bitcodex_attached/src/components/telegram/telegram_login.tsx:67`
- `set_code_verifier`: `sdk/bitcodex_sdk_core/src/types/msg/index.ts:58`
- `set_code_verifier_ack`: `embed/bitcodex_attached/src/window_msgs/set_code_verifier.ts:25`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:64`
- `set_oauth_nonce`: `sdk/bitcodex_sdk_core/src/methods/open_modal.ts:128`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:46`
- `set_oauth_nonce_ack`: `embed/bitcodex_attached/src/window_msgs/set_oauth_nonce.ts:25`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:52`
- `set_reauth_params`: `apps/attached_mobile_host_web/src/app/mobile/login/complete/_client.tsx:132`, `embed/bitcodex_attached/src/components/export/use_export_reauth.ts:55`
- `set_theme`: `sdk/bitcodex_sdk_core/src/methods/set_theme.ts:23`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:259`
- `sign_out`: `apps/attached_mobile_host_web/src/app/mobile/rpc/_client.tsx:54`, `apps/attached_mobile_host_web/src/app/mobile/sign-out/_client.tsx:34`, `sdk/bitcodex_sdk_core/src/methods/sign_out.ts:9`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:94`
- `sign_out_ack`: `embed/bitcodex_attached/src/window_msgs/sign_out.ts:18`, `embed/bitcodex_attached/src/window_msgs/sign_out.ts:41`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:100`
- `unknown_msg_type`: `embed/bitcodex_attached/src/window_msgs/index.ts:256`, `embed/bitcodex_attached/src/window_msgs/send.ts:36`, `sdk/bitcodex_sdk_core/src/methods/send_msg_to_iframe.ts:44`, `sdk/bitcodex_sdk_core/src/types/msg/index.ts:305`

#### Final verification notes

- Inventory totals: **70 Yarn workspace declarations, 69 unique paths, 65 existing manifests, four missing mock manifests; 12 Cargo members; 200 SVM/Solana/wallet-standard candidate files; 49 distinct postMessage literals**. Root package.json is the private orchestration root (ci/prepare scripts, Yarn 4.12.0, Node >=22), not an additional named workspace. Its dev tools are Biome, TypeScript, tsx, Husky, lint-staged, Lerna, Prettier, syncpack and Node types.
- Verification re-read confirmed all requested sections are present and the pre-existing introduction remains. Only the requested Markdown document was deliberately edited; setup attempts downloaded toolchain/dependency/cache artifacts. No source test/lint auto-fixer was run for this documentation-only change.
- Additional read-only verification used rg over callbacks, modal_dialog.tsx, parser.ts, use_calculate_fee.ts, token metadata and native-addon exports. Missing-path probes for components/modals, addon/src/server.ts or server/sign.ts, middleware/bearer_token.ts, sdk-core constants.ts and unmatched middleware globs returned No such file/no matches; corrected files were discovered with rg --files. No runtime service command was attempted after disk-full failure.
- API git/index.ts:getCommitHash catches missing Git metadata and returns an empty string; absence of Git is a provenance issue, not by itself a fatal API launch condition.
- Completeness limit: all root manifest members and lexical candidates are enumerated; third-party package internals, live OAuth/provider traffic, runtime tests and full UI behavior were not verified. “Understand completely” cannot honestly be certified while those execution checks remain blocked.

#### Open questions

1. May a later implementation session re-enable the disabled v1/v2 signup handlers? It is required for the requested fresh demo acceptance; it was not authorized under this session's “do not change code” constraint.
2. Does “never exists in one place” allow the existing dealer-based initial keygen? If not, reusing BitcodeX keygen unchanged is incompatible with the spec and needs a cryptographic design decision.
3. Which owned Google/GitHub/X/Discord apps, Telegram bot and Auth0 tenant will be used? Is fully self-hosted wallet email OTP a requirement (which needs new identity-provider functionality, not merely SMTP)?
4. Where should enough local build/container disk space be provisioned? This session did not delete unrelated data or caches.
5. Should client shares remain in localStorage, or must BitcodeX require memory-only/session/encrypted storage? Define recovery and mobile sign-out expectations.
6. Are two KSNs on one machine only a local demo topology? They do not provide independent failure domains.
7. Which authoritative clone/license/commit should replace this archive snapshot? Existing claims about upstream dates and license provenance were not verified here.
8. What exact MinIO endpoint/public URL and Mailpit auth setup should be implemented later? Current env-only guide is incomplete.
9. What is the desired Bittensor export format and whether the existing Ed25519 key is shared across ecosystems? Current export is a Solana base58 keypair.
10. After blockers are removed, acceptance should record UI approval, public key, message and verifiable signature only—never seed, share, JWT or FROST nonces.

#### Risks

- **Critical product blocker:** signup shutdown code makes current fresh-wallet demo impossible without edits.
- **Key model mismatch:** seed and both shares coexist at dealer keygen; full key export is intentionally supported; client package persists in browser storage.
- **Logging:** I/window_msgs/index.ts logs event.data before dispatch, so oauth_info_pass payloads can reach debug console. Backend client logger prints its options (potential ES password). These source observations contradict a blanket “no tokens/secrets in logs” guarantee. No live secret-bearing test was run.
- **SVM display limitations:** address lookup table resolution is absent in the versioned parser; fee calculation uses hard-coded constants rather than live RPC. Unknown/failed instruction parsing must not silently hide calls in a new ecosystem.
- **Signing trust boundary:** bind decoded/displayed bytes to signed bytes; verify origin handling and modal routing in a dedicated security review.
- **FROST nonce lifecycle:** server stage_data retains nonces/message and later completed signature share; concurrent round2/replay behavior requires explicit tests/transaction review. Do not infer race safety solely from a COMPLETED-state check.
- **Availability:** registration threshold versus recovery threshold differ; KSN registration precedes disabled/failed API keygen, allowing partial-registration leftovers.
- **Transport:** fragments are encrypted at rest by KSN, but sent as JSON over configured transport. Local HTTP does not provide network confidentiality.
- **Infrastructure:** disk full, Docker unavailable, global Yarn 1 mismatch, absent tmux, absent mock manifests, no successful dependency install; all runtime claims remain unverified.
- **External coupling:** hosted Auth0, OAuth configuration, Keplr metadata/interpreter, Jupiter and bucket URLs complicate the claimed completely self-hosted stack.
- **Snapshot provenance:** no root LICENSE or Git history; Rust dependencies include a Git-pinned dev dependency and multiple vendored licenses; restore authoritative attribution before rebrand/distribution.

#### Spec contradictions / unverified claims to carry forward

- “Run unchanged BitcodeX locally and create a fresh wallet” contradicts unconditional SIGNUP_DISABLED.
- “Never full key except export” contradicts seed-based dealer generation.
- “Email OTP via local SMTP/Mailpit” contradicts Auth0 passwordless implementation.
- “Memory-only client share” is not current Zustand persist behavior.
- “Server stored then client SSS/register” reverses actual order.
- “New user registers /register/ed25519” confuses new signup with existing-wallet upgrade.
- “KSNs participate in signing ceremonies” is inaccurate for this Ed25519 path.
- “MinIO is just S3 env replacement” is not established by the upload helper/public URL design.
- “All apps Next.js except docs” misses current Vite mobile host scripts.
- “Mock packages exist” contradicts four missing workspace manifests.
- “Only user-dashboard shutdown modal” misses customer dashboard modal and both backend signup blocks.
- “Solana onchain widget sends a transaction” is false: it signs and logs only.
- “Complete/maintained provenance at commit 6306354” cannot be proven from this non-Git snapshot.
- Bittensor Ed25519 acceptance, metadata/signed extensions, proxy permissions, SS58/export and FROST-signed transfer remain separate required probes; none was performed here.

**Stop point:** application code unchanged; no commits, pushes or PRs; no successful local stack/signing claim. Await user direction on the explicit blockers above.

