import { CodeBlock } from "@bitcodex-demo-web/components/docs/code_block";
import { Callout, Lead } from "@bitcodex-demo-web/components/docs/parts";

export default function Page() {
  return (
    <>
      <h1>Server: verify users</h1>
      <Lead>
        Your backend should never trust a user ID from the browser. Verify the
        signed access token instead, and optionally read the user from BitcodeX.
      </Lead>

      <h2>Verify an access token</h2>
      <p>
        <code>wallet.getAccessToken()</code> returns a short-lived (one hour)
        EdDSA token. <code>verifyAccessToken</code> checks its signature against
        the public keys your BitcodeX API publishes, plus the audience (your app
        ID) and issuer.
      </p>
      <CodeBlock
        title="Node / Next.js route"
        code={`import { verifyAccessToken } from "@bitcodex/server";

export async function GET(req: Request) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") ?? "";
  const result = await verifyAccessToken(token, {
    appId: process.env.BITCODEX_APP_ID!,
    apiUrl: process.env.BITCODEX_API_URL!, // e.g. https://api.your-domain.com
  });
  if (!result.success) {
    return Response.json({ error: result.err }, { status: 401 });
  }
  const { userId, address, expiresAt } = result.data;
  return Response.json({ userId, address });
}`}
      />
      <table>
        <thead>
          <tr>
            <th>Error</th>
            <th>Meaning</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>token_expired</td>
            <td>Older than an hour. Ask the SDK for a new one.</td>
          </tr>
          <tr>
            <td>invalid_signature</td>
            <td>Forged or altered token.</td>
          </tr>
          <tr>
            <td>wrong_audience</td>
            <td>The token belongs to a different app.</td>
          </tr>
          <tr>
            <td>wrong_issuer</td>
            <td>Not issued by your BitcodeX API.</td>
          </tr>
          <tr>
            <td>invalid_token</td>
            <td>Not a valid token at all.</td>
          </tr>
        </tbody>
      </table>

      <h2>Read users and wallets</h2>
      <CodeBlock
        code={`import { createServerClient } from "@bitcodex/server";

const bitcodex = createServerClient({
  apiUrl: process.env.BITCODEX_API_URL!,
  appId: process.env.BITCODEX_APP_ID!,
  appSecret: process.env.BITCODEX_APP_SECRET!, // server only
});

const user = await bitcodex.getUser(userId);       // linked accounts, created_at
const wallets = await bitcodex.getWallets(userId); // [{ chain: "bittensor", address }]`}
      />
      <Callout kind="warn">
        The <strong>app secret</strong> must stay on your server. Never put it
        in browser code or in a variable that starts with{" "}
        <code>NEXT_PUBLIC_</code>. If it leaks, rotate it in the developer
        dashboard.
      </Callout>
    </>
  );
}
