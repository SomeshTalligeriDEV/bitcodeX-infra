import {
  Callout,
  Cards,
  DocCard,
  Lead,
} from "@bitcodex-demo-web/components/docs/parts";

export default function Page() {
  return (
    <>
      <h1>BitcodeX</h1>
      <Lead>
        Embedded wallets for Bittensor. Your users sign in with Google or a
        wallet and get a real Bittensor account, with no extension and no seed
        phrase. Every signature is approved in a readable popup.
      </Lead>

      <Cards>
        <DocCard href="/docs/quickstart" title="Quickstart">
          Add login and a wallet to a React app in about ten minutes.
        </DocCard>
        <DocCard href="/docs/wallet-api" title="Wallet API">
          Send TAO, stake, register hotkeys, sign messages.
        </DocCard>
        <DocCard href="/docs/server" title="Verify users">
          Check a user on your backend with a signed access token.
        </DocCard>
        <DocCard href="/docs/self-host" title="Run it yourself">
          Deploy the API, key share nodes and wallet frame.
        </DocCard>
      </Cards>

      <h2>How it works</h2>
      <ol>
        <li>
          <strong>User logs in.</strong> The BitcodeX login window opens in an
          isolated frame. On the first login a Bittensor account (a{" "}
          <em>coldkey</em>, an address starting with <code>5</code>) is created.
        </li>
        <li>
          <strong>The key is never in one place.</strong> It is split 2-of-2
          between the user&apos;s browser and the BitcodeX server using
          threshold Ed25519 signatures (FROST). Neither side can sign alone, and
          the whole key is never rebuilt, except when the user exports it.
        </li>
        <li>
          <strong>Your app asks, the user approves.</strong> Your code calls{" "}
          <code>sendTao</code>, <code>stake</code> or <code>signMessage</code>.
          A popup shows what the call does in plain English, with the fee.
          Nothing is signed until the user approves.
        </li>
        <li>
          <strong>Your backend verifies.</strong> The SDK gives your app a
          short-lived signed token that your server checks to know who is logged
          in.
        </li>
      </ol>

      <h2>What you get</h2>
      <table>
        <tbody>
          <tr>
            <td>Login</td>
            <td>
              Google, and any Bittensor wallet (Talisman, SubWallet,
              Polkadot.js)
            </td>
          </tr>
          <tr>
            <td>Wallet</td>
            <td>
              Balances, send TAO, stake and unstake with exact quotes, history
            </td>
          </tr>
          <tr>
            <td>Hotkeys</td>
            <td>
              Add, register on a subnet at the exact on-chain cost, read UIDs
            </td>
          </tr>
          <tr>
            <td>Permissions</td>
            <td>
              Let an app or AI agent act for a user through on-chain proxies
            </td>
          </tr>
          <tr>
            <td>Safety</td>
            <td>
              Confirmation popup, red warning for unknown calls, key export
              behind re-login
            </td>
          </tr>
          <tr>
            <td>Networks</td>
            <td>
              Local test chain and Bittensor testnet. Mainnet is off until an
              audit.
            </td>
          </tr>
        </tbody>
      </table>

      <Callout kind="warn">
        BitcodeX runs on <strong>testnet and local chains only</strong> for now.
        Mainnet is turned off until the key system has an independent security
        audit.
      </Callout>
    </>
  );
}
