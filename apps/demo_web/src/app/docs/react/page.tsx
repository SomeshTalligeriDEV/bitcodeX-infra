import { CodeBlock } from "@bitcodex-demo-web/components/docs/code_block";
import { Lead } from "@bitcodex-demo-web/components/docs/parts";

export default function Page() {
  return (
    <>
      <h1>React hooks</h1>
      <Lead>
        Two hooks and one provider. Everything else lives on the wallet object (
        <a href="/docs/wallet-api">Wallet API</a>).
      </Lead>

      <h2>BitcodeXProvider</h2>
      <CodeBlock
        code={`<BitcodeXProvider
  config={{
    apiKey: "…",                       // public key from your dashboard
    sdkEndpoint: "https://wallet…",    // the wallet frame URL
    bittensor: { chainId: "bittensor:testnet" }, // or "bittensor:localnet"
  }}
>`}
      />
      <p>
        <code>chainId</code> is <code>bittensor:localnet</code> or{" "}
        <code>bittensor:testnet</code>. Mainnet is refused until an external
        audit.
      </p>

      <h2>useBitcodeX()</h2>
      <table>
        <thead>
          <tr>
            <th>Value</th>
            <th>What it is</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>isReady</td>
            <td>
              The wallet frame has loaded. Wait for it before showing login.
            </td>
          </tr>
          <tr>
            <td>isSignedIn</td>
            <td>True when a user is logged in.</td>
          </tr>
          <tr>
            <td>authType, email, name</td>
            <td>How the user signed in, and their profile.</td>
          </tr>
          <tr>
            <td>wallet</td>
            <td>
              The core wallet. <code>wallet.getAccessToken()</code> returns the
              signed token for your backend.
            </td>
          </tr>
          <tr>
            <td>signIn(provider)</td>
            <td>
              Start a login with <code>&quot;google&quot;</code> (or{" "}
              <code>&quot;github&quot;</code> when configured on the server).
            </td>
          </tr>
          <tr>
            <td>openSignInModal(options?)</td>
            <td>
              Open the BitcodeX login window with every method your app enabled.
            </td>
          </tr>
          <tr>
            <td>signOut()</td>
            <td>End the session.</td>
          </tr>
          <tr>
            <td>setTheme(theme)</td>
            <td>Set the login window theme.</td>
          </tr>
        </tbody>
      </table>

      <h3>openSignInModal options</h3>
      <CodeBlock
        code={`await openSignInModal({
  loginMethods: ["google"],   // override the dashboard setting for this call
  accentColor: "#7F56D9",     // or null for black and white
  logoUrl: "https://…/logo.png",
  theme: "dark",              // "light" | "dark" | "system"
});`}
      />
      <p>
        If you pass nothing, the window uses the settings from your developer
        dashboard.
      </p>

      <h2>useBitcodeXBittensor()</h2>
      <p>
        Import from <code>@adityaghgh/sdk-react/bittensor</code>.
      </p>
      <table>
        <tbody>
          <tr>
            <td>bittensorWallet</td>
            <td>
              The Bittensor wallet (see Wallet API), or null before login.
            </td>
          </tr>
          <tr>
            <td>address</td>
            <td>The user&apos;s SS58 address (starts with 5).</td>
          </tr>
          <tr>
            <td>isReady, isInitialized</td>
            <td>Wallet readiness flags.</td>
          </tr>
        </tbody>
      </table>

      <h2>Log in with a Bittensor wallet</h2>
      <p>
        Users who already have Talisman, SubWallet or Polkadot.js can log in by
        signing a message (Sign-In with Bittensor). These users get no embedded
        key, because their key already lives in the extension.
      </p>
      <CodeBlock
        code={`const accounts = await bittensorWallet.listExtensionAccounts("My app");
const { accessToken } = await bittensorWallet.loginWithWallet(accounts[0]);

// Already signed in with Google? Link a wallet to the same user:
await bittensorWallet.linkWallet(accounts[0]);`}
      />
    </>
  );
}
