import { CodeBlock } from "@bitcodex-demo-web/components/docs/code_block";
import { Callout, Lead } from "@bitcodex-demo-web/components/docs/parts";

export default function Page() {
  return (
    <>
      <h1>Quickstart</h1>
      <Lead>
        Add Bittensor login and a wallet to a React app. You need two values
        from your BitcodeX deployment: an <strong>API key</strong> and the{" "}
        <strong>wallet frame URL</strong>.
      </Lead>

      <h2>1. Get an API key</h2>
      <p>
        Your API key and app ID come from the developer dashboard, or from the
        bootstrap script when you self-host (see{" "}
        <a href="/docs/self-host">Self-host</a>). The API key is public: it
        ships in your browser code. The <strong>app secret</strong> is private
        and used only on your server.
      </p>
      <p>
        Also add your site&apos;s address to the app&apos;s{" "}
        <strong>allowed origins</strong>. The wallet frame refuses any site that
        is not on that list.
      </p>

      <h2>2. Install</h2>
      <p>
        The packages are hosted on this site, so anyone can install them with no
        account. Install the four together (they depend on each other):
      </p>
      <CodeBlock
        lang="bash"
        code={`BASE=https://bitcodex-demo.vercel.app/downloads
npm install \\
  $BASE/adityaghgh-sdk-react-0.1.0.tgz \\
  $BASE/adityaghgh-sdk-bittensor-0.1.0.tgz \\
  $BASE/adityaghgh-sdk-core-0.1.0.tgz

# on your server only (verify users):
npm install $BASE/adityaghgh-server-0.1.0.tgz`}
      />
      <Callout>
        These are the same packages as the <code>@adityaghgh/sdk-react</code>,{" "}
        <code>@adityaghgh/sdk-bittensor</code>,{" "}
        <code>@adityaghgh/sdk-core</code> and <code>@adityaghgh/server</code>{" "}
        names used below. When they are published to the npm registry,{" "}
        <code>npm install @adityaghgh/sdk-react</code> will work too. Use
        TypeScript with <code>skipLibCheck: true</code>.
      </Callout>

      <h2>3. Wrap your app</h2>
      <CodeBlock
        title="app/providers.tsx"
        code={`"use client";
import { BitcodeXProvider } from "@adityaghgh/sdk-react";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <BitcodeXProvider
      config={{
        apiKey: process.env.NEXT_PUBLIC_BITCODEX_API_KEY!,
        sdkEndpoint: "https://wallet.your-domain.com", // the wallet frame
        bittensor: { chainId: "bittensor:testnet" },
      }}
    >
      {children}
    </BitcodeXProvider>
  );
}`}
      />

      <h2>4. Add login</h2>
      <CodeBlock
        title="login.tsx"
        code={`"use client";
import { useBitcodeX } from "@adityaghgh/sdk-react";
import { useBitcodeXBittensor } from "@adityaghgh/sdk-react/bittensor";

export function Login() {
  const { isReady, isSignedIn, signIn, signOut } = useBitcodeX();
  const { address } = useBitcodeXBittensor();

  if (!isReady) return <p>Loading…</p>;
  if (!isSignedIn) {
    return <button onClick={() => signIn("google")}>Continue with Google</button>;
  }
  return (
    <>
      <p>Your Bittensor address: {address}</p>
      <button onClick={() => signOut()}>Sign out</button>
    </>
  );
}`}
      />
      <p>
        On the first login a coldkey is created for the user. The address starts
        with <code>5</code> and works on any Bittensor tool.
      </p>

      <h2>5. Send a transaction</h2>
      <CodeBlock
        code={`const { bittensorWallet } = useBitcodeXBittensor();

// The user sees a popup with the amount, destination and fee, and must approve.
const { txHash } = await bittensorWallet!.sendTao("5F…destination", "0.1");`}
      />
      <p>
        A new wallet has no funds. On testnet, see{" "}
        <a href="/docs/networks">Networks & testnet TAO</a> for how to fund it.
      </p>

      <h2>6. Verify the user on your server</h2>
      <CodeBlock
        title="client"
        code={`const { wallet } = useBitcodeX();
const token = await wallet?.getAccessToken(); // short-lived, signed
await fetch("/api/me", { headers: { Authorization: \`Bearer \${token}\` } });`}
      />
      <CodeBlock
        title="server"
        code={`import { verifyAccessToken } from "@adityaghgh/server";

const result = await verifyAccessToken(token, {
  appId: process.env.BITCODEX_APP_ID!,
  apiUrl: "https://api.your-domain.com",
});
if (!result.success) throw new Error(result.msg);
console.log(result.data.userId, result.data.address);`}
      />
      <p>
        Never trust a user ID sent by the browser. Always verify the token. More
        in <a href="/docs/server">Verify users</a>.
      </p>
    </>
  );
}
