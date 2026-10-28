# BitcodeX Bittensor (Next.js)

Sign in with Google, get a Bittensor coldkey (FROST 2-of-2 ed25519, SS58 address
starting with `5`) and send TAO on localnet. Signing happens in the BitcodeX iframe.

```bash
cp .env.example .env.local   # set NEXT_PUBLIC_BITCODEX_API_KEY
yarn dev                     # http://localhost:3210
```

Needs the local stack (`scripts/dev-up.sh`): iframe on :3201, localnet on :9944.
