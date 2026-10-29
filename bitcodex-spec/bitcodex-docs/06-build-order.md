# 06 · Build order

Be honest about time: this is a big codebase. The hackathon target is **Phases 0–4** (a working "Privy for Bittensor" demo on localnet). Phases 5–6 are for after, or for whoever finishes early.

| Phase | Features | Done when |
|---|---|---|
| **0 · Understand + prove** (day 1 morning) | Prompt 1, Prompt 2 | codebase map written; **FROST-signed Ed25519 transfer accepted on localnet** (probe 3b). If this fails, stop and decide (fallback below). |
| **1 · Rebrand + run** (day 1) | X01 | all services run locally with BitcodeX branding; BitcodeX's Solana demo still signs |
| **2 · Bittensor wallet core** (day 1–2) | X02, X03, X14 | Google login creates a Bittensor address; faucet funds it; send TAO from the demo app with a decoded confirm modal |
| **3 · Login + actions** (day 2–3) | X04 (email, Google, external wallet; passkey stretch), X05 (send, stake, sign message, history), X08 (hotkey register) | every demo step in 08-demo.md works from the UI |
| **4 · Demo + integration** (day 3) | X15 demo app, X16 Tensor Studio login (**deferred**: Tensor Studio, formerly Bitcode Studio, is not built yet), X07 export | 3-minute demo rehearsed; backup video recorded |
| **5 · Platform** (after, or early finisher) | X09 proxies, X06 user dashboard, X11 dev dashboard, X10 server SDK | an AI agent stakes for a user through a Staking proxy |
| **6 · Extras** | X12 MFA, X13 EVM address, Stage B rename | |

## Who does what (two builders)

- **Builder 1 (M3):** Phase 0 probes, X02, X03, X05, X15.
- **Builder 2 (M2):** X01 rebrand, OAuth apps + X04, X14 faucet, X08 hotkeys. X16 deferred (Tensor Studio not built yet).
- Sync at noon and evening: merge, run the demo path on a fresh localnet.

## Fallback if probe 3b fails

If the chain rejects the FROST Ed25519 signature and the cause cannot be fixed in half a day:
1. Keep BitcodeX's login, KSN backup and iframe, but replace FROST with a **single sr25519 key whose seed is split by SSS** (server share + KSN shares), rebuilt in the iframe only at signing time. Weaker than "never rebuilt", must be said honestly in the pitch.
2. Or use BitcodeX unchanged for login and keep the Bittensor wallet as the Bitcode 12-word wallet.
Decide with the team; do not switch silently.

## Drop order if late

X12 → X13 → X11 → X06 → X10 → X09 → passkey → external-wallet login. **Never drop:** Google/email login creating a Bittensor wallet, send TAO with the confirm modal, stake, register hotkey, demo app.
