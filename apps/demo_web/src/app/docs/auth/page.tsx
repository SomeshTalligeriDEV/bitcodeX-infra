import { CodeBlock } from "@bitcodex-demo-web/components/docs/code_block";
import { Callout, Lead } from "@bitcodex-demo-web/components/docs/parts";

const PROVIDERS =
  '"use client";\nimport { BitcodeXProvider } from "@adityaghgh/sdk-react";\n\nexport function Providers({ children }: { children: React.ReactNode }) {\n  return (\n    <BitcodeXProvider\n      config={{\n        apiKey: process.env.NEXT_PUBLIC_BITCODEX_API_KEY!,\n        sdkEndpoint: process.env.NEXT_PUBLIC_BITCODEX_WALLET_URL!,\n        bittensor: { chainId: "bittensor:testnet" },\n      }}\n    >\n      {children}\n    </BitcodeXProvider>\n  );\n}';
const AUTH_BUTTON =
  // biome-ignore lint/suspicious/noTemplateCurlyInString: example code shown to readers, kept literal
  '"use client";\nimport { useBitcodeX } from "@adityaghgh/sdk-react";\nimport { useBitcodeXBittensor } from "@adityaghgh/sdk-react/bittensor";\nimport { useState } from "react";\n\nexport function AuthButton() {\n  const { isReady, isSignedIn, signIn, signOut, email, wallet } = useBitcodeX();\n  const { address } = useBitcodeXBittensor();\n  const [me, setMe] = useState<string | null>(null);\n\n  if (!isReady) return <p>Loading\u2026</p>;\n\n  if (!isSignedIn) {\n    return <button onClick={() => signIn("google")}>Continue with Google</button>;\n  }\n\n  // Ask YOUR server who this is: it verifies the token before answering.\n  async function loadMe() {\n    const token = await wallet?.getAccessToken();\n    if (!token) return;\n    const res = await fetch("/api/me", { headers: { Authorization: `Bearer ${token}` } });\n    setMe(JSON.stringify(await res.json()));\n  }\n\n  return (\n    <div>\n      <p>Signed in as {email} \u00b7 wallet {address}</p>\n      <button onClick={loadMe}>Check with my server</button>\n      <button onClick={() => signOut()}>Sign out</button>\n      {me && <pre>{me}</pre>}\n    </div>\n  );\n}';
const ROUTE =
  '// app/api/me/route.ts\nimport { verifyAccessToken } from "@adityaghgh/server";\n\nexport async function GET(req: Request) {\n  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";\n\n  const result = await verifyAccessToken(token, {\n    appId: process.env.BITCODEX_APP_ID!,\n    apiUrl: process.env.BITCODEX_API_URL!,\n  });\n  if (!result.success) {\n    return Response.json({ error: result.err }, { status: 401 });\n  }\n\n  // result.data.userId is now trustworthy: use it as your user\'s ID.\n  return Response.json({\n    userId: result.data.userId,\n    address: result.data.address,\n    expiresAt: result.data.expiresAt,\n  });\n}';
const EXPRESS =
  'import express from "express";\nimport { verifyAccessToken } from "@adityaghgh/server";\n\nconst app = express();\n\nasync function requireUser(req: express.Request, res: express.Response, next: express.NextFunction) {\n  const token = req.headers.authorization?.replace("Bearer ", "") ?? "";\n  const result = await verifyAccessToken(token, {\n    appId: process.env.BITCODEX_APP_ID!,\n    apiUrl: process.env.BITCODEX_API_URL!,\n  });\n  if (!result.success) return res.status(401).json({ error: result.err });\n  res.locals.user = result.data; // { userId, address, ... }\n  next();\n}\n\napp.get("/api/me", requireUser, (_req, res) => res.json(res.locals.user));\napp.listen(4000);';

