# BitcodeX Multi‑Ecosystem (React + Vite)

React + Vite example that connects to both Cosmos (Osmosis testnet) and EVM
(Ethereum Sepolia) using BitcodeX. Shows social sign‑in, account display,
and simple transfers for each ecosystem.

### Requirements

- Node.js 22+
- Yarn (workspaces)

### Environment Variables

Create a `.env` file in this directory and set your BitcodeX API key:

```bash
cp .env.example .env
```

```bash
# .env
VITE_BITCODEX_API_KEY=YOUR_ISSUED_API_KEY
```

Get your API key from the
[BitcodeX Dashboard](https://dapp.bitcodex.invalid).

### How to Run

```bash
yarn install
yarn dev
```

Open `http://localhost:5173` in your browser.
