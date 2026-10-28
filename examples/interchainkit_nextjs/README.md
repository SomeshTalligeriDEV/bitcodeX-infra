## BitcodeX Interchain Kit + Next.js Example

A minimal example that integrates BitcodeX Cosmos SDK with Next.js. It
connects to the Osmosis Testnet by default and demonstrates social sign-in,
account info, and a simple transfer transaction.

### Requirements

- Node.js 22+
- Yarn (workspaces)

### Environment Variables

Create a `.env.local` file in this directory and set your BitcodeX API
key.

```bash
cp .env.example .env.local
```

```bash
# .env.local
NEXT_PUBLIC_BITCODEX_API_KEY=YOUR_ISSUED_API_KEY
```

Note: Use the API key issued from the
[BitcodeX Dashboard](https://dapp.bitcodex.invalid).

### How to Run

```bash
yarn install
yarn dev
```

Open `http://localhost:3000` in your browser.