const ENV = `# .env.local  (frontend values are public, server values stay on your server)
NEXT_PUBLIC_BITCODEX_API_KEY=cc682a9054e36b02c6b3e3840441e77460830a5a9de0af6870ceb37b9a59519e
NEXT_PUBLIC_BITCODEX_WALLET_URL=https://bitcodex-iframe.onrender.com

BITCODEX_APP_ID=9fab93a0-b9ff-4fc7-8d18-3a9a7ae7c946
BITCODEX_API_URL=https://bitcodex-api.onrender.com`;

const INSTALL = `BASE=https://bitcodex-demo.vercel.app/downloads

# frontend
npm install \\
  $BASE/adityaghgh-sdk-react-0.1.1.tgz \\
  $BASE/adityaghgh-sdk-bittensor-0.1.1.tgz \\
  $BASE/adityaghgh-sdk-core-0.1.1.tgz

# backend (Node 22+)
npm install $BASE/adityaghgh-server-0.1.1.tgz`;

export default function Page() {
  return (
    <>
      <h1>Add sign-in to your app</h1>
      <Lead>
        Use BitcodeX as the login for your own app. Your users sign in with
        Google, you get a <strong>verified user ID</strong> and a real{" "}
        <strong>Bittensor wallet address</strong> for each one, and you never
        handle passwords or keys.
      </Lead>

      <h2>How the login works</h2>
      <ol>
        <li>
          The user clicks <strong>Continue with Google</strong> in your app. The
          BitcodeX login window opens.
        </li>
        <li>
          On the first login a Bittensor wallet is created for them. Your app
          receives their address.
        </li>
        <li>
          Your frontend asks BitcodeX for a short-lived signed{" "}
          <strong>access token</strong> and sends it to your backend.
        </li>
        <li>
          Your backend <strong>verifies the token</strong> and now knows, for
          certain, who the user is.
        </li>
      </ol>
      <Callout kind="warn">
        Never trust a user ID that the browser sends on its own. Always verify
        the token on your server (step 5). That check is what makes it real
        authentication.
      </Callout>

      <h2>0. What you need before you start</h2>
      <table>
        <thead>
          <tr>
            <th>You need</th>
            <th>Where it comes from</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Your site&apos;s address added to the allow-list</td>
            <td>
              Send the person who runs this BitcodeX deployment the exact
              address(es) your app uses, such as <code>https://myapp.com</code>{" "}
              and, for development, <code>http://localhost:3000</code>. The
              wallet window refuses any site that is not on the list. Adding one
              takes about 15 minutes.
            </td>
          </tr>
          <tr>
            <td>Your testers added to Google</td>
            <td>
              The Google login is in <strong>Testing</strong> mode, so only
              Gmail addresses added as test users can sign in (up to 100). Send
              them the addresses to add.
            </td>
          </tr>
          <tr>
            <td>Node 22+ and a React or Next.js app</td>
            <td>Any React 18+ app works. The server example is plain Node.</td>
          </tr>
        </tbody>
      </table>
      <p>
        <strong>Prefer to run it all yourself?</strong> Follow{" "}
        <a href="/docs/self-host">Self-host &amp; deploy</a>
        to run your own backend. Then you create your own app, API key and
        allow-list, and need nobody else.
      </p>

      <h2>1. Values for the shared testnet deployment</h2>
      <p>
        These are public identifiers, safe to put in browser code. The{" "}
        <strong>app secret is never needed</strong> for this guide.
      </p>
      <CodeBlock lang="bash" title=".env.local" code={ENV} />
      <table>
        <tbody>
          <tr>
            <td>Network</td>
            <td>
              Bittensor <strong>testnet</strong> (no real money)
            </td>
          </tr>
          <tr>
            <td>Wallet window</td>
            <td>
              <code>https://bitcodex-iframe.onrender.com</code>
            </td>
          </tr>
          <tr>
            <td>API</td>
            <td>
              <code>https://bitcodex-api.onrender.com</code>
            </td>
          </tr>
        </tbody>
      </table>
      <Callout>
        The first request after a quiet period can take about a minute, because
        the free hosting wakes up. Open the API address once before a demo.
      </Callout>

      <h2>2. Install</h2>
      <CodeBlock lang="bash" code={INSTALL} />
      <p>
        Set <code>skipLibCheck: true</code> in your <code>tsconfig.json</code>.
        When the packages are on the npm registry you can use{" "}
        <code>
          npm install @adityaghgh/sdk-react @adityaghgh/sdk-bittensor
          @adityaghgh/sdk-core
        </code>{" "}
        instead.
      </p>

      <h2>3. Wrap your app</h2>
      <CodeBlock title="app/providers.tsx" code={PROVIDERS} />
      <p>
        Then use <code>&lt;Providers&gt;</code> around{" "}
        <code>{`{children}`}</code> in <code>app/layout.tsx</code>.
      </p>

      <h2>4. Add the login button</h2>
      <CodeBlock title="components/auth-button.tsx" code={AUTH_BUTTON} />
      <p>
        <code>isSignedIn</code> tells you whether someone is logged in,{" "}
        <code>email</code> and <code>address</code> describe them, and{" "}
        <code>signOut()</code> ends the session. The{" "}
        <code>getAccessToken()</code> call returns the signed token for your
        server.
      </p>

      <h2>5. Verify the user on your server</h2>
      <p>Next.js route handler:</p>
      <CodeBlock title="app/api/me/route.ts" code={ROUTE} />
      <p>Or Express, as reusable middleware that protects any route:</p>
      <CodeBlock title="server.ts" code={EXPRESS} />
      <p>
        <code>userId</code> is stable for a user, so use it as your primary key.
        The token is valid for one hour. After you verify it you can issue your
        own session cookie, or keep sending the token on each request.
      </p>

      <h2>6. Test it</h2>
      <ol>
        <li>
          Run your app and click <strong>Continue with Google</strong>. Use a
          Gmail that is on the tester list.
        </li>
        <li>
          After the popup closes you should see your email and a wallet address
          that starts with <code>5</code>.
        </li>
        <li>
          Click <strong>Check with my server</strong>. It should print your{" "}
          <code>userId</code> and <code>address</code>.
        </li>
        <li>
          Sign out and try again with the token removed: your server should
          answer <code>401</code>.
        </li>
      </ol>

      <h2>Troubleshooting</h2>
      <table>
        <thead>
          <tr>
            <th>You see</th>
            <th>Cause and fix</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>The login window opens blank or refuses to load</td>
            <td>
              Your site is not on the allow-list. Send the exact address,
              including <code>http://</code> or <code>https://</code> and the
              port.
            </td>
          </tr>
          <tr>
            <td>Google says &quot;Access blocked&quot;</td>
            <td>That Gmail is not a test user. Ask for it to be added.</td>
          </tr>
          <tr>
            <td>Popup does nothing</td>
            <td>The browser blocked it. Allow popups for your site.</td>
          </tr>
          <tr>
            <td>Stuck on &quot;Loading…&quot; for a minute</td>
            <td>Free hosting is waking up. Wait, then retry.</td>
          </tr>
          <tr>
            <td>
              <code>invalid_token</code> / <code>token_expired</code>
            </td>
            <td>
              Not a BitcodeX token, or older than an hour. Call{" "}
              <code>getAccessToken()</code> again.
            </td>
          </tr>
          <tr>
            <td>
              <code>wrong_audience</code>
            </td>
            <td>
              <code>BITCODEX_APP_ID</code> does not match the app the token was
              issued for.
            </td>
          </tr>
          <tr>
            <td>TypeScript errors inside the package types</td>
            <td>
              Set <code>skipLibCheck: true</code>.
            </td>
          </tr>
        </tbody>
      </table>

      <h2>Good to know</h2>
      <ul>
        <li>
          This is an <strong>early release for testnet</strong>. Do not use it
          with real funds. Mainnet is switched off.
        </li>
        <li>
          Wallet addresses are real Bittensor testnet accounts. Sending TAO
          needs testnet TAO; see{" "}
          <a href="/docs/networks">Networks &amp; testnet TAO</a>.
        </li>
        <li>
          You do not need the wallet features to use this for login. Ignoring
          them is fine.
        </li>
      </ul>
    </>
  );
}
